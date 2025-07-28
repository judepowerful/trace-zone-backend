// controllers/requestController.js
const JoinRequest = require('../models/JoinRequest');
const User = require('../models/User');
const Space = require('../models/Space');
const {
  validateUserHasInviteCode,
  validateTargetUserCanBeInvited,
  validateUserHasNoSpace,
  validateUserHasNoPendingRequest,
  validateRequestCanBeOperated,
  validateUsersCanAcceptInvite
} = require('../utils/validators');

// 发起邀请（已验证用户身份）
exports.sendRequest = async (req, res) => {
  try {
    const { toInviteCode, message, spaceName, fromUserName } = req.body;

    if (!toInviteCode || !message || !spaceName || !fromUserName) {
      return res.status(400).json({ error: '参数不完整' });
    }

    const fromUserId = req.user.userId;

    // 验证用户是否有邀请码
    const inviteCodeValidation = await validateUserHasInviteCode(fromUserId);
    if (!inviteCodeValidation.valid) {
      return res.status(403).json({ error: inviteCodeValidation.error });
    }

    // 验证目标用户是否存在且可被邀请
    const targetValidation = await validateTargetUserCanBeInvited(toInviteCode, fromUserId);
    if (!targetValidation.valid) {
      return res.status(404).json({ error: targetValidation.error });
    }

    // 验证用户是否已有空间
    const spaceValidation = await validateUserHasNoSpace(fromUserId);
    if (!spaceValidation.valid) {
      return res.status(403).json({ error: spaceValidation.error });
    }

    // 验证用户是否有待处理的邀请
    const pendingValidation = await validateUserHasNoPendingRequest(fromUserId);
    if (!pendingValidation.valid) {
      return res.status(409).json({ error: pendingValidation.error });
    }

    // 所有验证通过，创建邀请
    const request = await JoinRequest.create({
      fromUserId: fromUserId,
      toUserId: targetValidation.user.userId,
      fromInviteCode: inviteCodeValidation.user.inviteCode,
      toInviteCode: toInviteCode,
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
    const requestValidation = await validateRequestCanBeOperated(req.params.id, req.user.userId, 'view');
    if (!requestValidation.valid) {
      return res.status(404).json({ error: requestValidation.error });
    }
    res.json({ request: requestValidation.request });
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

    // 验证请求是否存在且可接受
    const requestValidation = await validateRequestCanBeOperated(id, currentUser.userId, 'accept');
    if (!requestValidation.valid) {
      return res.status(400).json({ error: requestValidation.error });
    }

    const request = requestValidation.request;

    // 验证双方是否可以接受邀请
    const acceptValidation = await validateUsersCanAcceptInvite(request.fromUserId, request.toUserId);
    if (!acceptValidation.valid) {
      return res.status(403).json({ error: acceptValidation.error });
    }

    // 更新请求状态
    request.status = 'accepted';
    await request.save();

    // 清理冲突请求
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

    // 创建新空间
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

    const requestValidation = await validateRequestCanBeOperated(id, currentUser.userId, 'reject');
    if (!requestValidation.valid) {
      return res.status(400).json({ error: requestValidation.error });
    }

    const request = requestValidation.request;
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

    const requestValidation = await validateRequestCanBeOperated(id, currentUser.userId, 'cancel');
    if (!requestValidation.valid) {
      return res.status(404).json({ error: requestValidation.error });
    }

    await requestValidation.request.deleteOne();

    res.json({ message: '请求已取消' });
  } catch (err) {
    console.error('取消邀请失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
};
