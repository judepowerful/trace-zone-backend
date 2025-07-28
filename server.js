const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const userRoutes = require('./routes/userRoutes');
const requestRoutes = require('./routes/requestRoutes');
const spaceRoutes = require('./routes/spaceRoutes');

const { verifyToken } = require('./utils/auth'); // ✅ 你的 jwt 工具

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/spaces', spaceRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});
app.set('io', io);

// 🔐 全局 socket auth 中间件
io.use((socket, next) => {
  const userId = socket.handshake.headers["x-user-id"];
  const authHeader = socket.handshake.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  try {
    verifyToken(userId, token);
    socket.userId = userId;
    console.log(`🔐 Socket authenticated: ${userId}`);
    next();
  } catch (err) {
    console.log("❌ Socket authentication failed:", err.message);
    next(new Error("Unauthorized socket"));
  }
});

// 🔥 挂载 socket 功能模块
require('./socket/spaceSocket')(io);
require('./socket/catSocket')(io);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(process.env.PORT || 5000, () =>
      console.log('🚀 Server with Socket.io running')
    );
  })
  .catch((err) => console.error(err));
