/**
 * Seed script for Help Content (FAQ)
 * Run with: node scripts/seedHelpContent.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const HelpContent = require('../app/models/HelpContent');

const initialHelpContent = [
  {
    question: 'How do I sign up for an account?',
    answer: 'Click "Sign Up" on the homepage or navigate to the sign-up page. You can create an account using your email address and password, or sign up quickly using Google or Discord OAuth. Make sure to verify your email after signing up.',
    step: 'Step 01',
    order: 1,
    isActive: true,
    category: 'account',
  },
  {
    question: 'How do I sign in to my account?',
    answer: 'You can sign in using your email address or username along with your password on the sign-in page. Alternatively, use the "Sign in with Google" or "Sign in with Discord" buttons if you linked those accounts during registration.',
    step: 'Step 02',
    order: 2,
    isActive: true,
    category: 'account',
  },
  {
    question: 'What should I do if I forgot my password?',
    answer: 'Click "Forgot Password" on the sign-in page and enter your email address. You\'ll receive a password reset link via email that expires in 1 hour. If you don\'t receive the email, check your spam folder or try again.',
    step: 'Step 03',
    order: 3,
    isActive: true,
    category: 'account',
  },
  {
    question: 'How do I verify my email address?',
    answer: 'After signing up, check your email inbox for a verification link. Click the link to verify your account. If you didn\'t receive the email, check your spam folder. You can also request a new verification email from the sign-in page if needed.',
    step: 'Step 04',
    order: 4,
    isActive: true,
    category: 'account',
  },
  {
    question: 'How do I update my profile information?',
    answer: 'Go to Settings from your dashboard or profile page. You can update your display name, username, email, pronouns, timezone, bio, and social media links (Discord, Twitch, Twitter). Changes are saved automatically when you submit the form.',
    step: 'Step 05',
    order: 5,
    isActive: true,
    category: 'account',
  },
  {
    question: 'How do I link my Google or Discord account?',
    answer: 'During sign-up or sign-in, click "Sign in with Google" or "Sign in with Discord" to link your account. If you already have an account, you can link additional OAuth providers by signing in with them - the system will automatically link them to your existing account.',
    step: 'Step 06',
    order: 6,
    isActive: true,
    category: 'account',
  },
  {
    question: 'How do I browse and find games?',
    answer: 'Visit the Games page to see all available games. You can filter games by category, search for specific titles, and view game details including descriptions, leaderboards, and available rooms. Click on any game to see more information and join rooms.',
    step: 'Step 07',
    order: 7,
    isActive: true,
    category: 'gameplay',
  },
  {
    question: 'How do I join a game room?',
    answer: 'Navigate to the Arena page or a specific game\'s detail page to see available rooms. Click on a room to view details, then click "Join Room" to enter. You can also create your own room or join friends\' rooms using room codes.',
    step: 'Step 08',
    order: 8,
    isActive: true,
    category: 'gameplay',
  },
  {
    question: 'How do tournaments work?',
    answer: 'Visit the Tournaments page to see upcoming competitive events. Register for tournaments before the deadline, then participate in scheduled matches. Tournaments use bracket-style competition, and winners receive coins and exclusive rewards. Check the Community page for tournament announcements.',
    step: 'Step 09',
    order: 9,
    isActive: true,
    category: 'gameplay',
  },
  {
    question: 'How do I add and manage friends?',
    answer: 'Go to the Friends page and search for players by username. Click on a player\'s profile to send a friend request, or accept friend requests from your notifications. Friends can invite you to games, and you can see their online status.',
    step: 'Step 10',
    order: 10,
    isActive: true,
    category: 'general',
  },
  {
    question: 'How do I view my achievements?',
    answer: 'Navigate to the Achievements page from your dashboard or the progression section. Here you can see all available achievements, track your progress, and view which ones you\'ve unlocked. Achievements are earned by completing specific in-game actions and milestones.',
    step: 'Step 11',
    order: 11,
    isActive: true,
    category: 'gameplay',
  },
  {
    question: 'How do I check the leaderboard?',
    answer: 'Visit the Leaderboard page to see top players ranked by various metrics. You can filter leaderboards by game, time period, and ranking criteria. Your own position is highlighted so you can see how you compare to other players.',
    step: 'Step 12',
    order: 12,
    isActive: true,
    category: 'gameplay',
  },
  {
    question: 'What are coins and how do I earn them?',
    answer: 'Coins are the in-game currency used in the Shop to purchase items, cosmetics, and unlock features. You earn coins by playing matches, winning tournaments, participating in community events, and completing achievements. Check the Shop page to see what you can buy.',
    step: 'Step 13',
    order: 13,
    isActive: true,
    category: 'gameplay',
  },
  {
    question: 'How do I view and manage notifications?',
    answer: 'Click the notification bell icon in the header to see your notifications. Visit the Notifications page to view all notifications, mark them as read, or delete them. You\'ll receive notifications for friend requests, game invites, community events, and system updates.',
    step: 'Step 14',
    order: 14,
    isActive: true,
    category: 'general',
  },
  {
    question: 'What is the Community page?',
    answer: 'The Community page shows upcoming community events, active crews you can join, and links to our Discord server. You can see event details, prize information, and join crews based on your interests. Community events often offer coin rewards for participation.',
    step: 'Step 15',
    order: 15,
    isActive: true,
    category: 'general',
  },
  {
    question: 'How do I report a bug?',
    answer: 'Navigate to Support > Report a Bug and fill out the form with as much detail as possible. Include steps to reproduce the bug, your browser and device information, and any error messages you see. Screenshots or screen recordings are very helpful for our team.',
    step: 'Step 16',
    order: 16,
    isActive: true,
    category: 'technical',
  },
  {
    question: 'How do I submit feedback?',
    answer: 'Go to Support > Feedback and share your ideas, suggestions, or thoughts about improving GameHouse. Select a topic category, provide details, and optionally include your contact information if you\'d like us to follow up. We read all feedback and use it to improve the platform.',
    step: 'Step 17',
    order: 17,
    isActive: true,
    category: 'general',
  },
  {
    question: 'How do I check server status?',
    answer: 'Visit the Status page under Support to see the current operational status of our servers. The page shows real-time status, recent history, and any known issues or maintenance windows. This is the first place to check if you\'re experiencing connection problems.',
    step: 'Step 18',
    order: 18,
    isActive: true,
    category: 'technical',
  },
  {
    question: 'The game won\'t load. What should I do?',
    answer: 'First, check the Status page to see if there are any known issues. Then try clearing your browser cache and cookies, disabling browser extensions, and ensuring JavaScript is enabled. Try a different browser (Chrome or Firefox recommended) and make sure it\'s up to date.',
    step: 'Step 19',
    order: 19,
    isActive: true,
    category: 'technical',
  },
  {
    question: 'What browsers are supported?',
    answer: 'GameHouse supports the latest versions of Chrome, Firefox, Safari, and Edge. For the best experience, we recommend Chrome or Firefox on desktop. Mobile browsers are supported but may have limited functionality. Make sure your browser is updated to the latest version.',
    step: 'Step 20',
    order: 20,
    isActive: true,
    category: 'technical',
  },
];

async function seedHelpContent() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/gamehouse';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if help content already exists
    const existingCount = await HelpContent.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing help content items. Skipping seed.`);
      console.log('To re-seed, delete existing help content first.');
      await mongoose.disconnect();
      return;
    }

    // Insert initial help content
    const created = await HelpContent.insertMany(initialHelpContent);
    console.log(`✅ Successfully seeded ${created.length} help content items:`);
    created.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.question}`);
    });

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding help content:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the seed function
seedHelpContent();

