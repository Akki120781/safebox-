export type Language = 'javascript' | 'typescript' | 'python' | 'bash';

export type IsolationLevel = 'wasm-isolate' | 'process-sandbox' | 'hardened-jail';

export interface ExecutionLimits {
  timeoutMs: number;
  memoryLimitMb: number;
  maxOutputBytes: number;
  allowNetwork: boolean;
  allowFilesystem: boolean;
}

export interface ExecutionRequest {
  code: string;
  language: Language;
  limits?: Partial<ExecutionLimits>;
  stdin?: string;
  env?: Record<string, string>;
  sandboxId?: string;
}

export interface SecurityViolation {
  ruleId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  description: string;
  line?: number;
  matchedPattern?: string;
  blocked: boolean;
}

export interface ExecutionResult {
  sandboxId: string;
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  coldStartLatencyMs: number;
  peakMemoryMb: number;
  isolationLevel: IsolationLevel;
  securityViolations: SecurityViolation[];
  killedByWatchdog: boolean;
  error?: string;
  timestamp: string;
}

export interface SandboxMetrics {
  totalExecutions: number;
  activeSandboxes: number;
  blockedAttacksCount: number;
  avgColdStartMs: number;
  avgExecutionMs: number;
  recentViolations: SecurityViolation[];
}
