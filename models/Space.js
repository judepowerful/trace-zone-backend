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
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Space', spaceSchema);
