import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { initDb, getDbInfo, query } from './db/index.js';
import { runSeed } from './db/seed.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

const app = express();

// Security & Cross-Origin Resource Sharing
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Payload parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in dev
if (config.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.url}`);
    next();
  });
}

// Mount master API router
app.use('/api', apiRoutes);

// Catch-all 404 for undefined API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// In production or when client is built, serve frontend static files
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // Catch-all 404 for undefined routes if client is not built
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    });
  });
}

// Centralized error handler
app.use(errorHandler);

// Server startup with DB initialization
async function startServer() {
  try {
    console.log('--------------------------------------------------');
    console.log('🚀 Starting EduMentor AI Backend Service...');
    await initDb();
    const dbInfo = getDbInfo();

    // Auto-seed demo accounts and course data if database is empty
    try {
      const userCountRes = await query('SELECT COUNT(*) as count FROM users');
      const userCount = parseInt(userCountRes.rows[0]?.count || '0', 10);
      if (userCount === 0) {
        console.log('🌱 Database is empty. Running initial demo seed...');
        await runSeed();
      }
    } catch (seedErr) {
      console.warn('⚠️ Auto-seed check notice:', seedErr.message);
    }

    app.listen(config.port, '0.0.0.0', () => {
      console.log(`✅ Server running on http://0.0.0.0:${config.port}`);
      console.log(`📊 Active Database Engine: ${dbInfo.engine}`);
      console.log(`🤖 AI Service Status: ${config.geminiApiKey ? 'Live Gemini 1.5/2.0 API' : 'Intelligent Local Advisor Engine'}`);
      console.log('--------------------------------------------------');
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

export default app;
