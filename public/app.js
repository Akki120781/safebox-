// Preset code snippets
const PRESETS = {
  'safe-math': {
    language: 'javascript',
    filename: 'benchmark_primes.js',
    code: `// Safe high-performance computation
function benchmarkPrimes(limit) {
  const primes = [];
  for (let i = 2; i <= limit; i++) {
    let isPrime = true;
    for (let j = 2; j * j <= i; j++) {
      if (i % j === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) primes.push(i);
  }
  return primes;
}

console.log("🚀 Initializing SafeBox isolated V8 runtime...");
const t0 = Date.now();
const primes = benchmarkPrimes(5000);
const elapsed = Date.now() - t0;

console.log(\`✅ Found \${primes.length} prime numbers in \${elapsed}ms.\`);
console.log("First 10 primes:", primes.slice(0, 10).join(', '));
console.log("Last 5 primes: ", primes.slice(-5).join(', '));
`
  },
  'infinite-loop': {
    language: 'javascript',
    filename: 'runaway_loop.js',
    code: `// Attack Simulation: Infinite CPU Exhaustion Loop
console.log("⚠️ Simulating runaway agent loop without termination...");
console.log("SafeBox hardware watchdog will intercept and force SIGKILL within quota.");

let counter = 0;
while (true) {
  counter++;
  // Unbounded execution
}
`
  },
  'shell-escape': {
    language: 'javascript',
    filename: 'escape_exploit.js',
    code: `// Attack Simulation: Host Shell Command Execution
console.log("⚠️ Attempting sandbox escape via child_process...");

const { execSync } = require('child_process');
const output = execSync('dir C:\\\\Windows');
console.log("Host files:", output.toString());
`
  },
  'env-exfiltration': {
    language: 'python',
    filename: 'secret_dump.py',
    code: `# Attack Simulation: Secret / Environment Exfiltration
print("⚠️ Attempting to dump host environment and read secret files...")

with open('.env', 'r') as f:
    secret_key = f.read()
    print("Stolen key:", secret_key)
`
  },
  'memory-bomb': {
    language: 'javascript',
    filename: 'heap_bomb.js',
    code: `// Attack Simulation: Memory Exhaustion Flooding
console.log("⚠️ Attempting heap memory exhaustion attack...");

const bomb = [];
while (true) {
  bomb.push(new Array(10000000).fill("MALICIOUS_PAYLOAD"));
}
`
  },
  'network-egress': {
    language: 'python',
    filename: 'reverse_shell.py',
    code: `# Attack Simulation: Outbound Socket Reverse Tunnel
import socket

print("⚠️ Attempting unauthorized outbound socket connection to remote C2...")
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(("8.8.8.8", 53))
print("Connected!")
`
  }
};

// DOM Elements
const codeInput = document.getElementById('code-input');
const lineNumbers = document.getElementById('line-numbers');
const languageSelect = document.getElementById('language-select');
const activeFilename = document.getElementById('active-filename');
const timeoutRange = document.getElementById('timeout-range');
const timeoutVal = document.getElementById('timeout-val');
const memoryRange = document.getElementById('memory-range');
const memoryVal = document.getElementById('memory-val');
const networkToggle = document.getElementById('network-toggle');
const runBtn = document.getElementById('run-btn');

// Terminal Elements
const terminalOutput = document.getElementById('terminal-output');
const terminalStatusTag = document.getElementById('terminal-status-tag');
const clearTermBtn = document.getElementById('clear-term-btn');
const termExitStatus = document.getElementById('term-exit-status');
const termExecTime = document.getElementById('term-exec-time');
const termBytes = document.getElementById('term-bytes');

// Header & Telemetry Elements
const securityChip = document.getElementById('security-chip');
const securityChipText = document.getElementById('security-chip-text');
const metricColdStart = document.getElementById('metric-cold-start');
const metricAttacks = document.getElementById('metric-attacks');

const statColdStart = document.getElementById('stat-cold-start');
const statExecTime = document.getElementById('stat-exec-time');
const statMemory = document.getElementById('stat-memory');
const statVerdict = document.getElementById('stat-verdict');
const statVerdictSub = document.getElementById('stat-verdict-sub');
const meterVerdictFill = document.getElementById('meter-verdict-fill');
const violationsList = document.getElementById('violations-list');

const copyCurlBtn = document.getElementById('copy-curl-btn');
const copyFetchBtn = document.getElementById('copy-fetch-btn');

// Update line numbers
function updateLineNumbers() {
  const lines = codeInput.value.split('\n').length;
  lineNumbers.innerHTML = Array.from({ length: Math.max(1, lines) }, (_, i) => i + 1).join('<br>');
}

codeInput.addEventListener('input', updateLineNumbers);
codeInput.addEventListener('scroll', () => {
  lineNumbers.scrollTop = codeInput.scrollTop;
});

