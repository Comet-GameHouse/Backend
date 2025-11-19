const mongoose = require('mongoose');

const supportRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: ['bug', 'feedback'],
      required: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    platform: {
      type: String,
      trim: true,
    },
    severity: {
      type: String,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    steps: {
      type: String,
      trim: true,
    },
    topic: {
      type: String,
      trim: true,
    },
    feedback: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model('SupportRequest', supportRequestSchema);


