// controllers/requestController.js
const JoinRequest = require('../models/JoinRequest');
const User = require('../models/User');
const Space = require('../models/Space');

// 发起邀请（已验证用户身份）
exports.sendRequest = async (req, res) => {
  try {
    const { toInviteCode, message, spaceName, fromUserName } = req.body;
    const fromUser = req.user;

    if (!toInviteCode || !message || !spaceName || !fromUserName) {
      return res.status(400).json({ error: '参数不完整' });
    }

    const toUser = await User.findOne({ inviteCode: toInviteCode });
    if (!toUser) return res.status(404).json({ error: '目标用户不存在' });

    const existing = await JoinRequest.findOne({
      fromUserId: fromUser.userId,
      status: 'pending',
    });
    if (existing) return res.status(409).json({ error: '你已发送过请求，请等待回应' });

    const fromSpace = await Space.findOne({ 'members.uid': fromUser.userId });
    if (fromSpace) return res.status(403).json({ error: '你已在一个空间中，不能发起新邀请' });

    const toSpace = await Space.findOne({ 'members.uid': toUser.userId });
    if (toSpace) return res.status(403).json({ error: '对方已经在空间中，不能被邀请' });

    const request = await JoinRequest.create({
      fromUserId: fromUser.userId,
      toUserId: toUser.userId,
      fromInviteCode: fromUser.inviteCode,
      toInviteCode: toInviteCode, // ✅ 存储目标门牌号
      fromUserName,
      message,
      spaceName
    });

    res.status(201).json(request);
  } catch (err) {
    console.error('发送邀请失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

// 获取用户收到的 pending 请求（必须是当前用户）
exports.getPendingRequestsForUser = async (req, res) => {
  try {
    const currentUser = req.user;
    const requests = await JoinRequest.find({
      toUserId: currentUser.userId,
      status: 'pending'
    }).sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    console.error('获取邀请失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

// 获取用户发出的 pending 请求（必须是当前用户）
exports.getSentRequestFromUser = async (req, res) => {
  try {
    const currentUser = req.user;
    const request = await JoinRequest.findOne({
      fromUserId: currentUser.userId,
      status: 'pending'
    }).lean();
    res.json({ request });
  } catch (err) {
    console.error('获取发送的邀请失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

// 获取请求详情（用于轮询状态，必须是相关用户）
exports.getRequestById = async (req, res) => {
  try {
    const request = await JoinRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ error: '请求不存在' });

    const currentUser = req.user.userId;
    const isRelated =
      request.fromUserId === currentUser || request.toUserId === currentUser;
    if (!isRelated) {
      return res.status(403).json({ error: '你无权查看该请求' });
    }
    res.json({ request });
  } catch (err) {
    console.error('获取请求详情失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

// 接受请求（验证当前用户）
exports.acceptRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { toUserName } = req.body;
    const currentUser = req.user;

    const request = await JoinRequest.findById(id);
    if (!request || request.status !== 'pending') {
      return res.status(400).json({ error: '无效或已处理的请求' });
    }

    if (request.toUserId !== currentUser.userId) {
      return res.status(403).json({ error: '你不能接受这个邀请' });
    }

    const fromInSpace = await Space.findOne({ 'members.uid': request.fromUserId });
    const toInSpace = await Space.findOne({ 'members.uid': request.toUserId });
    if (fromInSpace || toInSpace) {
      return res.status(403).json({ error: '一方已经在空间中，无法接受' });
    }

    request.status = 'accepted';
    await request.save();
    // ✅ 清理冲突请求
    await JoinRequest.updateMany(
      {
        status: 'pending',
        _id: { $ne: request._id },
        $or: [
          {
            fromUserId: request.fromUserId,
            toUserId: request.toUserId,
          },
          {
            fromUserId: request.toUserId,
            toUserId: request.fromUserId,
          },
        ],
      },
      { $set: { status: 'cancelled' } }
    );
    const newSpace = await Space.create({
      spaceName: request.spaceName,
      members: [
        { uid: request.fromUserId, name: request.fromUserName },
        { uid: request.toUserId, name: toUserName },
      ],
    });

    res.json({ message: '请求已接受，空间已创建' });
  } catch (err) {
    console.error('接受邀请失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

// 拒绝请求（验证当前用户）
exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const request = await JoinRequest.findById(id);
    if (!request || request.status !== 'pending') {
      return res.status(400).json({ error: '无效或已处理的请求' });
    }

    if (request.toUserId !== currentUser.userId) {
      return res.status(403).json({ error: '你不能拒绝这个邀请' });
    }

    request.status = 'rejected';
    await request.save();

    res.json({ message: '请求已拒绝' });
  } catch (err) {
    console.error('拒绝邀请失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

// 取消请求（由发起人删除请求）
exports.cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const request = await JoinRequest.findById(id);
    if (!request) {
      return res.status(404).json({ error: '请求不存在' });
    }

    if (request.fromUserId !== currentUser.userId) {
      return res.status(403).json({ error: '你无权取消这个邀请' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: '无法取消：请求已被处理' });
    }

    await request.deleteOne();

    res.json({ message: '请求已取消' });
  } catch (err) {
    console.error('取消邀请失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
};
