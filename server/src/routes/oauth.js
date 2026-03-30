const express = require('express');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: GitHubStrategy } = require('passport-github2');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../lib/prisma');

const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function findOrCreateOAuthUser({ email, displayName }) {
  if (!email) throw new Error('OAuth provider did not return an email address');

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return existing;

  // Build a unique username derived from the display name
  const base = displayName
    ? displayName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'user'
    : 'user';
  let username = base;
  let n = 1;
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${base}${n++}`;
  }

  return prisma.user.create({
    data: {
      username,
      email: email.toLowerCase(),
      // Random value — OAuth users cannot sign in with a password
      password: crypto.randomBytes(32).toString('hex'),
    },
  });
}

// ── Strategy registration (skipped if env vars are absent) ──

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${SERVER_URL}/api/auth/google/callback`,
    },
    async (_at, _rt, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        done(null, await findOrCreateOAuthUser({ email, displayName: profile.displayName }));
      } catch (err) { done(err); }
    }
  ));
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${SERVER_URL}/api/auth/github/callback`,
      scope: ['user:email'],
    },
    async (_at, _rt, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        done(null, await findOrCreateOAuthUser({
          email,
          displayName: profile.displayName || profile.username,
        }));
      } catch (err) { done(err); }
    }
  ));
}

// Required by passport when express-session is active
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    done(null, await prisma.user.findUnique({ where: { id } }));
  } catch (err) { done(err); }
});

// ── Middleware: redirect if the strategy isn't configured ──
function notConfigured(provider) {
  return (req, res, next) => {
    const key = provider === 'google' ? 'GOOGLE_CLIENT_ID' : 'GITHUB_CLIENT_ID';
    if (!process.env[key]) {
      return res.redirect(`${CLIENT_URL}/auth?error=${provider}_not_configured`);
    }
    next();
  };
}

// ── Google ──
router.get('/google',
  notConfigured('google'),
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get('/google/callback',
  notConfigured('google'),
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${CLIENT_URL}/auth?error=google_failed`,
  }),
  (req, res) => res.redirect(
    `${CLIENT_URL}/auth/callback?token=${encodeURIComponent(signToken(req.user.id))}`
  )
);

// ── GitHub ──
router.get('/github',
  notConfigured('github'),
  passport.authenticate('github', { scope: ['user:email'] })
);
router.get('/github/callback',
  notConfigured('github'),
  passport.authenticate('github', {
    session: false,
    failureRedirect: `${CLIENT_URL}/auth?error=github_failed`,
  }),
  (req, res) => res.redirect(
    `${CLIENT_URL}/auth/callback?token=${encodeURIComponent(signToken(req.user.id))}`
  )
);

module.exports = router;
