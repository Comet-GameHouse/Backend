const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const User = require('../models/User');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy (only register if credentials are provided)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists with this Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // Update last login
            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
          }

          // Check if user exists with this email
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            if (!user.avatarUrl && profile.photos && profile.photos[0]) {
              user.avatarUrl = profile.photos[0].value;
            }
            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            email: profile.emails[0].value,
            displayName: profile.displayName || profile.name.givenName,
            username: profile.emails[0].value.split('@')[0] + '_' + Date.now().toString().slice(-6),
            avatarUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : undefined,
            googleId: profile.id,
            isVerified: profile.emails[0].verified || false,
            role: 'player',
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
  console.log('Google OAuth strategy registered');
} else {
  console.warn('Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required');
}

// Discord OAuth Strategy (only register if credentials are provided)
if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  passport.use(
    new DiscordStrategy(
      {
        clientID: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        callbackURL: process.env.DISCORD_CALLBACK_URL || '/api/auth/discord/callback',
        scope: ['identify', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists with this Discord ID
          let user = await User.findOne({ discordId: profile.id });

          if (user) {
            // Update last login
            user.lastLogin = new Date();
            await user.save();
            return done(null, user);
          }

          // Check if user exists with this email
          if (profile.email) {
            user = await User.findOne({ email: profile.email });

            if (user) {
              // Link Discord account to existing user
              user.discordId = profile.id;
              if (!user.avatarUrl && profile.avatar) {
                user.avatarUrl = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`;
              }
              user.lastLogin = new Date();
              await user.save();
              return done(null, user);
            }
          }

          // Create new user
          const username = profile.username + '_' + Date.now().toString().slice(-6);
          user = await User.create({
            email: profile.email || undefined,
            displayName: profile.username,
            username: username,
            avatarUrl: profile.avatar
              ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
              : undefined,
            discordId: profile.id,
            isVerified: profile.verified || false,
            role: 'player',
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
  console.log('Discord OAuth strategy registered');
} else {
  console.warn('Discord OAuth not configured - DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET required');
}

module.exports = passport;

