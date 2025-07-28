const mongoose = require('mongoose');

const spaceSchema = new mongoose.Schema({
  spaceName: {
    type: String,
    required: true,
    maxlength: 12,
  },
  members: [
    {
      uid: { type: String, required: true },
      name: { type: String, required: true, maxlength: 10 },
      latitude: { type: Number },
      longitude: { type: Number },
      city: { type: String },
      country: { type: String },
      district: { type: String },
      locationUpdatedAt: { type: Date },
    },
  ],
  todayFeeding: {
    date: { type: String },
    fedUsers: [String],
  },
  coFeedingDays: { type: Number, default: 0 }, // ✅ 新增
  lastCoFeedingDate: { type: String },         // ✅ 新增
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Space', spaceSchema);
