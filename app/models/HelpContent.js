const mongoose = require('mongoose');

const helpContentSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  answer: {
    type: String,
    required: true,
    trim: true,
  },
  step: {
    type: String,
    required: true,
    trim: true,
  },
  order: {
    type: Number,
    default: 0,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  category: {
    type: String,
    enum: ['general', 'account', 'gameplay', 'technical', 'billing'],
    default: 'general',
    index: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Index for efficient queries
helpContentSchema.index({ isActive: 1, order: 1 });

const HelpContent = mongoose.model('HelpContent', helpContentSchema);

module.exports = HelpContent;

