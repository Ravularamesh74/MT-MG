import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/env';
import RefreshToken from '../models/RefreshToken';

class TokenService {
    /**
     * Generate both access and refresh token pair
     */
    async generateTokens(userId: string, email: string, role: string, deviceInfo?: string) {
        const accessToken = jwt.sign(
            { id: userId, email, role },
            config.jwtSecret,
            { expiresIn: '15m' }
        );

        const refreshTokenStr = crypto.randomBytes(64).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await RefreshToken.create({
            userId,
            token: refreshTokenStr,
            expiresAt,
            deviceInfo,
        });

        return { accessToken, refreshToken: refreshTokenStr };
    }

    /**
     * Verify and rotate refresh token
     */
    async verifyRefreshToken(token: string) {
        const storedToken = await RefreshToken.findOne({ token }).populate('userId');

        if (!storedToken) {
            return null;
        }

        if (storedToken.expiresAt < new Date()) {
            await RefreshToken.deleteOne({ _id: storedToken._id });
            return null;
        }

        return storedToken;
    }

    /**
     * Revoke a specific refresh token (single device logout)
     */
    async revokeToken(token: string) {
        const result = await RefreshToken.deleteOne({ token });
        return result.deletedCount > 0;
    }

    /**
     * Revoke all refresh tokens for a user (logout from all devices)
     */
    async revokeAllUserTokens(userId: string) {
        const result = await RefreshToken.deleteMany({ userId });
        return result.deletedCount;
    }

    /**
     * Clean up expired tokens (called periodically)
     */
    async cleanupExpiredTokens() {
        const result = await RefreshToken.deleteMany({
            expiresAt: { $lt: new Date() },
        });
        return result.deletedCount;
    }
}

export const tokenService = new TokenService();
