import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import ApiError from '../utils/ApiError';
import asyncHandler from '../utils/asyncHandler';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

export const protect = asyncHandler(async (req: AuthRequest, _res: Response, next: NextFunction) => {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Also check cookies
    if (!token && req.cookies?.accessToken) {
        token = req.cookies.accessToken;
    }

    if (!token) {
        throw ApiError.unauthorized('Not authorized to access this route');
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, config.jwtSecret) as any;

        // Attach user to request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        };

        next();
    } catch (error) {
        throw ApiError.unauthorized('Not authorized to access this route');
    }
});

export const restrictTo = (...roles: string[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const user = (req as any).user;
        if (!user || !roles.includes(user.role)) {
            throw ApiError.forbidden('You do not have permission to perform this action');
        }
        next();
    };
};

/**
 * Optional auth - doesn't fail if no token, but attaches user if present
 */
export const optionalAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token && (req as any).cookies?.accessToken) {
        token = (req as any).cookies.accessToken;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, config.jwtSecret) as any;
            (req as any).user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
            };
        } catch (_error) {
            // Token invalid, continue without user
        }
    }

    next();
});

