import { Router } from 'express';
import mongoose from 'mongoose';
import { dbError } from '../config/db.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    connected: mongoose.connection.readyState === 1,
    status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    error: dbError
  });
});

export default router;
