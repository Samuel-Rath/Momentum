const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = header.split(' ')[1];
  try {
    // Pin algorithm to prevent any future alg-confusion attack (e.g. 'none',
    // or RS256-with-public-key-as-HMAC-key). jsonwebtoken v9+ defaults are
    // safe, but explicit pinning is the documented best practice.
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
