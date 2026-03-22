import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  reporter_id: { type: String, required: true },
  target_type: { type: String, required: true },
  target_id: { type: String, required: true },
  reason: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

export const Report = mongoose.model('Report', ReportSchema);
