# Environment Variables Reference

This document lists all environment variables used in the Backend application.

## Required Variables

### Server Configuration
```env
PORT=3000
NODE_ENV=development
```

### MongoDB Configuration
```env
MONGODB_URI=mongodb://localhost:27017/cometgamehouse
```

### JWT Configuration
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

**Important**: Generate a strong random string for `JWT_SECRET` in production:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend URLs
```env
FRONTEND_URL=http://localhost:5173
ADMIN_FRONTEND_URL=http://localhost:5174
API_URL=http://localhost:3000
```

## Admin User Seed Configuration

These variables are used by the `seed:admin` script to create the first admin user:

```env
ADMIN_EMAIL=admin@comet.gg
ADMIN_PASSWORD=Admin123!
ADMIN_USERNAME=admin
ADMIN_DISPLAY_NAME=Admin
```

**Usage**: 
- Set these in `.env` file, OR
- Pass as command-line arguments: `yarn seed:admin --email=... --password=...`
- If not set, defaults will be used (see `scripts/seedAdmin.js`)

## Optional: OAuth Configuration

### Google OAuth
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=/api/auth/google/callback
```

Get credentials from: https://console.cloud.google.com/

### Discord OAuth
```env
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_CALLBACK_URL=/api/auth/discord/callback
```

Get credentials from: https://discord.com/developers/applications

## Optional: Email Configuration

### Email Sender
```env
EMAIL_FROM="Comet GameHouse" <noreply@cometgamehouse.com>
```

### Option 1: Gmail (for development/testing)
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
```

Create an App Password: https://myaccount.google.com/apppasswords

### Option 2: Custom SMTP Server
```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```

### Option 3: Ethereal Email (for development - auto-generated)
```env
ETHEREAL_USER=
ETHEREAL_PASS=
```

Leave empty to auto-generate test credentials.

## Complete .env File Example

```env
# ============================================
# Server Configuration
# ============================================
PORT=3000
NODE_ENV=development

# ============================================
# MongoDB Configuration
# ============================================
MONGODB_URI=mongodb://localhost:27017/cometgamehouse

# ============================================
# JWT Configuration
# ============================================
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# ============================================
# Frontend URLs
# ============================================
FRONTEND_URL=http://localhost:5173
ADMIN_FRONTEND_URL=http://localhost:5174
API_URL=http://localhost:3000

# ============================================
# Admin User Seed Configuration
# ============================================
ADMIN_EMAIL=admin@comet.gg
ADMIN_PASSWORD=Admin123!
ADMIN_USERNAME=admin
ADMIN_DISPLAY_NAME=Admin

# ============================================
# Google OAuth Configuration (Optional)
# ============================================
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=/api/auth/google/callback

# ============================================
# Discord OAuth Configuration (Optional)
# ============================================
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_CALLBACK_URL=/api/auth/discord/callback

# ============================================
# Email Configuration (Optional)
# ============================================
EMAIL_FROM="Comet GameHouse" <noreply@cometgamehouse.com>

# Gmail (for development)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password

# OR Custom SMTP
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your-smtp-username
# SMTP_PASS=your-smtp-password
```

## Setup Instructions

1. Copy the example above to create your `.env` file:
   ```bash
   # In the Backend directory
   # Create .env file and add the variables above
   ```

2. Update the values with your actual configuration:
   - Change `JWT_SECRET` to a strong random string
   - Update `MONGODB_URI` if using a different database
   - Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` for your admin account
   - Add OAuth credentials if using Google/Discord login
   - Configure email settings if sending verification emails

3. Never commit `.env` file to version control (it should be in `.gitignore`)

