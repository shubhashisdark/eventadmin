const { Router } = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signAccess, signRefresh, verifyRefresh } = require('../utils/jwt');

const router = Router();

router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password || password.length < 8) {
    return res.status(400).json({ message: 'Name, email and password (min 8 chars) are required' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash, role: role || 'user' });
    return res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const access = signAccess({ userId: user._id.toString(), role: user.role });
    const refresh = signRefresh({ userId: user._id.toString(), role: user.role });

    return res.json({ accessToken: access, refreshToken: refresh, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ message: 'refreshToken required' });
  try {
    const payload = verifyRefresh(refreshToken);
    const access = signAccess({ userId: payload.userId, role: payload.role });
    return res.json({ accessToken: access });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

module.exports = router;
