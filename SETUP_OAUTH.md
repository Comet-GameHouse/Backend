# OAuth Setup Guide - Google & Discord

This guide will walk you through setting up Google and Discord OAuth for CometGameHouse.

## Google OAuth Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click the project dropdown at the top
4. Click **"New Project"**
5. Enter a project name (e.g., "CometGameHouse")
6. Click **"Create"**

### Step 2: Enable Google+ API

1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** or **"People API"**
3. Click on it and click **"Enable"**

### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** (for public use) or **"Internal"** (for Google Workspace only)
3. Click **"Create"**
4. Fill in the required information:
   - **App name**: Comet GameHouse
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click **"Save and Continue"**
6. On **"Scopes"** page:
   - Click **"Add or Remove Scopes"**
   - Select: `.../auth/userinfo.email` and `.../auth/userinfo.profile`
   - Click **"Update"** → **"Save and Continue"**
7. On **"Test users"** (if External):
   - Add test users if needed (for testing before verification)
   - Click **"Save and Continue"**
8. Review and click **"Back to Dashboard"**

### Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Choose **"Web application"** as the application type
4. Give it a name (e.g., "CometGameHouse Web Client")
5. **Authorized JavaScript origins**:
   - For development: `http://localhost:3000`
   - For production: `https://yourdomain.com`
6. **Authorized redirect URIs**:
   - For development: `http://localhost:3000/api/auth/google/callback`
   - For production: `https://yourdomain.com/api/auth/google/callback`
7. Click **"Create"**
8. **IMPORTANT**: Copy the **Client ID** and **Client Secret** immediately
   - You won't be able to see the secret again!

### Step 5: Add to .env File

Add these to your `Backend/.env` file:

```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=/api/auth/google/callback
```

---

## Discord OAuth Setup

### Step 1: Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Sign in with your Discord account
3. Click **"New Application"**
4. Enter a name (e.g., "CometGameHouse")
5. Click **"Create"**

### Step 2: Configure OAuth2

1. In your application, go to **"OAuth2"** in the left sidebar
2. Under **"General"**, you'll see:
   - **CLIENT ID**: Copy this (you'll need it)
   - **CLIENT SECRET**: Click **"Reset Secret"** to generate one, then copy it

### Step 3: Add Redirect URI

1. Still in **"OAuth2"** → **"General"**
2. Scroll down to **"Redirects"**
3. Click **"Add Redirect"**
4. Add your redirect URIs:
   - For development: `http://localhost:3000/api/auth/discord/callback`
   - For production: `https://yourdomain.com/api/auth/discord/callback`
5. Click **"Save Changes"**

### Step 4: Configure Scopes

1. In **"OAuth2"** → **"URL Generator"** (optional, for testing)
2. Select scopes:
   - ✅ **identify** - Get user's Discord username and avatar
   - ✅ **email** - Get user's email address
3. Copy the generated URL to test (optional)

### Step 5: Add to .env File

Add these to your `Backend/.env` file:

```env
DISCORD_CLIENT_ID=your-discord-client-id-here
DISCORD_CLIENT_SECRET=your-discord-client-secret-here
DISCORD_CALLBACK_URL=/api/auth/discord/callback
```

---

## Complete .env Example

Here's what your complete `.env` file should look like:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/cometgamehouse

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_CALLBACK_URL=/api/auth/google/callback

# Discord OAuth
DISCORD_CLIENT_ID=123456789012345678
DISCORD_CLIENT_SECRET=abcdefghijklmnopqrstuvwxyz123456
DISCORD_CALLBACK_URL=/api/auth/discord/callback

# Email Configuration (optional for email verification)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

---

## Testing OAuth

### Test Google OAuth

1. Start your backend server: `npm run dev`
2. In your frontend, click the "Google" button on sign in/sign up
3. You should be redirected to Google's consent screen
4. After authorizing, you'll be redirected back and signed in

### Test Discord OAuth

1. Start your backend server: `npm run dev`
2. In your frontend, click the "Discord" button on sign in/sign up
3. You should be redirected to Discord's authorization screen
4. After authorizing, you'll be redirected back and signed in

---

## Troubleshooting

### Google OAuth Issues

**Error: "redirect_uri_mismatch"**
- Make sure the redirect URI in Google Console exactly matches your callback URL
- Check for trailing slashes, http vs https, port numbers
- Format: `http://localhost:3000/api/auth/google/callback`

**Error: "access_denied"**
- User may have denied access
- Check OAuth consent screen configuration
- Make sure scopes are properly configured

**Error: "invalid_client"**
- Check that Client ID and Secret are correct
- Make sure there are no extra spaces in `.env` file
- Restart server after changing `.env`

### Discord OAuth Issues

**Error: "Invalid redirect_uri"**
- Make sure redirect URI in Discord Developer Portal matches exactly
- Check for trailing slashes, http vs https
- Format: `http://localhost:3000/api/auth/discord/callback`

**Error: "Invalid client"**
- Verify Client ID and Secret are correct
- Make sure there are no extra spaces in `.env` file
- Restart server after changing `.env`

**Error: "Missing permissions"**
- Make sure scopes `identify` and `email` are selected
- Check OAuth2 URL Generator to verify scopes

### General Issues

**OAuth buttons don't work**
- Check browser console for errors
- Verify backend server is running
- Check that credentials are in `.env` file
- Restart server after adding credentials

**"OAuth is not configured" error**
- Make sure environment variables are set correctly
- Check for typos in variable names
- Restart server after changes

---

## Production Checklist

Before going to production:

- [ ] Update redirect URIs to production URLs
- [ ] Use HTTPS for all OAuth callbacks
- [ ] Verify OAuth consent screen is published (Google)
- [ ] Test OAuth flow end-to-end
- [ ] Set up proper error logging
- [ ] Configure CORS for production domain
- [ ] Update `FRONTEND_URL` in `.env` to production URL

---

## Security Notes

1. **Never commit `.env` file to git** - It contains sensitive credentials
2. **Keep Client Secrets secure** - Don't share them publicly
3. **Use environment variables** - Never hardcode credentials
4. **Rotate secrets periodically** - Change them if compromised
5. **Use HTTPS in production** - OAuth requires secure connections

---

## Quick Reference

### Google OAuth URLs
- Console: https://console.cloud.google.com/
- OAuth Consent: APIs & Services → OAuth consent screen
- Credentials: APIs & Services → Credentials

### Discord OAuth URLs
- Developer Portal: https://discord.com/developers/applications
- OAuth2 Settings: Your App → OAuth2 → General
- URL Generator: Your App → OAuth2 → URL Generator

### Callback URLs Format
- Development: `http://localhost:3000/api/auth/{provider}/callback`
- Production: `https://yourdomain.com/api/auth/{provider}/callback`

---

## Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set correctly
3. Check server logs for detailed error messages
4. Ensure redirect URIs match exactly in both places
5. Make sure server is restarted after `.env` changes

