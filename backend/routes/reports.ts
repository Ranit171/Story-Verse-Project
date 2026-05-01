import { Router } from 'express';
import { Report } from '../models/Report.js';
import { User } from '../models/User.js';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const report = new Report(req.body);
    await report.save();

    const { target_type, target_id } = req.body;
    let targetUser: any;

    if (target_type === 'user') {
      targetUser = await User.findOneAndUpdate({ id: target_id }, { $inc: { report_count: 1 } }, { returnDocument: 'after' });
      if (targetUser && targetUser.report_count >= 5) {
        const banDate = new Date();
        banDate.setDate(banDate.getDate() + 7); // 7 day ban
        await User.findOneAndUpdate({ id: target_id }, { banned_until: banDate });
      }
    } else if (target_type === 'post') {
      const post = await Post.findOneAndUpdate({ id: target_id }, { $inc: { report_count: 1 } }, { returnDocument: 'after' });
      if (post) {
        targetUser = await User.findOneAndUpdate({ id: post.user_id }, { $inc: { report_count: 1 } }, { returnDocument: 'after' });
      }
    } else if (target_type === 'comment') {
      const comment = await Comment.findOneAndUpdate({ id: target_id }, { $inc: { report_count: 1 } }, { returnDocument: 'after' });
      if (comment) {
        targetUser = await User.findOneAndUpdate({ id: comment.user_id }, { $inc: { report_count: 1 } }, { returnDocument: 'after' });
      }
    }

    if (targetUser && targetUser.report_count >= 10) {
      const banDate = new Date();
      banDate.setDate(banDate.getDate() + 30); // 30 day ban for repeat offenders
      await User.findOneAndUpdate({ id: targetUser.id }, { banned_until: banDate });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/check', async (req, res) => {
  const { reporterId, targetType, targetId } = req.query;
  try {
    const report = await Report.findOne({ reporter_id: reporterId, target_type: targetType, target_id: targetId });
    res.json({ reported: !!report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
