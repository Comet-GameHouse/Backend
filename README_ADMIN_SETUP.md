# Admin Panel Setup Guide

This guide explains how to set up and access the admin panel.

## Overview

The admin panel (`Admin-Frontend`) is a separate application that requires users with `admin` or `moderator` roles. There is **no signup page** in the admin panel - admins must be created through other means.

## Creating the First Admin User

### Option 1: Using the Seed Script (Recommended)

The easiest way to create the first admin user is using the provided seed script:

```bash
cd Backend
yarn seed:admin
```

Or with custom credentials:

```bash
yarn seed:admin --email admin@example.com --password SecurePass123 --username admin --displayName "Admin User"
```

**Default credentials** (if not specified):
- Email: `admin@comet.gg`
- Password: `Admin123!`
- Username: `admin`
- Display Name: `Admin`

⚠️ **Important**: Change the default password after first login!

### Option 2: Using Environment Variables

You can also set admin credentials in your `.env` file. Add these variables to your `Backend/.env` file:

```env
# Admin User Seed Configuration
# These are used by the seed:admin script to create the first admin user
ADMIN_EMAIL=admin@comet.gg
ADMIN_PASSWORD=Admin123!
ADMIN_USERNAME=admin
ADMIN_DISPLAY_NAME=Admin
```

Then run:

```bash
yarn seed:admin
```

**Note**: If you don't have a `.env` file yet, create one in the `Backend` directory. Here's a minimal `.env` file template:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/cometgamehouse

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Frontend URLs
FRONTEND_URL=http://localhost:5173
API_URL=http://localhost:3000

# Admin User Seed Configuration
ADMIN_EMAIL=admin@comet.gg
ADMIN_PASSWORD=Admin123!
ADMIN_USERNAME=admin
ADMIN_DISPLAY_NAME=Admin
```

### Option 3: Manual Database Update

1. **Create a regular user** through the main frontend (`Frontend-v2`) signup page
2. **Connect to MongoDB** using MongoDB Compass or MongoDB Shell
3. **Update the user's role**:

```javascript
// In MongoDB Shell or Compass
use your-database-name

// Find your user
db.users.findOne({ email: "your-email@example.com" })

// Update to admin
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin", isVerified: true } }
)
```

### Option 4: Using the Admin API (After First Admin Exists)

If you already have an admin account, you can create new admins through the admin API:

```bash
# Sign in as admin first to get a token, then:
PATCH /api/admin/users/:userId
Authorization: Bearer <admin-token>
Body: { "role": "admin" }
```

## Signing In to the Admin Panel

1. **Start the admin frontend**:
   ```bash
   cd Admin-Frontend
   yarn dev
   ```

2. **Navigate to the admin panel** (usually `http://localhost:5174`)

3. **Sign in** with your admin credentials:
   - Email or Username
   - Password

4. **Access granted**: Only users with `role: "admin"` or `role: "moderator"` can access the admin panel.

## Workflow Summary

```
┌─────────────────────────────────────┐
│ 1. Create Admin User                │
│    (via seed script or manually)     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 2. Sign In to Admin Panel           │
│    (Admin-Frontend)                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 3. Manage Users, Support, etc.      │
│    (Create more admins if needed)   │
└─────────────────────────────────────┘
```

## Security Notes

- The admin panel is **separate** from the main application
- Regular users (`role: "player"`) cannot access the admin panel
- Always use strong passwords for admin accounts
- Consider using environment variables for production deployments
- Regularly audit admin user accounts

## Troubleshooting

**"Access denied. Admin or moderator role required."**
- Your user account doesn't have `admin` or `moderator` role
- Update the role in the database using one of the methods above

**"Invalid email/username or password"**
- Check that you're using the correct email/username and password
- Make sure the user exists in the database

**"User not found"**
- The user doesn't exist in the database
- Create the user first using the seed script or signup

