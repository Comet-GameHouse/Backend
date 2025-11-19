/**
 * Seed script to create an initial admin user
 * 
 * Usage:
 *   node scripts/seedAdmin.js
 *   node scripts/seedAdmin.js --email admin@example.com --password SecurePass123 --username admin
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../app/models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cometgamehouse';

async function seedAdmin() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const emailArg = args.find(arg => arg.startsWith('--email='))?.split('=')[1];
    const passwordArg = args.find(arg => arg.startsWith('--password='))?.split('=')[1];
    const usernameArg = args.find(arg => arg.startsWith('--username='))?.split('=')[1];
    const displayNameArg = args.find(arg => arg.startsWith('--displayName='))?.split('=')[1];

    // Default values or prompt (in production, use environment variables)
    const email = emailArg || process.env.ADMIN_EMAIL || 'admin@comet.gg';
    const password = passwordArg || process.env.ADMIN_PASSWORD || 'Admin123!';
    const username = usernameArg || process.env.ADMIN_USERNAME || 'admin';
    const displayName = displayNameArg || process.env.ADMIN_DISPLAY_NAME || 'Admin';

    console.log(email, password, username, displayName)

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
        { role: 'admin' }
      ]
    });

    if (existingAdmin) {
      if (existingAdmin.role === 'admin') {
        console.log('⚠️  Admin user already exists:');
        console.log(`   Email: ${existingAdmin.email}`);
        console.log(`   Username: ${existingAdmin.username}`);
        console.log(`   Role: ${existingAdmin.role}`);
        await mongoose.connection.close();
        process.exit(0);
      } else {
        console.log('⚠️  User with this email/username already exists but is not an admin.');
        console.log('   Updating role to admin...');
        existingAdmin.role = 'admin';
        existingAdmin.isVerified = true;
        await existingAdmin.save();
        console.log('✅ User role updated to admin successfully!');
        await mongoose.connection.close();
        process.exit(0);
      }
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const admin = await User.create({
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      displayName,
      password: hashedPassword,
      role: 'admin',
      isVerified: true, // Skip email verification for initial admin
      emailVerifiedAt: new Date(),
    });

    console.log('✅ Admin user created successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Display Name: ${admin.displayName}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${admin.role}`);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
    console.log('\nYou can now sign in to the admin panel at: http://localhost:5174 (or your admin frontend URL)');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the seed script
seedAdmin();

