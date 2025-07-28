const express = require('express');
const auth = require('../middleware/authMiddleware');
const { uploadPhotoShare, getPhotoShares, getCloudinarySignature } = require('../controllers/photoShareController');

const router = express.Router();

router.post('/', auth, uploadPhotoShare);
router.get('/', auth, getPhotoShares);
router.get('/cloudinary-signature', auth, getCloudinarySignature);

module.exports = router; 