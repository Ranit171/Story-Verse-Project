import mongoose from 'mongoose';

const OtpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 } // 10 minutes expiry
});

// Compound index just in case we need fast lookups
OtpSchema.index({ email: 1, otp: 1 });

export const Otp = mongoose.model('Otp', OtpSchema);
