const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { registerUser, getMyInviteCode, refreshToken } = require('../controllers/userController');

// 注册用户（首次进入 App）
router.post('/register', registerUser);

// 刷新 token（需要身份认证）
router.post('/refresh-token', refreshToken);

// 获取当前用户的邀请码（需要身份认证）
router.get('/my-code', auth, getMyInviteCode);

module.exports = router;