// Range inputs
timeoutRange.addEventListener('input', () => {
  timeoutVal.textContent = `${timeoutRange.value}ms`;
});
memoryRange.addEventListener('input', () => {
  memoryVal.textContent = `${memoryRange.value}MB`;
});

// Preset buttons
document.querySelectorAll('.preset-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    document.querySelectorAll('.preset-tag').forEach(t => t.classList.remove('active'));
    tag.classList.add('active');

    const presetKey = tag.getAttribute('data-preset');
    const selected = PRESETS[presetKey];
    if (selected) {
      languageSelect.value = selected.language;
      activeFilename.textContent = selected.filename;
      codeInput.value = selected.code.trim();
      updateLineNumbers();
    }
  });
});

// Language switcher
languageSelect.addEventListener('change', () => {
  const lang = languageSelect.value;
  activeFilename.textContent = lang === 'python' ? 'sandbox_entrypoint.py' : 'sandbox_entrypoint.js';
  
  if (lang === 'python' && codeInput.value.includes('benchmarkPrimes')) {
    codeInput.value = `# Safe high-performance Python computation
import time

def compute_primes(limit):
    primes = []
    for i in range(2, limit + 1):
        is_prime = True
        for j in range(2, int(i ** 0.5) + 1):
            if i % j == 0:
                is_prime = False
                break
        if is_prime:
            primes.append(i)
    return primes

print("🚀 Initializing SafeBox isolated Python jail...")
t0 = time.perf_counter()
primes = compute_primes(5000)
elapsed = (time.perf_counter() - t0) * 1000

print(f"✅ Found {len(primes)} primes in {elapsed:.2f}ms.")
print("First 10 primes:", primes[:10])
print("Last 5 primes: ", primes[-5:])
`;
    updateLineNumbers();
  }
});

// Tab Switcher
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    btn.classList.add('active');
    const tabId = btn.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');
  });
});

// Clear terminal
clearTermBtn.addEventListener('click', () => {
  terminalOutput.textContent = '// Terminal cleared.\n// Ready for execution stream...\n';
  terminalStatusTag.textContent = 'STATUS: READY';
  terminalStatusTag.style.color = 'var(--text-muted)';
  termExitStatus.textContent = 'Exit: --';
  termExecTime.textContent = 'Time: --';
  termBytes.textContent = 'Output: 0 B';
});

// Copy cURL
copyCurlBtn.addEventListener('click', () => {
  const snippet = document.getElementById('curl-snippet').textContent;
  navigator.clipboard.writeText(snippet);
  copyCurlBtn.textContent = 'Copied!';
  setTimeout(() => copyCurlBtn.textContent = 'Copy cURL', 2000);
});

// Copy Python
if (copyFetchBtn) {
  copyFetchBtn.addEventListener('click', () => {
    const snippet = document.getElementById('py-snippet').textContent;
    navigator.clipboard.writeText(snippet);
    copyFetchBtn.textContent = 'Copied!';
    setTimeout(() => copyFetchBtn.textContent = 'Copy Python', 2000);
  });
}

