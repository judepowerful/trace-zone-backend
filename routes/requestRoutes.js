// routes/requestRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
  sendRequest,
  getPendingRequestsForUser,
  getSentRequestFromUser,
  acceptRequest,
  rejectRequest,
  getRequestById,
  cancelRequest,
} = require('../controllers/requestController');

// 所有请求都需要身份验证
router.use(auth);

// 发起搭子请求
router.post('/', sendRequest);

// ✅ 获取当前用户收到的请求（去掉 :userId）
router.get('/incoming', getPendingRequestsForUser);

// ✅ 获取当前用户发出的 pending 请求（去掉 :userId）
router.get('/sent', getSentRequestFromUser);

// 获取某条请求详情（用于轮询）
router.get('/:id', getRequestById);

// 接受请求
router.patch('/:id/accepted', acceptRequest);

// 拒绝请求
router.patch('/:id/rejected', rejectRequest);

// 取消请求（发起人删除）
router.delete('/:id', cancelRequest);

module.exports = router;
