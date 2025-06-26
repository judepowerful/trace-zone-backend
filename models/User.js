// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  inviteCode: { type: String, unique: true, required: true },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
