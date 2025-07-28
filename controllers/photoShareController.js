const cloudinary = require('../lib/cloudinary');
const PhotoShare = require('../models/PhotoShare');
const { validateUserExists, validateSpaceExists } = require('../utils/validators');

exports.getCloudinarySignature = (req, res) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'photo-shares';
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET
  );
  res.json({
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder
  });
};

exports.uploadPhotoShare = async (req, res) => {
  const { imageUrl, text, exifTime, location, userName, avatar, model, spaceId } = req.body;
  const userId = req.user.userId;
  
  if (!imageUrl) return res.status(400).json({ error: 'imageUrl is required' });
  if (!spaceId) return res.status(400).json({ error: 'spaceId is required' });

  try {
    // 验证用户是否存在
    const userValidation = await validateUserExists(userId);
    if (!userValidation) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    // 验证空间是否存在
    const spaceValidation = await validateSpaceExists(spaceId);
    if (!spaceValidation) {
      return res.status(404).json({ error: '空间不存在' });
    }

    const record = new PhotoShare({
      imageUrl,
      text,
      exifTime,
      location,
      userId,
      userName,
      avatar,
      model,
      spaceId,
    });
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: err.message });
  }
};

exports.getPhotoShares = async (req, res) => {
  try {
    const shares = await PhotoShare.find().sort({ createdAt: -1 });
    res.json(shares);
  } catch (err) {
    res.status(500).json({ error: 'Database error', detail: err.message });
  }
}; 