// 🐾 Cat Feeding Socket Handler
const { validateSpaceExists } = require('../utils/validators');

module.exports = function(io) {
  io.on('connection', (socket) => {
    console.log('🐾 (catSocket) Connected:', socket.id);

    socket.on('feed-cat', async ({ spaceId }) => {
      const userId = socket.userId;
      console.log(`🍖 feed-cat received from user ${userId} for space ${spaceId}`);

      try {
        // 使用验证函数检查空间是否存在
        const space = await validateSpaceExists(spaceId);
        if (!space) {
          console.log(`❌ Space ${spaceId} not found for feed-cat`);
          return;
        }
        
        const today = new Date().toISOString().slice(0, 10);

        // 💧 更新 todayFeeding
        if (!space.todayFeeding || space.todayFeeding.date !== today) {
          console.log(`🌞 New feeding day for space ${spaceId}. Resetting fedUsers.`);
          space.todayFeeding = { date: today, fedUsers: [userId] };
        } else {
          space.todayFeeding.fedUsers = space.todayFeeding.fedUsers || [];
          if (!space.todayFeeding.fedUsers.includes(userId)) {
            console.log(`✅ Adding user ${userId} to fedUsers`);
            space.todayFeeding.fedUsers.push(userId);
          } else {
            console.log(`🔁 User ${userId} already fed today`);
          }
        }

        // 🚀 判断是否两人都喂过了且今天还没记录
        if (
          space.todayFeeding.fedUsers.length === 2 &&
          space.lastCoFeedingDate !== today
        ) {
          console.log(`🎉 Both members fed today! Increment coFeedingDays.`);
          space.coFeedingDays += 1;
          space.lastCoFeedingDate = today;
        }

        await space.save();

        // 通知房间所有人
        io.to(spaceId).emit('partner-fed', { 
          todayFeeding: space.todayFeeding,
          coFeedingDays: space.coFeedingDays
        });
      } catch (err) {
        console.error('🐛 feed-cat error:', err);
      }
    });
  });
};
