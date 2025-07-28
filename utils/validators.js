const Space = require('../models/Space');
const User = require('../models/User');
const JoinRequest = require('../models/JoinRequest');

/**
 * 验证空间是否存在
 * @param {string} spaceId - 空间ID
 * @returns {Promise<Object|null>} 空间对象或null
 */
async function validateSpaceExists(spaceId) {
  try {
    const space = await Space.findById(spaceId);
    return space;
  } catch (err) {
    console.error('❌ validateSpaceExists error:', err);
    return null;
  }
}

/**
 * 验证用户是否存在
 * @param {string} userId - 用户ID
 * @returns {Promise<Object|null>} 用户对象或null
 */
async function validateUserExists(userId) {
  try {
    const user = await User.findOne({ userId });
    return user;
  } catch (err) {
    console.error('❌ validateUserExists error:', err);
    return null;
  }
}

/**
 * 验证用户是否是空间成员
 * @param {string} userId - 用户ID
 * @param {Object} space - 空间对象
 * @returns {boolean} 是否是成员
 */
function validateUserIsSpaceMember(userId, space) {
  if (!space || !space.members) return false;
  return space.members.some(member => member.uid === userId);
}

/**
 * 验证用户是否有权限加入空间
 * @param {string} userId - 用户ID
 * @param {string} spaceId - 空间ID
 * @returns {Promise<{valid: boolean, space: Object|null, error: string|null}>}
 */
async function validateUserCanJoinSpace(userId, spaceId) {
  // 验证空间是否存在
  const space = await validateSpaceExists(spaceId);
  if (!space) {
    return {
      valid: false,
      space: null,
      error: '小屋不存在或已被删除'
    };
  }

  // 验证用户是否是成员
  if (!validateUserIsSpaceMember(userId, space)) {
    return {
      valid: false,
      space: null,
      error: '你不是这个小屋的成员'
    };
  }

  return {
    valid: true,
    space,
    error: null
  };
}

/**
 * 验证用户是否已有空间
 * @param {string} userId - 用户ID
 * @returns {Promise<{valid: boolean, space: Object|null, error: string|null}>}
 */
async function validateUserHasNoSpace(userId) {
  try {
    const space = await Space.findOne({ 'members.uid': userId });
    if (space) {
      return {
        valid: false,
        space,
        error: '你已在一个空间中，不能发起新邀请'
      };
    }
    return {
      valid: true,
      space: null,
      error: null
    };
  } catch (err) {
    console.error('❌ validateUserHasNoSpace error:', err);
    return {
      valid: false,
      space: null,
      error: '验证失败，请稍后再试'
    };
  }
}

/**
 * 验证用户是否有邀请码
 * @param {string} userId - 用户ID
 * @returns {Promise<{valid: boolean, user: Object|null, error: string|null}>}
 */
async function validateUserHasInviteCode(userId) {
  try {
    const user = await validateUserExists(userId);
    if (!user) {
      return {
        valid: false,
        user: null,
        error: '用户不存在'
      };
    }
    
    if (!user.inviteCode) {
      return {
        valid: false,
        user: null,
        error: '你还没有邀请码，无法邀请其他人'
      };
    }
    
    return {
      valid: true,
      user,
      error: null
    };
  } catch (err) {
    console.error('❌ validateUserHasInviteCode error:', err);
    return {
      valid: false,
      user: null,
      error: '验证失败，请稍后再试'
    };
  }
}

/**
 * 验证目标用户是否存在且可被邀请
 * @param {string} inviteCode - 邀请码
 * @param {string} fromUserId - 发起邀请的用户ID
 * @returns {Promise<{valid: boolean, user: Object|null, error: string|null}>}
 */
