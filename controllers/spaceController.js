// controllers/spaceController.js
const Space = require('../models/Space');
const PhotoShare = require('../models/PhotoShare');
const { validateUserExists } = require('../utils/validators');

// 获取当前用户的小屋信息
exports.getSpaceByUser = async (req, res) => {
  try {
    const uid = req.user.userId;
    
    // 验证用户是否存在
    const userValidation = await validateUserExists(uid);
    if (!userValidation) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const space = await Space.findOne({ 'members.uid': uid });
    if (!space) {
      return res.status(404).json({ error: '未找到用户空间' });
    }
    
    // 返回时带上每个成员的经纬度和位置更新时间
    res.json({
      ...space.toObject(),
      members: space.members.map(m => ({
        uid: m.uid,
        name: m.name,
        latitude: m.latitude,
        longitude: m.longitude,
        city: m.city,
        country: m.country,
        district: m.district,
        locationUpdatedAt: m.locationUpdatedAt,
      }))
    });
  } catch (err) {
    console.error('获取用户空间失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

// 删除当前用户所在的小屋
exports.deleteSpaceByUser = async (req, res) => {
  try {
    const uid = req.user.userId;
    
    // 验证用户是否存在
    const userValidation = await validateUserExists(uid);
    if (!userValidation) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const space = await Space.findOne({ 'members.uid': uid });

    if (!space) {
      return res.status(404).json({ error: '未找到用户空间' });
    }

    // 直接删除这个空间（即解散小屋）
    await Space.deleteOne({ _id: space._id });

    // 通知所有在线用户小屋已被解散
    const spaceId = space._id.toString();
    const io = req.app.get('io');
    io.to(spaceId).emit('space-deleted', { message: '小屋已被解散' });

    // 删除该小屋下所有图片分享
    await PhotoShare.deleteMany({ spaceId: space._id });

    res.json({ message: '已成功删除小屋' });
  } catch (err) {
    console.error('删除用户空间失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
};

// 假设有删除小屋的函数 deleteSpace
exports.deleteSpace = async (req, res) => {
  const { id } = req.params;
  try {
    // 1. 删除小屋本身
    // ...原有删除小屋逻辑...

    // 2. 删除该小屋下所有图片分享
    await PhotoShare.deleteMany({ spaceId: id });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed', detail: err.message });
  }
};