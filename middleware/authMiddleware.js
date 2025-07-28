// middleware/authMiddleware.js
const { verifyToken } = require('../utils/auth');

const authMiddleware = (req, res, next) => {
  const userId = req.header('x-user-id');
  const authHeader = req.header('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!userId || !token) {
    return res.status(401).json({ error: '用户未登录或未提供凭证' });
  }

  try {
    verifyToken(userId, token);
    req.user = { userId };
    next();
  } catch (err) {
    return res.status(401).json({ error: '无效或过期的凭证' });
  }
};

module.exports = authMiddleware;