// Execute Code
async function runExecution() {
  const code = codeInput.value.trim();
  if (!code) return;

  runBtn.disabled = true;
  runBtn.innerHTML = '<span class="pulse-dot"></span> Running...';
  terminalStatusTag.textContent = 'STATUS: EXECUTING IN SANDBOX...';
  terminalStatusTag.style.color = 'var(--cyan-primary)';

  const payload = {
    code,
    language: languageSelect.value,
    limits: {
      timeoutMs: parseInt(timeoutRange.value, 10),
      memoryLimitMb: parseInt(memoryRange.value, 10),
      allowNetwork: networkToggle.checked
    }
  };

  try {
    const res = await fetch('/api/v1/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    // Render terminal output
    let output = '';
    if (data.stdout) output += data.stdout;
    if (data.stderr) output += data.stderr;
    if (!data.stdout && !data.stderr && data.error) output += `[ERROR] ${data.error}\n`;

    terminalOutput.textContent = output || '// [No output produced]\n';
    terminalOutput.scrollTop = terminalOutput.scrollHeight;

    // Terminal footer metrics
    termExitStatus.textContent = `Exit: ${data.exitCode}`;
    termExecTime.textContent = `Time: ${data.executionTimeMs}ms`;
    termBytes.textContent = `Output: ${output.length} B`;

    // Update status tag
    if (data.exitCode === 403) {
      terminalStatusTag.textContent = 'STATUS: BLOCKED BY SECURITY SHIELD';
      terminalStatusTag.style.color = 'var(--crimson-primary)';
      securityChipText.textContent = 'Threat Intercepted & Contained';
      securityChip.querySelector('.chip-dot').style.background = 'var(--crimson-primary)';
      securityChip.querySelector('.chip-dot').style.boxShadow = '0 0 8px var(--crimson-primary)';
      
      statVerdict.textContent = 'BLOCKED (403)';
      statVerdict.className = 'stat-number text-crimson';
      statVerdictSub.textContent = 'Pre-flight static analyzer rejected attack payload';
      meterVerdictFill.className = 'meter-fill crimson';
      meterVerdictFill.style.width = '100%';

    } else if (data.killedByWatchdog) {
      terminalStatusTag.textContent = 'STATUS: WATCHDOG SIGKILL (137)';
      terminalStatusTag.style.color = 'var(--amber-primary)';
      securityChipText.textContent = 'Resource Quota Exceeded';
      securityChip.querySelector('.chip-dot').style.background = 'var(--amber-primary)';
      securityChip.querySelector('.chip-dot').style.boxShadow = '0 0 8px var(--amber-primary)';

      statVerdict.textContent = 'KILLED (WATCHDOG)';
      statVerdict.className = 'stat-number text-amber';
      statVerdictSub.textContent = 'Hardware timer terminated runaway thread';
      meterVerdictFill.className = 'meter-fill amber';
      meterVerdictFill.style.width = '80%';

    } else if (data.success) {
      terminalStatusTag.textContent = 'STATUS: COMPLETED (0)';
      terminalStatusTag.style.color = 'var(--emerald-primary)';
      securityChipText.textContent = 'Execution Clean & Contained';
      securityChip.querySelector('.chip-dot').style.background = 'var(--emerald-primary)';
      securityChip.querySelector('.chip-dot').style.boxShadow = '0 0 8px var(--emerald-primary)';

      statVerdict.textContent = 'SECURE (PASS)';
      statVerdict.className = 'stat-number text-emerald';
      statVerdictSub.textContent = 'Clean sandbox boundary, zero leaks';
      meterVerdictFill.className = 'meter-fill emerald';
      meterVerdictFill.style.width = '100%';

    } else {
      terminalStatusTag.textContent = `STATUS: RUNTIME EXCEPTION (${data.exitCode})`;
      terminalStatusTag.style.color = 'var(--amber-primary)';
      securityChipText.textContent = 'Runtime Exception in Sandbox';
      securityChip.querySelector('.chip-dot').style.background = 'var(--amber-primary)';
      securityChip.querySelector('.chip-dot').style.boxShadow = '0 0 8px var(--amber-primary)';

      statVerdict.textContent = `EXIT (${data.exitCode})`;
      statVerdict.className = 'stat-number text-amber';
      statVerdictSub.textContent = 'Handled gracefully without host leak';
      meterVerdictFill.className = 'meter-fill amber';
      meterVerdictFill.style.width = '50%';
    }

    // Telemetry updates
    statColdStart.textContent = `${data.coldStartLatencyMs} ms`;
    statExecTime.textContent = `${data.executionTimeMs} ms`;
    statMemory.textContent = `${data.peakMemoryMb} MB`;

    // Render security violations
    if (data.securityViolations && data.securityViolations.length > 0) {
      violationsList.innerHTML = data.securityViolations.map(v => `
        <div class="violation-entry">
          <strong style="color: #f87171;">[${v.severity}] ${v.ruleId}</strong><br>
          ${v.description}<br>
          <span style="color: #94a3b8; font-size: 0.72rem;">Line ${v.line}: <code style="color: #fecaca;">${escapeHtml(v.matchedPattern || '')}</code></span>
        </div>
      `).join('');
    } else {
      violationsList.innerHTML = '<div class="empty-log">No security violations recorded for this execution.</div>';
    }

    // Refresh global metrics
    fetchMetrics();

  } catch (err) {
    terminalOutput.textContent = `[FETCH ERROR] Failed to connect to SafeBox engine: ${err.message}\n`;
    terminalStatusTag.textContent = 'STATUS: SERVER ERROR';
    terminalStatusTag.style.color = 'var(--crimson-primary)';
  } finally {
    runBtn.disabled = false;
    runBtn.innerHTML = '<span class="btn-icon">▶</span><span>Execute in Sandbox</span><span class="btn-kbd">Ctrl + Enter</span>';
  }
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function fetchMetrics() {
  try {
    const res = await fetch('/api/v1/metrics');
    const metrics = await res.json();
    metricColdStart.textContent = `${metrics.avgColdStartMs || 0.54} ms`;
    metricAttacks.textContent = metrics.blockedAttacksCount || 0;
  } catch {
    // Non-critical
  }
}

runBtn.addEventListener('click', runExecution);

// Keyboard shortcut (Ctrl+Enter or Cmd+Enter)
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    runExecution();
  }
});

// Initialize on load
codeInput.value = PRESETS['safe-math'].code.trim();
updateLineNumbers();
fetchMetrics();
