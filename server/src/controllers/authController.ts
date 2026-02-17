import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { tokenService } from '../services/tokenService';
import passport from '../strategies/google.strategy';

// Cookie options for refresh token
const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/',
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, email, password, phone, city } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        throw ApiError.conflict('User already exists with this email');
    }

    // Create user
    const user = await User.create({
        name,
        email,
        password,
        phone,
        city,
    });

    // Generate token pair
    const deviceInfo = req.headers['user-agent'] || 'unknown';
    const { accessToken, refreshToken } = await tokenService.generateTokens(
        user._id.toString(),
        user.email,
        user.role,
        deviceInfo
    );

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(201).json(
        new ApiResponse(201, 'User registered successfully', {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
            },
            accessToken,
        })
    );
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        throw ApiError.unauthorized('Invalid credentials');
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw ApiError.unauthorized('Invalid credentials');
    }

    // Generate token pair
    const deviceInfo = req.headers['user-agent'] || 'unknown';
    const { accessToken, refreshToken } = await tokenService.generateTokens(
        user._id.toString(),
        user.email,
        user.role,
        deviceInfo
    );

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(200).json(
        new ApiResponse(200, 'Login successful', {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
            },
            accessToken,
        })
    );
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public (but requires valid refresh token)
export const refreshAccessToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const refreshTokenStr = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshTokenStr) {
        throw ApiError.unauthorized('Refresh token required');
    }

    const storedToken = await tokenService.verifyRefreshToken(refreshTokenStr);
    if (!storedToken) {
        throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    // Get user
    const user = await User.findById(storedToken.userId);
    if (!user) {
        throw ApiError.unauthorized('User not found');
    }

    // Revoke old refresh token (token rotation)
    await tokenService.revokeToken(refreshTokenStr);

    // Generate new token pair
    const deviceInfo = req.headers['user-agent'] || 'unknown';
    const { accessToken, refreshToken: newRefreshToken } = await tokenService.generateTokens(
        user._id.toString(),
        user.email,
        user.role,
        deviceInfo
    );

    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, REFRESH_COOKIE_OPTIONS);

    res.status(200).json(
        new ApiResponse(200, 'Token refreshed successfully', { accessToken })
    );
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user?.id);

    if (!user) {
        throw ApiError.notFound('User not found');
    }

    res.status(200).json(
        new ApiResponse(200, 'User retrieved successfully', { user })
    );
});

// @desc    Logout user (revoke current token)
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const refreshTokenStr = req.cookies?.refreshToken;

    if (refreshTokenStr) {
        await tokenService.revokeToken(refreshTokenStr);
    }

    // Clear cookies
    res.clearCookie('refreshToken', { path: '/' });

    res.status(200).json(
        new ApiResponse(200, 'Logout successful', null)
    );
});

// @desc    Logout from all devices
// @route   POST /api/auth/logout-all
// @access  Private
export const logoutAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user?.id) {
        throw ApiError.unauthorized('Not authenticated');
    }

    const count = await tokenService.revokeAllUserTokens(req.user.id);

    res.clearCookie('refreshToken', { path: '/' });

    res.status(200).json(
        new ApiResponse(200, `Logged out from ${count} device(s)`, null)
    );
});

// @desc    Google OAuth redirect
// @route   GET /api/auth/google
// @access  Public
export const googleAuth = passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
});

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
export const googleCallback = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user as any;

    if (!user) {
        throw ApiError.unauthorized('Google authentication failed');
    }

    // Generate tokens
    const deviceInfo = req.headers['user-agent'] || 'unknown';
    const { accessToken, refreshToken } = await tokenService.generateTokens(
        user._id.toString(),
        user.email,
        user.role,
        deviceInfo
    );

    // Set refresh token cookie
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);

    // Redirect to frontend with access token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
});
