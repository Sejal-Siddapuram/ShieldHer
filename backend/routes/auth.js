const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { pseudonym, password } = req.body;

    if (!pseudonym || !password) {
      return res.status(400).json({ error: 'Pseudonym and password are required' });
    }

    const existing = await User.findOne({ pseudonym });
    if (existing) {
      return res.status(400).json({ error: 'Pseudonym taken, choose another' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ pseudonym, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ pseudonym }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({ token, pseudonym, message: 'Welcome to ShieldHer' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { pseudonym, password } = req.body;

    if (!pseudonym || !password) {
      return res.status(400).json({ error: 'Pseudonym and password are required' });
    }

    const user = await User.findOne({ pseudonym });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = jwt.sign({ pseudonym }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({ token, pseudonym });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/verify
router.get('/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, pseudonym: req.user.pseudonym });
});

module.exports = router;
