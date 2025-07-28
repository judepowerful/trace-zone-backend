const mongoose = require('mongoose');

const PhotoShareSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },  // 图片URL
  text: String, // 文字描述
  createdAt: { type: Date, default: Date.now }, // 创建时间
  exifTime: String, // 拍摄时间
  location: String, // 直接存前端传的地理位置描述
  userId: String, // 用户ID
  userName: String, // 用户名
  avatar: String, // 头像
  model: String, // 设备型号
  spaceId: { type: String, required: true },
});

module.exports = mongoose.model('PhotoShare', PhotoShareSchema); 