async function validateTargetUserCanBeInvited(inviteCode, fromUserId) {
  try {
    const toUser = await User.findOne({ inviteCode });
    if (!toUser) {
      return {
        valid: false,
        user: null,
        error: '目标用户不存在'
      };
    }
    
    // 检查是否邀请自己
    if (toUser.userId === fromUserId) {
      return {
        valid: false,
        user: null,
        error: '不能邀请自己'
      };
    }
    
    // 检查目标用户是否已在空间中
    const toUserSpace = await Space.findOne({ 'members.uid': toUser.userId });
    if (toUserSpace) {
      return {
        valid: false,
        user: null,
        error: '对方已经在空间中，不能被邀请'
      };
    }
    
    return {
      valid: true,
      user: toUser,
      error: null
    };
  } catch (err) {
    console.error('❌ validateTargetUserCanBeInvited error:', err);
    return {
      valid: false,
      user: null,
      error: '验证失败，请稍后再试'
    };
  }
}

/**
 * 验证用户是否有待处理的邀请
 * @param {string} userId - 用户ID
 * @returns {Promise<{valid: boolean, request: Object|null, error: string|null}>}
 */
async function validateUserHasNoPendingRequest(userId) {
  try {
    const existing = await JoinRequest.findOne({
      fromUserId: userId,
      status: 'pending',
    });
    
    if (existing) {
      return {
        valid: false,
        request: existing,
        error: '你已发送过请求，请等待回应'
      };
    }
    
    return {
      valid: true,
      request: null,
      error: null
    };
  } catch (err) {
    console.error('❌ validateUserHasNoPendingRequest error:', err);
    return {
      valid: false,
      request: null,
      error: '验证失败，请稍后再试'
    };
  }
}

/**
 * 验证请求是否存在且可操作
 * @param {string} requestId - 请求ID
 * @param {string} userId - 用户ID
 * @param {string} operation - 操作类型 ('accept', 'reject', 'cancel', 'view')
 * @returns {Promise<{valid: boolean, request: Object|null, error: string|null}>}
 */
async function validateRequestCanBeOperated(requestId, userId, operation) {
  try {
    const request = await JoinRequest.findById(requestId);
    if (!request) {
      return {
        valid: false,
        request: null,
        error: '请求不存在'
      };
    }
    
    // 检查请求状态
    if (request.status !== 'pending') {
      return {
        valid: false,
        request: null,
        error: '无效或已处理的请求'
      };
    }
    
    // 根据操作类型验证权限
    let hasPermission = false;
    switch (operation) {
      case 'accept':
      case 'reject':
        hasPermission = request.toUserId === userId;
        break;
      case 'cancel':
        hasPermission = request.fromUserId === userId;
        break;
      case 'view':
        hasPermission = request.fromUserId === userId || request.toUserId === userId;
        break;
      default:
        hasPermission = false;
    }
    
    if (!hasPermission) {
      return {
        valid: false,
        request: null,
        error: '你无权执行此操作'
      };
    }
    
    return {
      valid: true,
      request,
      error: null
    };
  } catch (err) {
    console.error('❌ validateRequestCanBeOperated error:', err);
    return {
      valid: false,
      request: null,
      error: '验证失败，请稍后再试'
    };
  }
}

/**
 * 验证用户是否可以接受邀请（双方都不在空间中）
 * @param {string} fromUserId - 发起邀请的用户ID
 * @param {string} toUserId - 接受邀请的用户ID
 * @returns {Promise<{valid: boolean, error: string|null}>}
 */
async function validateUsersCanAcceptInvite(fromUserId, toUserId) {
  try {
    const fromInSpace = await Space.findOne({ 'members.uid': fromUserId });
    const toInSpace = await Space.findOne({ 'members.uid': toUserId });
    
    if (fromInSpace || toInSpace) {
      return {
        valid: false,
        error: '一方已经在空间中，无法接受'
      };
    }
    
    return {
      valid: true,
      error: null
    };
  } catch (err) {
    console.error('❌ validateUsersCanAcceptInvite error:', err);
    return {
      valid: false,
      error: '验证失败，请稍后再试'
    };
  }
}

module.exports = {
  validateSpaceExists,
  validateUserExists,
  validateUserIsSpaceMember,
  validateUserCanJoinSpace,
  validateUserHasNoSpace,
  validateUserHasInviteCode,
  validateTargetUserCanBeInvited,
  validateUserHasNoPendingRequest,
  validateRequestCanBeOperated,
  validateUsersCanAcceptInvite
}; 