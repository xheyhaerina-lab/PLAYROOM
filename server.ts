import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { envConfig, logStartupDiagnostics } from './server/config.ts';
import { apiRouter } from './server/routes/api.ts';
import { multiplayerHub } from './server/wsHub.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  logStartupDiagnostics();

  const app = express();
  app.set('trust proxy', 1);

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Preserve raw body for payment webhook HMAC signature verification
  app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api/webhooks/payments')) {
      next();
    } else {
      express.json({ limit: '1mb' })(req, res, next);
    }
  });

  app.use('/api', apiRouter);

  const server = http.createServer(app);
  multiplayerHub.attach(server);

  const distDir = path.resolve(__dirname, 'dist');
  const isProd = envConfig.appEnv === 'production' && fs.existsSync(distDir);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(envConfig.port, '0.0.0.0', () => {
    console.log(`[PLAYROOM] Server listening on http://0.0.0.0:${envConfig.port}`);
  });
}

startServer().catch((err) => {
  console.error('[PLAYROOM] Fatal startup error:', err);
  process.exit(1);
});
