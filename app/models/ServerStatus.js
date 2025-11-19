const mongoose = require('mongoose');

const serverStatusSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['ok', 'minor', 'major'],
    required: true,
  },
  details: {
    type: String,
    trim: true,
  },
  responseTime: {
    type: Number, // in milliseconds
  },
  uptime: {
    type: Number, // in seconds
  },
  memoryUsage: {
    type: {
      used: Number,
      total: Number,
      percentage: Number,
    },
  },
  cpuUsage: {
    type: Number, // percentage
  },
}, {
  timestamps: true,
});

// Index for efficient date queries
serverStatusSchema.index({ date: -1 });
serverStatusSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('ServerStatus', serverStatusSchema);

