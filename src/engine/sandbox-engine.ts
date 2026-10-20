import crypto from 'node:crypto';
import { ExecutionRequest, ExecutionResult, ExecutionLimits, SandboxMetrics, SecurityViolation } from './types.js';
import { SecurityAnalyzer } from './security-analyzer.js';
import { WasmIsolateRunner } from './wasm-isolate-runner.js';
import { ProcessSandboxRunner } from './process-sandbox-runner.js';

const DEFAULT_LIMITS: ExecutionLimits = {
  timeoutMs: 3000,
  memoryLimitMb: 64,
  maxOutputBytes: 512 * 1024, // 512 KB
  allowNetwork: false,
  allowFilesystem: false
};

export class SafeBoxEngine {
  private static executionHistory: ExecutionResult[] = [];
  private static activeSandboxesCount = 0;
  private static totalBlockedAttacks = 0;

  public static async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const sandboxId = request.sandboxId || crypto.randomUUID().slice(0, 8);
    const limits: ExecutionLimits = { ...DEFAULT_LIMITS, ...request.limits };
    const allowNetwork = limits.allowNetwork;

    this.activeSandboxesCount++;

    try {
      // 1. Static Security Analysis (Pre-Execution Guardrails)
      const securityScan = SecurityAnalyzer.analyze(request.code, request.language, allowNetwork);
      
      // If critical violations blocked the code, reject execution before it can touch any runtime
      if (!securityScan.isSafe) {
        this.totalBlockedAttacks++;
        const blockedResult: ExecutionResult = {
          sandboxId,
          success: false,
          stdout: '',
          stderr: `[SAFEBOX_CONTAINMENT_TRIGGERED] Execution blocked by security policy.\nViolations detected:\n` +
            securityScan.violations.map(v => `  - [${v.severity}] ${v.ruleId}: ${v.description} (Line ${v.line})`).join('\n') + '\n',
          exitCode: 403,
          executionTimeMs: 0,
          coldStartLatencyMs: 0.12,
          peakMemoryMb: 0,
          isolationLevel: 'hardened-jail',
          securityViolations: securityScan.violations,
          killedByWatchdog: false,
          error: 'Code blocked by pre-execution sandbox security analyzer',
          timestamp: new Date().toISOString()
        };

        this.recordTelemetry(blockedResult);
        return blockedResult;
      }

      // 2. Route to appropriate sandbox isolation runtime
      let result: ExecutionResult;
      if (request.language === 'javascript' || request.language === 'typescript') {
        result = await WasmIsolateRunner.execute(request.code, sandboxId, limits, securityScan.violations);
      } else {
        result = await ProcessSandboxRunner.execute(request.code, request.language, sandboxId, limits, securityScan.violations);
      }

      this.recordTelemetry(result);
      return result;

    } finally {
      this.activeSandboxesCount = Math.max(0, this.activeSandboxesCount - 1);
    }
  }

  private static recordTelemetry(result: ExecutionResult) {
    this.executionHistory.unshift(result);
    if (this.executionHistory.length > 100) {
      this.executionHistory.pop();
    }
  }

  public static getMetrics(): SandboxMetrics {
    const total = this.executionHistory.length;
    const completed = this.executionHistory.filter(r => r.exitCode !== 403);
    
    const avgColdStart = completed.length > 0
      ? completed.reduce((sum, r) => sum + r.coldStartLatencyMs, 0) / completed.length
      : 0;

    const avgExec = completed.length > 0
      ? completed.reduce((sum, r) => sum + r.executionTimeMs, 0) / completed.length
      : 0;

    const allViolations: SecurityViolation[] = [];
    for (const item of this.executionHistory) {
      if (item.securityViolations && item.securityViolations.length > 0) {
        allViolations.push(...item.securityViolations);
      }
    }

    return {
      totalExecutions: total,
      activeSandboxes: this.activeSandboxesCount,
      blockedAttacksCount: this.totalBlockedAttacks,
      avgColdStartMs: parseFloat(avgColdStart.toFixed(2)),
      avgExecutionMs: parseFloat(avgExec.toFixed(2)),
      recentViolations: allViolations.slice(0, 10)
    };
  }

  public static getHistory(): ExecutionResult[] {
    return this.executionHistory;
  }
}
