const { verifyAccess } = require('../utils/jwt');

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing Authorization header' });
  }

  const token = auth.split(' ')[1];
  try {
    const payload = verifyAccess(token);
    req.user = { id: payload.userId, role: payload.role };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Insufficient role' });
    }
    return next();
  };
}

module.exports = { authenticate, requireRole };
