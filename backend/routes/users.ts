import { Router } from 'express';
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import { Follow } from '../models/Follow.js';
import { Report } from '../models/Report.js';

const router = Router();

router.get('/:id', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate({ id: req.params.id }, req.body, { returnDocument: 'after' });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    await User.deleteOne({ id: userId });
    await Post.deleteMany({ user_id: userId });
    await Comment.deleteMany({ user_id: userId });
    await Follow.deleteMany({ $or: [{ follower_id: userId }, { following_id: userId }] });
    await Report.deleteMany({ $or: [{ reporter_id: userId }, { target_id: userId, target_type: 'user' }] });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
