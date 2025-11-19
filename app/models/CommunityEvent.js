const mongoose = require('mongoose');

const communityEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  detail: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  prizeCoins: {
    type: Number,
    default: 0,
  },
  eventDate: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

communityEventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CommunityEvent', communityEventSchema);

