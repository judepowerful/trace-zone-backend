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
require('./socket/requestSocket')(io);

// 🗄️ MongoDB 连接配置和优化
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    // 详细的错误检查和调试信息
    console.log('🔍 检查 MongoDB 连接配置...');
    
    if (!mongoURI) {
      console.error('❌ MONGO_URI 环境变量未设置');
      console.log('💡 请创建 .env 文件并设置 MONGO_URI');
      console.log('📝 示例格式: mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority');
      throw new Error('MONGO_URI 环境变量未设置');
    }
    
    // 检查连接字符串格式
    if (!mongoURI.includes('mongodb://') && !mongoURI.includes('mongodb+srv://')) {
      console.error('❌ MONGO_URI 格式不正确');
      console.log('💡 连接字符串必须以 mongodb:// 或 mongodb+srv:// 开头');
      throw new Error('MONGO_URI 格式不正确');
    }
    
    console.log('✅ MONGO_URI 环境变量已设置');
    console.log(`🔗 连接字符串: ${mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`); // 隐藏密码
    
    // MongoDB 连接选项
    const options = {
      // 连接池配置
      maxPoolSize: 10, // 最大连接池大小
      minPoolSize: 2,  // 最小连接池大小
      
      // 服务器选择配置
      serverSelectionTimeoutMS: 10000, // 增加服务器选择超时时间
      socketTimeoutMS: 45000,         // Socket 超时
      
      // 写入关注配置
      w: 'majority',                  // 写入确认级别
      journal: true,                  // 日志确认
      
      // 重试配置
      retryWrites: true,              // 重试写入
      retryReads: true,               // 重试读取
      
      // 连接超时
      connectTimeoutMS: 15000,        // 增加连接超时时间
      
      // 心跳配置
      heartbeatFrequencyMS: 10000,    // 心跳频率
      
      // 应用名称（用于监控）
      appName: 'trace-zone-backend'
    };

    console.log('🔄 正在连接 MongoDB...');
    await mongoose.connect(mongoURI, options);
    
    console.log('✅ MongoDB 连接成功');
    console.log(`📊 数据库: ${mongoose.connection.db.databaseName}`);
    console.log(`🔗 连接状态: ${mongoose.connection.readyState === 1 ? '已连接' : '未连接'}`);
    
    // 监听连接事件
    mongoose.connection.on('connected', () => {
      console.log('🟢 MongoDB 连接已建立');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('🔴 MongoDB 连接错误:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('🟡 MongoDB 连接已断开');
    });
    
    // 优雅关闭
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('🔄 MongoDB 连接已通过 SIGINT 关闭');
        process.exit(0);
      } catch (err) {
        console.error('❌ 关闭 MongoDB 连接时出错:', err);
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message);
    process.exit(1);
  }
};

// 🚀 启动服务器
const startServer = async () => {
  try {
    // 先连接数据库
    await connectDB();
    
    // 然后启动服务器
    const port = process.env.PORT || 5000;
    server.listen(port, () => {
      console.log(`🚀 服务器运行在端口 ${port}`);
      console.log(`🌐 环境: ${process.env.NODE_ENV || 'development'}`);
    });
    
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

// 启动应用
startServer();
