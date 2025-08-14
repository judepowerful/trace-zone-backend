require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  console.log('🧪 测试 MongoDB 连接...\n');
  
  // 检查环境变量
  const mongoURI = process.env.MONGO_URI;
  
  if (!mongoURI) {
    console.error('❌ MONGO_URI 环境变量未设置');
    console.log('\n💡 解决方案:');
    console.log('1. 在项目根目录创建 .env 文件');
    console.log('2. 添加以下内容:');
    console.log('   MONGO_URI=XXX');
    console.log('3. 将 username, password, cluster, database_name 替换为你的实际值');
    return;
  }
  
  console.log('✅ MONGO_URI 环境变量已设置');
  console.log(`🔗 连接字符串: ${mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}\n`);
  
  try {
    console.log('🔄 正在连接...');
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 1, // 测试时使用较小的连接池
    });
    
    console.log('✅ MongoDB 连接成功!');
    console.log(`📊 数据库名称: ${mongoose.connection.db.databaseName}`);
    console.log(`🔗 连接状态: ${mongoose.connection.readyState === 1 ? '已连接' : '未连接'}`);
    
    // 测试 ping
    const result = await mongoose.connection.db.admin().ping();
    console.log(`🏓 Ping 结果: ${result.ok === 1 ? '成功' : '失败'}`);
    
  } catch (error) {
    console.error('❌ MongoDB 连接失败:');
    console.error('错误信息:', error.message);
    
    if (error.message.includes('No addresses found at host')) {
      console.log('\n🔍 可能的原因:');
      console.log('1. 连接字符串中的主机名不正确');
      console.log('2. 网络连接问题');
      console.log('3. MongoDB Atlas 集群未启动');
      console.log('4. IP 地址未在白名单中');
    } else if (error.message.includes('Authentication failed')) {
      console.log('\n🔍 可能的原因:');
      console.log('1. 用户名或密码错误');
      console.log('2. 数据库用户权限不足');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔍 可能的原因:');
      console.log('1. MongoDB 服务未运行');
      console.log('2. 端口号错误');
      console.log('3. 防火墙阻止连接');
    }
    
    console.log('\n💡 建议检查:');
    console.log('1. 确认 MongoDB Atlas 集群状态');
    console.log('2. 检查网络连接');
    console.log('3. 验证连接字符串格式');
    console.log('4. 确认 IP 地址在白名单中');
    
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\n🔄 连接已关闭');
    }
    process.exit(0);
  }
}

testConnection();
