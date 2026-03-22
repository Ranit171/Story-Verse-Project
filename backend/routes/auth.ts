import { Router } from 'express';
import { User } from '../models/User.js';

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

export default router;
