const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  getSpaceByUser,
  deleteSpaceByUser,
} = require('../controllers/spaceController');
const { reportLocation } = require('../controllers/locationController');

router.use(auth); // 加上认证中间件

// 获取当前用户的小屋信息
router.get('/my-space', getSpaceByUser);

// 删除当前用户的小屋（解散小屋）
router.delete('/my-space', deleteSpaceByUser);

// 上报当前用户的经纬度
router.post('/report-location', reportLocation);

// 其他空间相关的路由可以在这里添加

module.exports = router;
