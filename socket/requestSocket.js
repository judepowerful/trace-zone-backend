// Request Socket Handler

module.exports = function(io) {
  io.on('connection', (socket) => {
    try {
      const userId = socket.userId;
      if (userId) {
        socket.join(userId);
        console.log(`📮 (requestSocket) User ${userId} joined personal room`);
      }
    } catch (e) {
      console.log('requestSocket join error:', e?.message);
    }

    socket.on('disconnect', () => {
      // no-op for now; room auto-leaves
    });
  });
}


