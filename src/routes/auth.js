import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate, registerSchema, loginSchema } from '../utils/validation.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const validation = validate(req.body, registerSchema);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const { name, email, password } = validation.value;

    const existing = await db('users').where({ email }).first();
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [userId] = await db('users').insert({ name, email, password_hash, role: 'user' });

    const token = jwt.sign(
      { id: userId, email, name, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    logger.info(`User registered: ${email}`);
    res.status(201).json({
      token,
      user: { id: userId, name, email, role: 'user' }
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const validation = validate(req.body, loginSchema);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const { email, password } = validation.value;
    const user = await db('users').where({ email }).first();

    if (!user || !await bcrypt.compare(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    logger.info(`User logged in: ${email}`);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await db('users').where({ id: req.user.id }).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;
