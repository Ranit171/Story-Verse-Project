import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  post_id: { type: String, required: true },
  user_id: { type: String, required: true },
  username: { type: String, required: true },
  content: { type: String, required: true },
  report_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

export const Comment = mongoose.model('Comment', CommentSchema);
