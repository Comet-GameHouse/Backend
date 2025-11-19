const mongoose = require('mongoose');
const Game = require('../app/models/Game');
require('dotenv').config();

const games = [
  {
    slug: 'animal-chess',
    title: 'Animal Chess',
    tagline: 'Strategic animal battles on the board.',
    overview: 'A strategic board game where players control animal pieces with unique abilities. Capture your opponent\'s pieces and protect your king to win.',
    mode: '2-player Strategy',
    icon: 'chess',
    gradient: 'from-amber-500/20 to-orange-500/20 border-amber-400/30',
    status: 'New',
    players: 0,
    thumbnailUrl: null, // Add thumbnail URL when available
    loadout: [
      'Elephant • Strong defense, moves slowly',
      'Lion • Powerful attacker, moves quickly',
      'Tiger • Balanced stats, versatile moves',
    ],
    objectives: [
      'Capture the opponent\'s king piece',
      'Control key positions on the board',
      'Use animal abilities strategically',
    ],
    tips: [
      'Protect your king at all costs',
      'Use animal abilities to gain advantage',
      'Plan your moves several turns ahead',
    ],
    minPlayers: 2,
    maxPlayers: 2,
  },
  {
    slug: '5-line-sheep-fight',
    title: '5 Line Sheep Fight',
    tagline: 'Connect five sheep in a row to win.',
    overview: 'A fast-paced strategy game where players take turns placing sheep pieces. Be the first to form a line of five sheep horizontally, vertically, or diagonally to win.',
    mode: '2-player Puzzle',
    icon: 'puzzle-piece',
    gradient: 'from-green-500/20 to-emerald-500/20 border-green-400/30',
    status: 'New',
    players: 0,
    thumbnailUrl: null, // Add thumbnail URL when available
    loadout: [
      'Sheep Piece • Basic unit for forming lines',
      'Block Move • Prevent opponent\'s line',
      'Double Move • Place two pieces in one turn',
    ],
    objectives: [
      'Form a line of five sheep in any direction',
      'Block opponent from completing their line',
      'Control the center of the board',
    ],
    tips: [
      'Watch for opponent\'s potential winning moves',
      'Create multiple threats simultaneously',
      'Control the center for better positioning',
    ],
    minPlayers: 2,
    maxPlayers: 2,
  },
];

async function seedGames() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cometgamehouse');
    console.log('Connected to MongoDB');

    for (const gameData of games) {
      const existing = await Game.findOne({ slug: gameData.slug });
      if (existing) {
        console.log(`Game ${gameData.slug} already exists, skipping...`);
        continue;
      }

      await Game.create(gameData);
      console.log(`✓ Created game: ${gameData.title}`);
    }

    console.log('Games seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding games:', error);
    process.exit(1);
  }
}

seedGames();

