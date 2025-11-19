const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  tagline: {
    type: String,
    trim: true,
  },
  overview: {
    type: String,
    trim: true,
  },
  mode: {
    type: String, // e.g., "4v4 Control", "16-player Circuit"
    required: true,
  },
  icon: {
    type: String, // FontAwesome icon name
    default: 'gamepad',
  },
  gradient: {
    type: String, // Tailwind gradient classes
    default: 'from-cyan-500/20 to-purple-500/20 border-cyan-400/30',
  },
  status: {
    type: String,
    enum: ['New', 'Hot', 'Featured', 'Active'],
    default: 'Active',
  },
  loadout: [String], // Array of loadout descriptions
  objectives: [String], // Array of objective descriptions
  tips: [String], // Array of tip strings
  minPlayers: {
    type: Number,
    default: 2,
  },
  maxPlayers: {
    type: Number,
    default: 16,
  },
  players: {
    type: Number, // Current number of players online
    default: 0,
    index: true,
  },
  thumbnailUrl: {
    type: String, // URL to game thumbnail image
    default: null,
  },
  componentUrl: {
    type: String, // URL to component bundle (optional, for external components)
    default: null,
  },
  gameServerUrl: {
    type: String, // URL to game's backend server (e.g., "http://localhost:3001")
    default: null,
    trim: true,
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

// Update updatedAt before saving
gameSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Game', gameSchema);

