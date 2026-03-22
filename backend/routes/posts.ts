import { Router } from 'express';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ created_at: -1 });
    const postsWithComments = await Promise.all(posts.map(async (post) => {
      const comments = await Comment.find({ post_id: post.id }).sort({ created_at: 1 });
      return { ...post.toObject(), comments };
    }));
    res.json(postsWithComments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const post = new Post(req.body);
    await post.save();
    res.json({ success: true, post });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json(post);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Post.deleteOne({ id: req.params.id });
    await Comment.deleteMany({ post_id: req.params.id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
