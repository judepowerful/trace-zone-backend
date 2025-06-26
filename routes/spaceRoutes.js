const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  getSpaceByUser,
} = require('../controllers/spaceController');

router.use(auth); // 加上认证中间件

// ✅ 使用 req.user.userId 而非 URL 参数
router.get('/my-space', getSpaceByUser);

module.exports = router;
