# Email Verification Setup

This document explains the email verification system for CometGameHouse.

## Overview

When users sign up with email/password, they receive a verification email with a link. They must click the link to verify their email address before their account is fully activated.

## Features

- ✅ Automatic verification email sent on signup
- ✅ 24-hour expiration for verification tokens
- ✅ Resend verification email functionality
- ✅ Token-based verification (secure)
- ✅ OAuth users are automatically verified (Google/Discord)

## Backend Configuration

### Email Service Setup

The email service supports multiple configurations:

#### Option 1: Gmail (Development)

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Add to `.env`:
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your-app-password
   ```

#### Option 2: SMTP Server (Production)

Add to `.env`:
```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
EMAIL_FROM="Comet GameHouse" <noreply@cometgamehouse.com>
```

#### Option 3: Ethereal Email (Testing)

For development/testing without real emails, the service will use Ethereal Email by default. Check console logs for preview URLs.

### Environment Variables

Add these to your `.env` file:

```env
# Email Configuration
EMAIL_FROM="Comet GameHouse" <noreply@cometgamehouse.com>

# Gmail (Development)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# OR SMTP (Production)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
```

## API Endpoints

### Verify Email
```
GET /api/auth/verify-email?token=<verification-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### Resend Verification Email
```
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

## User Flow

1. **Sign Up**: User creates account with email/password
   - Verification email is automatically sent
   - User is signed in but `isVerified: false`

2. **Email Verification**: User clicks link in email
   - Link format: `http://localhost:5173/auth/verify-code?token=<token>`
   - Backend verifies token and updates user
   - User is redirected to dashboard

3. **Resend Email**: If email is lost/expired
   - User can request a new verification email
   - New token is generated (24-hour expiration)

4. **Sign In**: Unverified users can still sign in
   - They receive a warning message
   - Account functionality may be limited until verified

## Frontend Routes

- `/auth/verify-code` - Email verification page
  - Handles token from email link
  - Shows resend option if needed
  - Auto-redirects after successful verification

## Security Features

- **Token Expiration**: 24 hours
- **One-time Use**: Token is deleted after verification
- **Secure Tokens**: 32-byte random hex tokens
- **Email Privacy**: Resend endpoint doesn't reveal if email exists

## Testing

### Test Email Verification

1. Sign up with a real email address
2. Check your inbox for verification email
3. Click the verification link
4. Should redirect to dashboard with verified status

### Test Resend

1. Go to `/auth/verify-code`
2. Enter your email
3. Click "Resend verification email"
4. Check inbox for new email

### Development Testing

If using Ethereal Email (default in dev):
- Check console logs for email preview URLs
- Click the URL to view the email in browser
- Copy the verification link from the email

## Troubleshooting

### Emails Not Sending

1. **Check SMTP/Gmail credentials** in `.env`
2. **Check console logs** for error messages
3. **Verify network/firewall** allows SMTP connections
4. **Check spam folder** - verification emails might be filtered

### Token Expired

- Tokens expire after 24 hours
- User must request a new verification email
- Use the resend endpoint or frontend resend button

### Invalid Token

- Token may have already been used
- Token may be expired
- Check that token matches exactly (no extra characters)

## Production Checklist

- [ ] Configure production SMTP server
- [ ] Set `EMAIL_FROM` with proper domain
- [ ] Test email delivery
- [ ] Set up email monitoring/logging
- [ ] Configure SPF/DKIM records for email domain
- [ ] Test verification flow end-to-end
- [ ] Set up email templates (optional customization)

