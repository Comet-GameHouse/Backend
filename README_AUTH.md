# Authentication Setup Guide

This guide will help you set up authentication for CometGameHouse, including email/password and OAuth (Google & Discord) authentication.

## Backend Setup

### 1. Install Dependencies

```bash
cd Backend
npm install
```

### 2. Environment Variables

Create a `.env` file in the `Backend` directory based on `.env.example`:

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

# Frontend URL (for CORS and OAuth callbacks)
FRONTEND_URL=http://localhost:5173

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=/api/auth/google/callback

# Discord OAuth
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_CALLBACK_URL=/api/auth/discord/callback
```

**Important:** Change `JWT_SECRET` to a strong random string in production!

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen:
   - User Type: External (for testing) or Internal (for organization)
   - Add scopes: `email`, `profile`
6. Create OAuth Client:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback` (development)
   - For production: `https://yourdomain.com/api/auth/google/callback`
7. Copy the Client ID and Client Secret to your `.env` file

### 4. Discord OAuth Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to "OAuth2" → "General"
4. Add redirect URI: `http://localhost:3000/api/auth/discord/callback` (development)
   - For production: `https://yourdomain.com/api/auth/discord/callback`
5. Copy the Client ID
6. Click "Reset Secret" to generate a Client Secret
7. Copy both to your `.env` file
8. Under "OAuth2" → "URL Generator", select scopes: `identify`, `email`

### 5. Start the Backend Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Frontend Setup

### 1. Environment Variables

Create a `.env` file in the `Frontend-v2` directory:

```env
VITE_API_URL=http://localhost:3000/api
```

For production, update to your backend URL:
```env
VITE_API_URL=https://api.yourdomain.com/api
```

### 2. Start the Frontend

```bash
cd Frontend-v2
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

## API Endpoints

### Authentication Endpoints

- `POST /api/auth/signup` - Register with email/password
- `POST /api/auth/signin` - Sign in with email/username and password
- `POST /api/auth/signout` - Sign out (requires authentication)
- `GET /api/auth/me` - Get current user (requires authentication)
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/discord` - Initiate Discord OAuth
- `GET /api/auth/discord/callback` - Discord OAuth callback

### Request/Response Examples

#### Sign Up
```json
POST /api/auth/signup
{
  "email": "user@example.com",
  "username": "username",
  "password": "securepassword123",
  "displayName": "Display Name" // optional
}

Response:
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "username": "username",
      "displayName": "Display Name",
      "role": "player",
      "isVerified": false
    },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

#### Sign In
```json
POST /api/auth/signin
{
  "identifier": "user@example.com", // or username
  "password": "securepassword123"
}

Response: Same as signup
```

## Security Features

1. **Password Hashing**: Uses bcryptjs with 12 salt rounds
2. **JWT Tokens**: Access tokens (7 days) and refresh tokens (30 days)
3. **Token Refresh**: Automatic token refresh on 401 errors
4. **CORS Protection**: Configured for specific frontend origin
5. **Input Validation**: Express-validator for request validation
6. **Account Status**: Support for account deactivation

## Testing

### Test Email/Password Auth

1. Navigate to `http://localhost:5173/auth/signup`
2. Fill in the form and create an account
3. You'll be automatically signed in and redirected to dashboard

### Test OAuth

1. Click "Google" or "Discord" button on sign in/sign up page
2. You'll be redirected to the OAuth provider
3. After authorization, you'll be redirected back and signed in

## Troubleshooting

### OAuth Callback Issues

- Ensure redirect URIs match exactly in OAuth provider settings
- Check that `FRONTEND_URL` in backend `.env` matches your frontend URL
- Verify OAuth credentials are correct in `.env`

### CORS Errors

- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that frontend is using the correct `VITE_API_URL`

### Token Issues

- Tokens are stored in `localStorage`
- Clear browser storage if experiencing auth issues
- Check browser console for error messages

## Production Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Update `FRONTEND_URL` to production URL
- [ ] Update OAuth redirect URIs to production URLs
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS for all OAuth callbacks
- [ ] Configure proper CORS origins
- [ ] Set up MongoDB connection string for production
- [ ] Enable rate limiting (recommended)
- [ ] Set up error logging/monitoring

