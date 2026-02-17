import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import passport from 'passport';
import User from '../models/User';
import { config } from '../config/env';

if (config.googleClientId && config.googleClientSecret) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: config.googleClientId,
                clientSecret: config.googleClientSecret,
                callbackURL: config.googleCallbackUrl,
                scope: ['profile', 'email'],
            },
            async (
                _accessToken: string,
                _refreshToken: string,
                profile: Profile,
                done: (error: any, user?: any) => void
            ) => {
                try {
                    const email = profile.emails?.[0]?.value;
                    if (!email) {
                        return done(new Error('No email found in Google profile'), false);
                    }

                    // Find existing user or create new one
                    let user = await User.findOne({
                        $or: [{ googleId: profile.id }, { email }],
                    });

                    if (user) {
                        // Link Google account if not already linked
                        if (!user.googleId) {
                            user.googleId = profile.id;
                            user.isVerified = true;
                            if (profile.photos?.[0]?.value) {
                                user.avatar = profile.photos[0].value;
                            }
                            await user.save();
                        }
                    } else {
                        // Create new user from Google profile
                        user = await User.create({
                            name: profile.displayName || `${profile.name?.givenName} ${profile.name?.familyName}`,
                            email,
                            googleId: profile.id,
                            isVerified: true,
                            avatar: profile.photos?.[0]?.value,
                            role: 'user',
                        });
                    }

                    return done(null, user);
                } catch (error) {
                    return done(error, false);
                }
            }
        )
    );
} else {
    console.warn('⚠️ Google OAuth not configured. GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required.');
}

export default passport;
