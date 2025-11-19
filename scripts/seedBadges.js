const mongoose = require('mongoose');
const BadgeDefinition = require('../app/models/BadgeDefinition');

const initialBadges = [
  {
    badgeId: 'celestial-mvp',
    title: 'Celestial MVP',
    detail: 'Finish 25 matches with top-score streaks.',
    image: 'https://res.cloudinary.com/demo/image/upload/v1439593208/nebula-badge.png',
    upgradeImage: 'https://res.cloudinary.com/demo/image/upload/v1439593208/nebula-badge-legendary.png',
    category: 'combat',
    badgeType: 'ongoing',
    requirement: {
      type: 'matches',
      target: 25,
      description: 'matches complete',
    },
    reward: {
      xp: 750,
      coins: 0,
    },
    order: 1,
    isActive: true,
  },
  {
    badgeId: 'aurora-medic',
    title: 'Aurora Medic',
    detail: 'Deliver 500 support assists across ranked arenas.',
    image: 'https://res.cloudinary.com/demo/image/upload/v1439593208/architect-badge.png',
    upgradeImage: 'https://res.cloudinary.com/demo/image/upload/v1439593208/architect-badge-legendary.png',
    category: 'support',
    badgeType: 'ongoing',
    requirement: {
      type: 'assists',
      target: 500,
      description: 'assists',
    },
    reward: {
      xp: 1000,
      coins: 0,
    },
    order: 2,
    isActive: true,
  },
  {
    badgeId: 'darkstar-strategist',
    title: 'Darkstar Strategist',
    detail: 'Win 10 matches using custom room rule sets.',
    image: 'https://res.cloudinary.com/demo/image/upload/v1439593208/courier-badge.png',
    upgradeImage: 'https://res.cloudinary.com/demo/image/upload/v1439593208/courier-badge-legendary.png',
    category: 'strategy',
    badgeType: 'ongoing',
    requirement: {
      type: 'wins',
      target: 10,
      description: 'wins',
    },
    reward: {
      xp: 500,
      coins: 0,
    },
    order: 3,
    isActive: true,
  },
  {
    badgeId: 'first-steps',
    title: 'First Steps',
    detail: 'Complete your first match.',
    image: 'https://res.cloudinary.com/demo/image/upload/v1439593208/nebula-badge.png',
    upgradeImage: 'https://res.cloudinary.com/demo/image/upload/v1439593208/nebula-badge-legendary.png',
    category: 'progression',
    badgeType: 'one-time',
    requirement: {
      type: 'matches',
      target: 1,
      description: 'match complete',
    },
    reward: {
      xp: 100,
      coins: 50,
    },
    order: 0,
    isActive: true,
  },
  {
    badgeId: 'winning-streak',
    title: 'Winning Streak',
    detail: 'Win 5 matches in a row.',
    image: 'https://res.cloudinary.com/demo/image/upload/v1439593208/nebula-badge.png',
    upgradeImage: 'https://res.cloudinary.com/demo/image/upload/v1439593208/nebula-badge-legendary.png',
    category: 'combat',
    badgeType: 'ongoing',
    requirement: {
      type: 'streak',
      target: 5,
      description: 'wins in a row',
    },
    reward: {
      xp: 500,
      coins: 100,
    },
    order: 4,
    isActive: true,
  },
  {
    badgeId: 'social-butterfly',
    title: 'Social Butterfly',
    detail: 'Add 10 friends to your friend list.',
    image: 'https://res.cloudinary.com/demo/image/upload/v1439593208/nebula-badge.png',
    upgradeImage: 'https://res.cloudinary.com/demo/image/upload/v1439593208/nebula-badge-legendary.png',
    category: 'social',
    badgeType: 'one-time',
    requirement: {
      type: 'custom',
      target: 10,
      description: 'friends added',
    },
    reward: {
      xp: 300,
      coins: 0,
    },
    order: 5,
    isActive: true,
  },
];

async function seedBadges() {
  try {
    // Connect to MongoDB - use same default as other scripts
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cometgamehouse';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    console.log(`Database: ${mongoose.connection.name}`);

    // Check if badges already exist
    const existingCount = await BadgeDefinition.countDocuments();
    console.log(`Found ${existingCount} existing badge definitions.`);
    
    if (existingCount > 0) {
      console.log('Badges already exist. Skipping seed.');
      console.log('To re-seed, delete existing badge definitions first.');
      console.log('You can check the data in MongoDB Compass in the "badgedefinitions" collection.');
      await mongoose.disconnect();
      return;
    }

    // Insert initial badges
    console.log('Inserting badge definitions...');
    const created = await BadgeDefinition.insertMany(initialBadges);
    console.log(`✅ Successfully seeded ${created.length} badge definitions:`);
    created.forEach((badge, index) => {
      console.log(`  ${index + 1}. ${badge.title} (${badge.badgeId}) - ${badge.badgeType}`);
    });

    // Verify insertion
    const verifyCount = await BadgeDefinition.countDocuments();
    console.log(`\n✅ Verification: ${verifyCount} badges in database`);
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`📁 Collection: ${BadgeDefinition.collection.name}`);
    console.log(`\n💡 To view in MongoDB Compass:`);
    console.log(`   1. Connect to: ${mongoUri}`);
    console.log(`   2. Open database: ${mongoose.connection.name}`);
    console.log(`   3. Open collection: ${BadgeDefinition.collection.name}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding badges:', error);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:');
      Object.keys(error.errors).forEach((key) => {
        console.error(`  ${key}: ${error.errors[key].message}`);
      });
    }
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

// Run seed if called directly
if (require.main === module) {
  seedBadges();
}

module.exports = { seedBadges, initialBadges };

