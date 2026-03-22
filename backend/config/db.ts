import mongoose from 'mongoose';

export let dbError: string | null = null;

export const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI || process.env.STORYVERSE_DB_MONGODB_URI;

  if (!MONGODB_URI) {
    dbError = 'MONGODB_URI environment variable is missing.';
    console.warn('CRITICAL: MONGODB_URI is not set. API requests will fail until a connection string is provided in the environment variables.');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    dbError = null;
  } catch (err: any) {
    dbError = err.message;
    console.error('MongoDB connection error:', err);
    if (err.name === 'MongooseServerSelectionError') {
      console.error('CRITICAL: Could not connect to MongoDB Atlas. This is likely an IP Whitelist issue.');
      console.error('Please ensure your Atlas cluster allows access from "0.0.0.0/0" (Allow Access From Anywhere).');
    }
  }
};
