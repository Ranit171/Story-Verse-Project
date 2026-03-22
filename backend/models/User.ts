import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: String,
  bio: String,
  bookmarks: [String],
  blocked_users: [String],
  total_likes: { type: Number, default: 0 },
  badge: { type: String, default: 'Novice' },
  report_count: { type: Number, default: 0 },
  banned_until: Date,
  created_at: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', UserSchema);
