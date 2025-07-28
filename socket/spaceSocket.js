// Space Socket Handler
const { validateUserCanJoinSpace } = require('../utils/validators');
const onlineUsersInSpace = {};

module.exports = function(io) {
  io.on('connection', (socket) => {
    console.log('🔌 (spaceSocket) New client:', socket.id);

    socket.on('join-space', async ({ spaceId }) => {
      const userId = socket.userId;
      console.log(`👤 User ${userId} trying to join space ${spaceId}`);
      
      try {
        // 使用验证函数检查权限
        const validation = await validateUserCanJoinSpace(userId, spaceId);
        
        if (!validation.valid) {
          console.log(`❌ User ${userId} cannot join space ${spaceId}: ${validation.error}`);
          socket.emit('space-error', { message: validation.error });
          return;
        }
        
        // 验证通过，加入房间
        socket.join(spaceId);
        onlineUsersInSpace[userId] = { spaceId, socketId: socket.id };
        console.log(`✅ User ${userId} successfully joined space ${spaceId}`);
        
        // 通知房间其他用户这个人上线了
        socket.to(spaceId).emit('partner-status', { userId, online: true });

        // 告诉新用户谁已经在线
        const partners = Object.entries(onlineUsersInSpace)
          .filter(([uid, info]) => info.spaceId === spaceId && uid !== userId)
          .map(([uid]) => uid);

        if (partners.length > 0) {
          socket.emit('partner-status', { userId: partners[0], online: true });
        }
      } catch (err) {
        console.error('❌ Error joining space:', err);
        socket.emit('space-error', { message: '加入小屋失败，请稍后再试' });
      }
    });

    socket.on('leave-space', ({ spaceId }) => {
      const userId = socket.userId;
      console.log(`👤 User ${userId} left space ${spaceId}`);
      
      socket.leave(spaceId);
      delete onlineUsersInSpace[userId];
      socket.to(spaceId).emit('partner-status', { userId, online: false });
    });

    socket.on('disconnect', () => {
      console.log('🚫 Disconnected:', socket.id);
      for (const [uid, info] of Object.entries(onlineUsersInSpace)) {
        if (info.socketId === socket.id) {
          socket.to(info.spaceId).emit('partner-status', { userId: uid, online: false });
          delete onlineUsersInSpace[uid];
        }
      }
    });
  });
};
