import { Router } from 'express';
import { Follow } from '../models/Follow.js';
import { User } from '../models/User.js';

const router = Router();

router.get('/stats/:userId', async (req, res) => {
  try {
    const followers = await Follow.countDocuments({ following_id: req.params.userId });
    const following = await Follow.countDocuments({ follower_id: req.params.userId });
    res.json({ followers, following });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/is-following', async (req, res) => {
  const { followerId, followingId } = req.query;
  try {
    const follow = await Follow.findOne({ follower_id: followerId, following_id: followingId });
    res.json({ isFollowing: !!follow });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const follow = new Follow(req.body);
    await follow.save();
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/', async (req, res) => {
  const { followerId, followingId } = req.query;
  try {
    await Follow.deleteOne({ follower_id: followerId, following_id: followingId });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/followers/:userId', async (req, res) => {
  try {
    const follows = await Follow.find({ following_id: req.params.userId });
    const userIds = follows.map(f => f.follower_id);
    const users = await User.find({ id: { $in: userIds } });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/following/:userId', async (req, res) => {
  try {
    const follows = await Follow.find({ follower_id: req.params.userId });
    const userIds = follows.map(f => f.following_id);
    const users = await User.find({ id: { $in: userIds } });
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
