import { Language, SecurityViolation } from './types.js';

interface SecurityRule {
  id: string;
  name: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  languages: Language[];
  patterns: RegExp[];
  description: string;
  autoBlock: boolean;
}

const SECURITY_RULES: SecurityRule[] = [
  {
    id: 'SEC-001-SHELL-INJECTION',
    name: 'Arbitrary Shell / Process Spawning',
    severity: 'CRITICAL',
    languages: ['javascript', 'typescript', 'python', 'bash'],
    patterns: [
      /(child_process|execSync|spawnSync|fork\s*\(|subprocess\.Popen|subprocess\.run|os\.system|commands\.getoutput)/i,
      /\b(eval\s*\(|exec\s*\(|__import__\s*\(\s*['"]os['"]\))/i,
      /\b(sh\s+-c|bash\s+-c|\/bin\/sh|\/bin\/bash)\b/i
    ],
    description: 'Attempt to escape sandbox by invoking host OS shell or spawning uncontained child processes.',
    autoBlock: true
  },
  {
    id: 'SEC-002-HOST-FS-TRAVERSAL',
    name: 'Host Filesystem Tampering & Secret Exfiltration',
    severity: 'CRITICAL',
    languages: ['javascript', 'typescript', 'python', 'bash'],
    patterns: [
      /(\/etc\/passwd|\/etc\/shadow|c:\\windows|\.ssh\/id_rsa|\.aws\/credentials|\.env\b)/i,
      /(fs\.(rmdir|unlink|rmSync|chmod|chown)|os\.(remove|rmdir|walk))/i,
      /(open\s*\(\s*['"][./\\]*(\.env|\.ssh|\/etc|c:))/i
    ],
    description: 'Prohibited read/write access to host operating system roots, secrets, or credential stores.',
    autoBlock: true
  },
  {
    id: 'SEC-003-NETWORK-EXFILTRATION',
    name: 'Unauthorized Network Socket / Tunnel Creation',
    severity: 'HIGH',
    languages: ['javascript', 'typescript', 'python', 'bash'],
    patterns: [
      /(socket\.socket|net\.connect|http\.request|urllib\.request|requests\.(post|get)|fetch\s*\()/i,
      /(curl\s+|wget\s+|nc\s+-e|ncat\s+|telnet\s+)/i
    ],
    description: 'Outbound network connection attempt detected while sandbox network policy is set to ISOLATED (no egress).',
    autoBlock: false // conditionally blocked if allowNetwork is false
  },
  {
    id: 'SEC-004-DOS-FORK-BOMB',
    name: 'Resource Exhaustion & Fork Bomb Pattern',
    severity: 'CRITICAL',
    languages: ['javascript', 'typescript', 'python', 'bash'],
    patterns: [
      /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/,
      /while\s*\(\s*(?:true|1)\s*\)\s*\{[^}]*\bfork\s*\(/i,
      /for\s+_+\s+in\s+range\s*\(\s*10\s*\*{4,}\s*\d+\s*\)/i,
      /Array\s*\(\s*2\s*\*{3,}\s*\d+\s*\)/i
    ],
    description: 'Denial of Service attempt via exponential recursion, memory flooding, or process fork bombing.',
    autoBlock: true
  },
  {
    id: 'SEC-005-ENVIRONMENT-HARVESTING',
    name: 'Host Environment Variable Dumping',
    severity: 'HIGH',
    languages: ['javascript', 'typescript', 'python'],
    patterns: [
      /(process\.env\b|os\.environ\b|System\.getenv)/i
    ],
    description: 'Attempt to inspect global environment variables containing host API keys or tokens.',
    autoBlock: false
  }
];

export class SecurityAnalyzer {
  public static analyze(code: string, language: Language, allowNetwork: boolean = false): {
    isSafe: boolean;
    violations: SecurityViolation[];
  } {
    const violations: SecurityViolation[] = [];
    const lines = code.split('\n');

    for (const rule of SECURITY_RULES) {
      if (!rule.languages.includes(language)) continue;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pattern of rule.patterns) {
          if (pattern.test(line)) {
            // Check if network rule can be bypassed if allowNetwork is true
            const isBlocked = rule.id === 'SEC-003-NETWORK-EXFILTRATION' 
              ? !allowNetwork 
              : rule.autoBlock;

            violations.push({
              ruleId: rule.id,
              severity: rule.severity,
              description: rule.description,
              line: i + 1,
              matchedPattern: line.trim(),
              blocked: isBlocked
            });
            break;
          }
        }
      }
    }

    const hasBlockingViolation = violations.some(v => v.blocked);
    return {
      isSafe: !hasBlockingViolation,
      violations
    };
  }
}
