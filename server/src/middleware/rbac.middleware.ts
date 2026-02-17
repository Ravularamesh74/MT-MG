import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';

/**
 * Require specific roles to access a route
 * Usage: allowRoles('admin', 'vendor')
 */
export const allowRoles = (...roles: string[]) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const user = (req as any).user;
        if (!user) {
            throw ApiError.unauthorized('Authentication required');
        }

        if (!roles.includes(user.role)) {
            throw ApiError.forbidden(
                `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${user.role}`
            );
        }

        next();
    };
};

/**
 * Admin-only access shorthand
 */
export const isAdmin = allowRoles('admin');

/**
 * Vendor or admin access shorthand
 */
export const isVendor = allowRoles('admin', 'vendor');

/**
 * User-only access (for booking, etc.)
 */
export const isUser = allowRoles('user');

/**
 * Check if user owns the resource or is admin
 */
export const isOwnerOrAdmin = (getOwnerId: (req: Request) => string | undefined) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const user = (req as any).user;
        if (!user) {
            throw ApiError.unauthorized('Authentication required');
        }

        const ownerId = getOwnerId(req);
        if (user.role === 'admin' || user.id === ownerId) {
            return next();
        }

        throw ApiError.forbidden('You can only access your own resources');
    };
};
