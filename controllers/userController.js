// controllers/userController.js
const User = require('../models/User');
const generateInviteCode = require('../utils/generateInviteCode');
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;

// 取得用户邀请码（注册/取得）
exports.registerUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    let existing = await User.findOne({ userId });
    if (existing) {
      // 已存在用户
      return res.status(409).json({ error: '用户已存在，请调用 /refresh-token 获取新凭证' });
    }

    // 第一次注册用户
    // 生成唯一的邀请码
    // 生成 JWT token
    let code;
    let exists = true;
    while (exists) {
      code = generateInviteCode();
      exists = await User.findOne({ inviteCode: code });
    }
    await User.create({ userId, inviteCode: code });
    const token = jwt.sign({ userId }, SECRET, { expiresIn: '30d' });

    return res.status(201).json({ inviteCode: code, token });
  } catch (err) {
    console.error('User registration failed:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// 获取当前登录用户的邀请码
exports.getMyInviteCode = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: '用户不存在' });
    res.json({ inviteCode: user.inviteCode });
  } catch (err) {
    console.error('获取邀请码失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
};


// ⭐ 新增：刷新 token
exports.refreshToken = async (req, res) => {
  try {
    const { userId, oldToken } = req.body;

    if (!userId || !oldToken) {
      return res.status(400).json({ error: 'userId 和 oldToken 都是必需的' });
    }

    // 验证旧 token 是否有效
    const decoded = jwt.verify(oldToken, SECRET);

    if (decoded.userId !== userId) {
      return res.status(403).json({ error: '身份信息不匹配' });
    }

    // 检查用户是否还在数据库
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 签发新的 token
    const newToken = jwt.sign({ userId }, SECRET, { expiresIn: '30d' });

    return res.json({ token: newToken });
  } catch (err) {
    console.error('刷新 token 失败:', err);
    return res.status(401).json({ error: '无效或过期的 token' });
  }
};
