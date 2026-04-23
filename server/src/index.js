require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const passport = require('passport');

const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const oauthRoutes = require('./routes/oauth'); // registers passport strategies
const habitRoutes = require('./routes/habits');
const logRoutes = require('./routes/logs');
const analyticsRoutes = require('./routes/analytics');

// Fail fast if required secrets are missing
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set.');
  process.exit(1);
}
if (!process.env.SESSION_SECRET) {
  console.error('FATAL: SESSION_SECRET environment variable is not set. Set it independently from JWT_SECRET.');
  process.exit(1);
}

const app = express();

// When deployed behind a reverse proxy (Render, Fly, Heroku, etc.), trust the
// first proxy hop so req.ip and the `secure` cookie flag work correctly, and
// express-rate-limit keys requests by the real client IP rather than the proxy's.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security headers — default helmet config is appropriate for a JSON API
// (no inline HTML served, so CSP defaults are strict enough).
app.use(helmet());

// CORS — restrict to configured origin only
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

// Short-lived session — used only for OAuth state verification during the
// provider handshake. Scoped to the OAuth routes so the rest of the API
// (JWT-authenticated) doesn't unnecessarily issue session cookies or
// allocate MemoryStore entries per request.
const oauthSession = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000, // 10 minutes
  },
});

// Body parser — cap payload at 50kb to prevent abuse
app.use(express.json({ limit: '50kb' }));

// Passport initialize is cheap and stateless; session middleware is only
// mounted on the OAuth sub-router below.
app.use(passport.initialize());

// Rate limit for authenticated API endpoints — 300 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: { error: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authRoutes);
// OAuth handshake needs session (for state CSRF token) + passport.session().
app.use('/api/auth', oauthSession, passport.session(), oauthRoutes);
app.use('/api/habits', apiLimiter, habitRoutes);
app.use('/api/logs', apiLimiter, logRoutes);
app.use('/api/analytics', apiLimiter, analyticsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Global error handler — catches unhandled errors from async routes.
// Only honour err.status when it is an explicit client-error code (4xx).
// Any other value (including server-origin 5xx or missing) collapses to a
// generic 500 so internal details can't leak via the status line.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error(err);
  const status = Number.isInteger(err?.status) && err.status >= 400 && err.status < 500
    ? err.status
    : 500;
  res.status(status).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Momentum server running on port ${PORT}`));
