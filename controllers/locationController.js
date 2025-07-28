// controllers/locationController.js
const Space = require('../models/Space');
const { validateUserExists } = require('../utils/validators');

// 上报成员经纬度和地名
exports.reportLocation = async (req, res) => {
  try {
    const { latitude, longitude, city, country, district } = req.body;
    const uid = req.user.userId;
    
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: '参数错误' });
    }
    
    // 验证用户是否存在
    const userValidation = await validateUserExists(uid);
    if (!userValidation) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 直接用 findOneAndUpdate 原子更新成员位置，避免乐观锁冲突
    const result = await Space.findOneAndUpdate(
      { 'members.uid': uid },
      { $set: {
        'members.$.latitude': latitude,
        'members.$.longitude': longitude,
        'members.$.city': city,
        'members.$.country': country,
        'members.$.district': district,
        'members.$.locationUpdatedAt': new Date()
      } },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({ 
        error: '未找到用户空间',
        message: '你可能不在任何小屋中，或者小屋已被删除'
      });
    }
    
    res.json({ message: '位置已上报' });
  } catch (err) {
    console.error('上报位置失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
};
