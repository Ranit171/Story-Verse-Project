import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB, dbError } from './config/db.js';

// Import Routers
import statusRoutes from './routes/status.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import commentRoutes from './routes/comments.js';
import followRoutes from './routes/follows.js';
import reportRoutes from './routes/reports.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// MongoDB Connection is handled dynamically per-request in the middleware below
// to support Vercel serverless cold starts properly.

// Middleware to check/establish DB connection for API routes
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') && req.path !== '/api/db-status') {
    if ((mongoose.connection.readyState as number) !== 1) {
      await connectDB();
      if ((mongoose.connection.readyState as number) !== 1) {
        return res.status(503).json({
          success: false,
          error: 'Database not connected. Cold start failed.',
          details: dbError
        });
      }
    }
  }
  next();
});

// API Routes
// Note: we mount statusRoutes at /api/db-status because the router defines `/`
app.use('/api/db-status', statusRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/follows', followRoutes);
app.use('/api/reports', reportRoutes);

// --- Vite Middleware ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: path.resolve(__dirname, '../frontend'),
      configFile: path.resolve(__dirname, '../vite.config.ts'),
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
