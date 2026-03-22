import mongoose from 'mongoose';

const FollowSchema = new mongoose.Schema({
  follower_id: { type: String, required: true },
  following_id: { type: String, required: true }
});
FollowSchema.index({ follower_id: 1, following_id: 1 }, { unique: true });

export const Follow = mongoose.model('Follow', FollowSchema);
