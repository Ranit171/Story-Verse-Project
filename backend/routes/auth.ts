import { Router } from 'express';
import { User } from '../models/User.js';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy-client-id');

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { identifier, password, method } = req.body;
  const safeIdentifier = identifier ? identifier.toLowerCase().trim() : '';
  const query = method === 'username' ? { username: safeIdentifier } : { email: safeIdentifier };
  try {
    const user = await User.findOne({ ...query, password });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/google', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, error: 'Token is required' });

  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch user profile from Google');
    }

    const payload = await response.json();
    if (!payload?.email) throw new Error('No email found in Google payload');

    const email = payload.email.toLowerCase();
    let user = await User.findOne({ email });

    if (!user) {
      if (!email.endsWith('@gmail.com')) {
         return res.status(403).json({ success: false, error: 'Only @gmail.com addresses are permitted.' });
      }

      const userId = Math.random().toString(36).substr(2, 9);
      const usernameBase = payload.name?.replace(/\s+/g, '').toLowerCase() || email.split('@')[0];
      const randomSuffix = Math.floor(Math.random() * 10000);
      const randomPassword = crypto.randomBytes(16).toString('hex');
      
      user = new User({
        id: userId,
        username: `${usernameBase}${randomSuffix}`,
        email: email,
        password: randomPassword,
        avatar: payload.picture || `https://picsum.photos/seed/${userId}/100`,
        bio: '',
        bookmarks: [],
        blocked_users: [],
        total_likes: 0,
        badge: 'Novice',
        report_count: 0
      });
      await user.save();
    }

    res.json({ success: true, user });
  } catch (err: any) {
    console.error('Google Auth Error:', err);
    res.status(401).json({ success: false, error: 'Google Authentication failed' });
  }
});

export default router;
