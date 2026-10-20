import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SafeBoxEngine } from '../engine/sandbox-engine.js';
import { ExecutionRequest } from '../engine/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.SAFEBOX_PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Serve static frontend assets
const publicDir = path.join(__dirname, '../../public');
app.use(express.static(publicDir));

// Health check
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    engine: 'SafeBox v1.0.0',
    runtimes: ['v8-wasm-isolate', 'process-sandbox'],
    securityAnalyzer: 'active',
    timestamp: new Date().toISOString()
  });
});

// Code execution endpoint
app.post('/api/v1/execute', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, language = 'javascript', limits, env, stdin } = req.body;

    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'Code payload string is required.' });
      return;
    }

    const request: ExecutionRequest = {
      code,
      language,
      limits,
      env,
      stdin
    };

    const result = await SafeBoxEngine.execute(request);
    res.json(result);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Internal sandbox execution failure', detail: errorMsg });
  }
});

// Telemetry & metrics endpoint
app.get('/api/v1/metrics', (_req: Request, res: Response) => {
  res.json(SafeBoxEngine.getMetrics());
});

// Execution history endpoint
app.get('/api/v1/history', (_req: Request, res: Response) => {
  res.json(SafeBoxEngine.getHistory());
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🛡️  SafeBox Sandboxed Code Execution Engine Active`);
  console.log(`📍 Web Dashboard: http://localhost:${PORT}`);
  console.log(`🔌 REST API:      http://localhost:${PORT}/api/v1/execute`);
  console.log(`📊 Telemetry:     http://localhost:${PORT}/api/v1/metrics`);
  console.log(`======================================================\n`);
});
