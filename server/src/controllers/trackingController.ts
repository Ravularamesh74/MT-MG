import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import VehicleLocation from '../models/VehicleLocation';
import { AuthRequest } from '../middleware/auth';
import { getIO } from '../config/socket';

// @desc    Update vehicle location (called by driver app)
// @route   POST /api/tracking/update
// @access  Private (vendor/admin)
export const updateLocation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { vehicleId, lat, lng, speed, heading, bookingId } = req.body;

    if (!vehicleId || lat === undefined || lng === undefined) {
        throw ApiError.badRequest('vehicleId, lat, and lng are required');
    }

    const location = await VehicleLocation.findOneAndUpdate(
        { vehicleId },
        {
            vehicleId,
            lat,
            lng,
            speed: speed || 0,
            heading,
            driverId: req.user?.id,
            bookingId,
            updatedAt: new Date(),
        },
        { upsert: true, new: true }
    );

    // Broadcast via Socket.IO
    const io = getIO();
    if (io) {
        io.to(`vehicle:${vehicleId}`).emit('location:updated', {
            vehicleId,
            lat,
            lng,
            speed,
            heading,
            timestamp: new Date().toISOString(),
        });
    }

    res.status(200).json(
        new ApiResponse(200, 'Location updated successfully', { location })
    );
});

// @desc    Get current vehicle location
// @route   GET /api/tracking/:vehicleId
// @access  Private
export const getVehicleLocation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const location = await VehicleLocation.findOne({ vehicleId: req.params.vehicleId })
        .populate('vehicleId', 'name registrationNo')
        .populate('driverId', 'name phone');

    if (!location) {
        throw ApiError.notFound('Vehicle location not found');
    }

    res.status(200).json(
        new ApiResponse(200, 'Vehicle location retrieved', { location })
    );
});

// @desc    Get vehicle location history
// @route   GET /api/tracking/:vehicleId/history
// @access  Private
export const getLocationHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { vehicleId } = req.params;
    const { hours = 24 } = req.query;

    const since = new Date(Date.now() - Number(hours) * 60 * 60 * 1000);

    const locations = await VehicleLocation.find({
        vehicleId,
        updatedAt: { $gte: since },
    }).sort({ updatedAt: -1 });

    res.status(200).json(
        new ApiResponse(200, 'Location history retrieved', { locations, total: locations.length })
    );
});

// @desc    Get all active vehicle locations
// @route   GET /api/tracking/active
// @access  Private (admin/vendor)
export const getActiveVehicles = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const locations = await VehicleLocation.find({
        updatedAt: { $gte: tenMinutesAgo },
    })
        .populate('vehicleId', 'name registrationNo image')
        .populate('driverId', 'name phone');

    res.status(200).json(
        new ApiResponse(200, 'Active vehicles retrieved', { locations, total: locations.length })
    );
});
