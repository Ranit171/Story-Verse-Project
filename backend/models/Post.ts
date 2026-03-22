import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  username: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  likes: { type: Number, default: 0 },
  liked_by: [String],
  shares: { type: Number, default: 0 },
  user_avatar: String,
  report_count: { type: Number, default: 0 },
  last_edited_at: Date,
  created_at: { type: Date, default: Date.now }
});

export const Post = mongoose.model('Post', PostSchema);
