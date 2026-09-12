import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { initDb, getDbInfo } from './db/index.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// Security & Cross-Origin Resource Sharing
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
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

// Catch-all 404 for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handler
app.use(errorHandler);

// Server startup with DB initialization
async function startServer() {
  try {
    console.log('--------------------------------------------------');
    console.log('🚀 Starting EduMentor AI Backend Service...');
    await initDb();
    const dbInfo = getDbInfo();

    app.listen(config.port, () => {
      console.log(`✅ Server running on http://localhost:${config.port}`);
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
