const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();

// Rate limit: 10 auth attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for authenticated account-mutation endpoints (per IP)
const accountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Precomputed bcrypt hash of a random string — used as a constant-time decoy
// when login is attempted against a non-existent email, so request timing
// can't be used to enumerate registered emails.
const DUMMY_BCRYPT_HASH = bcrypt.hashSync(require('crypto').randomBytes(32).toString('hex'), 12);

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
    algorithm: 'HS256',
  });
}

// POST /api/auth/signup
router.post('/signup', authLimiter, async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }
    if (typeof username !== 'string') {
      return res.status(400).json({ error: 'Invalid input' });
    }
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 2 || trimmedUsername.length > 32) {
      return res.status(400).json({ error: 'Username must be 2–32 characters' });
    }
    if (typeof email !== 'string' || !EMAIL_RE.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ error: 'Password must be 8–128 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: normalizedEmail }, { username: trimmedUsername }] },
    });
    if (existing) {
      return res.status(409).json({ error: 'Email or username already in use' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { username: trimmedUsername, email: normalizedEmail, password: hashed },
      select: { id: true, username: true, email: true, createdAt: true },
    });
    res.status(201).json({ token: signToken(user.id), user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    // Always run bcrypt.compare — against a real hash when the user exists,
    // or a precomputed decoy otherwise — so response time does not reveal
    // whether the email is registered (timing-based enumeration defense).
    const passwordOk = await bcrypt.compare(password, user?.password ?? DUMMY_BCRYPT_HASH);
    if (!user || !passwordOk) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password: _, ...safeUser } = user;
    res.json({ token: signToken(user.id), user: safeUser });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, username: true, email: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/auth/me
router.patch('/me', accountLimiter, authMiddleware, async (req, res, next) => {
  try {
    const { username } = req.body;
    if (typeof username !== 'string' || username.trim().length < 2 || username.trim().length > 32) {
      return res.status(400).json({ error: 'Username must be 2–32 characters' });
    }
    const trimmed = username.trim();
    const existing = await prisma.user.findFirst({
      where: { username: trimmed, NOT: { id: req.userId } },
    });
    if (existing) return res.status(409).json({ error: 'Username already in use' });

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: { username: trimmed },
      select: { id: true, username: true, email: true, createdAt: true },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/auth/account
router.delete('/account', accountLimiter, authMiddleware, async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.userId } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
