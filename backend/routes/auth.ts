import { Router } from 'express';
import { User } from '../models/User.js';
import { Otp } from '../models/Otp.js';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy-client-id');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const router = Router();

router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  const lowerEmail = email ? email.toLowerCase().trim() : '';

  if (!lowerEmail.endsWith('@gmail.com')) {
    return res.status(400).json({ success: false, error: 'Only @gmail.com addresses are permitted.' });
  }

  try {
    const existingUser = await User.findOne({ email: lowerEmail });
    if (existingUser) return res.status(400).json({ success: false, error: 'Email already registered.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ email: lowerEmail });
    await new Otp({ email: lowerEmail, otp }).save();

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail({
        from: `"StoryVerse Security" <${process.env.EMAIL_USER}>`,
        to: lowerEmail,
        subject: 'StoryVerse Verification Code',
        text: `Your StoryVerse verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
        html: `<div style="font-family: sans-serif; text-align: center; color: #333;">
               <h2 style="color: #4f46e5;">StoryVerse Account Verification</h2>
               <p>Your one-time password (OTP) is:</p>
               <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px; padding: 15px; background: #f3f4f6; display: inline-block; border-radius: 8px;">${otp}</div>
               <p>This code expires in 10 minutes.</p>
               </div>`
      });
    } else {
      console.log(`\n========================================`);
      console.log(`[DEVELOPMENT MODE] OTP for ${lowerEmail}: ${otp}`);
      console.log(`========================================\n`);
    }

    res.json({ success: true, message: 'OTP sent successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/register', async (req, res) => {
  const { otp, ...userData } = req.body;
  
  if (!otp) {
     return res.status(400).json({ success: false, error: 'OTP is required.' });
  }

  try {
    const record = await Otp.findOne({ email: userData.email, otp });
    if (!record) {
       return res.status(400).json({ success: false, error: 'Invalid or expired OTP.' });
    }

    const user = new User(userData);
    await user.save();
    
    await Otp.deleteOne({ _id: record._id });
    
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
