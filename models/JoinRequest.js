const mongoose = require('mongoose');

const joinRequestSchema = new mongoose.Schema({
  fromUserId: { type: String, required: true },
  fromInviteCode: {
    type: String,
    required: true,
    maxlength: 10,
    match: /^[A-Z0-9]+$/, // 仅大写字母和数字（可调）
  },
  toUserId: { type: String, required: true },
  toInviteCode: {
    type: String,
    required: true,
    maxlength: 10,
    match: /^[A-Z0-9]+$/,
  },
  message: {
    type: String,
    maxlength: 50,
    default: '',
  },
  spaceName: {
    type: String,
    required: true,
    maxlength: 12,
  },
  fromUserName: {
    type: String,
    required: true,
    maxlength: 10,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending',
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('JoinRequest', joinRequestSchema);