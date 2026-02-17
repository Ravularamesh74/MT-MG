import { Router } from 'express';
import {
    register,
    login,
    getMe,
    logout,
    logoutAll,
    refreshAccessToken,
    googleAuth,
    googleCallback,
} from '../controllers/authController';
import { protect } from '../middleware/auth';
import { validate, schemas } from '../middleware/validate';
import passport from 'passport';

const router = Router();

// Local auth
router.post('/register', validate(schemas.register), register);
router.post('/login', validate(schemas.login), login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/logout-all', protect, logoutAll);
router.post('/refresh-token', refreshAccessToken);

// Google OAuth
router.get('/google', googleAuth);
router.get(
    '/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    googleCallback
);

export default router;
