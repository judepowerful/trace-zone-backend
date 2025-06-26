// middleware/authMiddleware.js
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const userId = req.header('x-user-id');

  if (!userId) return res.status(401).json({ error: '用户未登录' });

  const user = await User.findOne({ userId });
  if (!user) return res.status(403).json({ error: '无效的用户身份' });

  req.user = user;
  next();
};

module.exports = authMiddleware;
