const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: function() {
      return !this.googleId && !this.discordId;
    },
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId && !this.discordId;
    },
    select: false, // Don't include password in queries by default
  },
  avatarUrl: {
    type: String,
  },
  role: {
    type: String,
    enum: ['player', 'moderator', 'admin'],
    default: 'player',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  // Email verification
  emailVerificationToken: {
    type: String,
    select: false,
  },
  emailVerificationExpires: {
    type: Date,
    select: false,
  },
  emailVerifiedAt: {
    type: Date,
  },
  // OAuth fields
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  discordId: {
    type: String,
    unique: true,
    sparse: true,
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
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

// Index for faster lookups
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ discordId: 1 });
userSchema.index({ emailVerificationToken: 1 });

// Update updatedAt before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);

