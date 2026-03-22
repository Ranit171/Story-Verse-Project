import { Router } from 'express';
import { Comment } from '../models/Comment.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const comment = new Comment(req.body);
    await comment.save();
    res.json({ success: true, comment });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
