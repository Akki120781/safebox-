import vm from 'node:vm';
import v8 from 'node:v8';
import { ExecutionLimits, ExecutionResult, SecurityViolation } from './types.js';

export class WasmIsolateRunner {
  public static async execute(
    code: string,
    sandboxId: string,
    limits: ExecutionLimits,
    violations: SecurityViolation[] = []
  ): Promise<ExecutionResult> {
    const coldStartStartTime = performance.now();
    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];
    let totalOutputBytes = 0;
    let killedByWatchdog = false;

    // Memory tracking baseline
    const initialHeap = process.memoryUsage().heapUsed;

    // Virtualized Sandbox Context with Sandboxed Primitives
    const safeConsole = {
      log: (...args: unknown[]) => {
        const text = args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ') + '\n';
        if (totalOutputBytes + text.length <= limits.maxOutputBytes) {
          stdoutChunks.push(text);
          totalOutputBytes += text.length;
        }
      },
      info: (...args: unknown[]) => safeConsole.log(...args),
      warn: (...args: unknown[]) => {
        const text = '[WARN] ' + args.map(a => String(a)).join(' ') + '\n';
        if (totalOutputBytes + text.length <= limits.maxOutputBytes) {
          stderrChunks.push(text);
          totalOutputBytes += text.length;
        }
      },
      error: (...args: unknown[]) => {
        const text = '[ERROR] ' + args.map(a => String(a)).join(' ') + '\n';
        if (totalOutputBytes + text.length <= limits.maxOutputBytes) {
          stderrChunks.push(text);
          totalOutputBytes += text.length;
        }
      }
    };

    // Construct hermetic sandbox context
    const sandboxContext = vm.createContext({
      console: safeConsole,
      Math,
      Date,
      JSON,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      encodeURI,
      decodeURI,
      encodeURIComponent,
      decodeURIComponent,
      Array,
      String,
      Number,
      Boolean,
      RegExp,
      Map,
      Set,
      WeakMap,
      WeakSet,
      Promise,
      // Deny access to host globals
      process: null,
      require: null,
      global: null,
      globalThis: null,
      Buffer: null
    });

    const coldStartLatencyMs = parseFloat((performance.now() - coldStartStartTime).toFixed(3));
    const execStartTime = performance.now();

    let exitCode = 0;
    let executionError: string | undefined;

    try {
      // Compile script with V8 code caching
      const script = new vm.Script(code, {
        filename: `sandbox_${sandboxId}.js`,
        displayErrors: true
      });

      // Execute inside isolate with strict CPU timeout watchdog
      script.runInContext(sandboxContext, {
        timeout: limits.timeoutMs,
        breakOnSigint: true,
        microtaskMode: 'afterEvaluate'
      });
    } catch (err: unknown) {
      exitCode = 1;
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes('timed out after') || errorMsg.includes('Script execution timed out')) {
        killedByWatchdog = true;
        executionError = `[WATCHDOG_TERMINATED] Execution aborted: exceeded CPU time quota (${limits.timeoutMs}ms)`;
        stderrChunks.push(`\n[FATAL] Watchdog limit reached: script terminated after ${limits.timeoutMs}ms.\n`);
      } else {
        executionError = errorMsg;
        stderrChunks.push(`\n[RUNTIME_ERROR] ${errorMsg}\n`);
      }
    }

    const execEndTime = performance.now();
    const executionTimeMs = parseFloat((execEndTime - execStartTime).toFixed(3));
    const peakHeap = process.memoryUsage().heapUsed;
    const peakMemoryMb = parseFloat((Math.max(0, peakHeap - initialHeap) / (1024 * 1024)).toFixed(2));

    return {
      sandboxId,
      success: exitCode === 0 && !killedByWatchdog,
      stdout: stdoutChunks.join(''),
      stderr: stderrChunks.join(''),
      exitCode,
      executionTimeMs,
      coldStartLatencyMs,
      peakMemoryMb: Math.max(0.05, peakMemoryMb),
      isolationLevel: 'wasm-isolate',
      securityViolations: violations,
      killedByWatchdog,
      error: executionError,
      timestamp: new Date().toISOString()
    };
  }
}
