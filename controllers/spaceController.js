// controllers/spaceController.js
const Space = require('../models/Space');

exports.getSpaceByUser = async (req, res) => {
  try {
    const uid = req.user.userId;
    const space = await Space.findOne({ 'members.uid': uid });
    if (!space) {
      return res.status(404).json({ error: '未找到用户空间' });
    }
    res.json(space);
  } catch (err) {
    console.error('获取用户空间失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
};
