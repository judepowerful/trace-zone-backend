// controllers/userController.js
const User = require('../models/User');
const generateInviteCode = require('../utils/generateInviteCode');

// 取得用户邀请码（注册/取得）
exports.registerUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    let existing = await User.findOne({ userId });
    if (existing) return res.json({ inviteCode: existing.inviteCode });

    // Generate a unique invite code
    let code;
    let exists = true;
    while (exists) {
      code = generateInviteCode();
      exists = await User.findOne({ inviteCode: code });
    }

    const newUser = await User.create({ userId, inviteCode: code });
    return res.status(201).json({ inviteCode: newUser.inviteCode });
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

