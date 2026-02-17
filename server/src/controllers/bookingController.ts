import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import Booking from '../models/Booking';
import Car from '../models/Car';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { validateTransition, getAllowedTransitions, BookingStatus } from '../services/bookingStateMachine';

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private
export const getAllBookings = asyncHandler(async (req: AuthRequest, res: Response) => {
    let query: any = {};

    // Role-based filtering
    if (req.user?.role === 'user') {
        query.customerId = req.user.id;
    } else if (req.user?.role === 'vendor') {
        // Vendors see bookings for their vehicles (via assignedDriverId or car ownership)
        query.$or = [
            { assignedDriverId: req.user.id },
        ];
    }
    // Admin sees all bookings

    // Status filter
    if (req.query.status) {
        query.status = req.query.status;
    }

    const bookings = await Booking.find(query)
        .populate('customerId', 'name email phone')
        .populate('carId', 'name image registrationNo')
        .populate('assignedDriverId', 'name phone')
        .sort({ createdAt: -1 });

    res.status(200).json(
        new ApiResponse(200, 'Bookings retrieved successfully', { bookings, total: bookings.length })
    );
});

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
export const getBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
    const booking = await Booking.findById(req.params.id)
        .populate('customerId', 'name email phone')
        .populate('carId')
        .populate('assignedDriverId', 'name phone');

    if (!booking) {
        throw ApiError.notFound('Booking not found');
    }

    // Check if user is authorized to view
    if (req.user?.role === 'user' && booking.customerId.toString() !== req.user.id) {
        throw ApiError.forbidden('Not authorized to access this booking');
    }

    // Get allowed transitions for this booking
    const allowedTransitions = getAllowedTransitions(booking.status as BookingStatus);

    res.status(200).json(
        new ApiResponse(200, 'Booking retrieved successfully', { booking, allowedTransitions })
    );
});

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private/Public (guest)
export const createBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        carId,
        pickupDate,
        pickupTime,
        dropoffDate,
        dropoffTime,
        pickupLocation,
        dropoffLocation,
        services,
        customerName,
        customerEmail,
        customerPhone
    } = req.body;

    // Get car details
    const car = await Car.findById(carId);
    if (!car) {
        throw ApiError.notFound('Car not found');
    }

    if (car.status !== 'Available') {
        throw ApiError.badRequest('Car is not available for booking');
    }

    let user;

    // If user is authenticated, use their details
    if (req.user) {
        user = await User.findById(req.user.id);
    } else {
        // Guest booking: find or create user
        if (!customerEmail || !customerName || !customerPhone) {
            throw ApiError.badRequest('Customer details are required for guest booking');
        }

        user = await User.findOne({ email: customerEmail.toLowerCase() });

        if (!user) {
            user = await User.create({
                name: customerName,
                email: customerEmail,
                phone: customerPhone,
                password: Math.random().toString(36).slice(-10),
            });
        }
    }

    if (!user) {
        throw ApiError.notFound('User not found');
    }

    // Calculate total amount
    const pickup = new Date(pickupDate);
    const dropoff = new Date(dropoffDate);
    const diffMs = dropoff.getTime() - pickup.getTime();
    const days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const totalAmount = days * car.pricePerDay;

    // Create booking with 'draft' status
    const booking = await Booking.create({
        customerId: user._id,
        customerName: user.name,
        customerPhone: user.phone,
        carId: car._id,
        carName: car.name,
        pickupDate,
        pickupTime,
        dropoffDate,
        dropoffTime,
        pickupLocation,
        dropoffLocation,
        totalAmount,
        services: services || [],
        status: 'draft',
    });

    // Update car status
    car.status = 'Rented';
    await car.save();

    res.status(201).json(
        new ApiResponse(201, 'Booking created successfully', { booking })
    );
});

// @desc    Update booking status (state machine)
// @route   PATCH /api/bookings/:id/status
// @access  Private (admin/vendor)
export const updateBookingStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
        throw ApiError.notFound('Booking not found');
    }

    // Validate state transition
    validateTransition(booking.status as BookingStatus, status);

    booking.status = status;

    // Handle side effects
    if (status === 'completed' || status === 'cancelled') {
        await Car.findByIdAndUpdate(booking.carId, { status: 'Available' });
    }

    if (status === 'completed') {
        booking.actualEndTime = new Date();
        await User.findByIdAndUpdate(booking.customerId, {
            $inc: { totalBookings: 1, totalSpent: booking.totalAmount },
            lastBookingDate: new Date(),
        });
    }

    if (status === 'ongoing') {
        booking.actualStartTime = new Date();
    }

    await booking.save();

    res.status(200).json(
        new ApiResponse(200, 'Booking status updated successfully', { booking })
    );
});

// @desc    Assign driver to booking
// @route   POST /api/bookings/:id/assign
// @access  Private (admin/vendor)
export const assignDriver = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { driverId } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        throw ApiError.notFound('Booking not found');
    }

    // Validate transition confirmed → assigned
    validateTransition(booking.status as BookingStatus, 'assigned');

    const driver = await User.findById(driverId);
    if (!driver || (driver.role !== 'vendor' && driver.role !== 'admin')) {
        throw ApiError.badRequest('Invalid driver');
    }

    booking.assignedDriverId = driver._id;
    booking.status = 'assigned';
    await booking.save();

    res.status(200).json(
        new ApiResponse(200, 'Driver assigned successfully', { booking })
    );
});

// @desc    Start trip
// @route   POST /api/bookings/:id/start
// @access  Private (admin/vendor)
export const startTrip = asyncHandler(async (req: AuthRequest, res: Response) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        throw ApiError.notFound('Booking not found');
    }

    validateTransition(booking.status as BookingStatus, 'ongoing');

    booking.status = 'ongoing';
    booking.actualStartTime = new Date();
    await booking.save();

    res.status(200).json(
        new ApiResponse(200, 'Trip started', { booking })
    );
});

// @desc    Complete trip
// @route   POST /api/bookings/:id/complete
// @access  Private (admin/vendor)
export const completeTrip = asyncHandler(async (req: AuthRequest, res: Response) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        throw ApiError.notFound('Booking not found');
    }

    validateTransition(booking.status as BookingStatus, 'completed');

    booking.status = 'completed';
    booking.actualEndTime = new Date();
    await booking.save();

    // Free up the car
    await Car.findByIdAndUpdate(booking.carId, { status: 'Available' });

    // Update user stats
    await User.findByIdAndUpdate(booking.customerId, {
        $inc: { totalBookings: 1, totalSpent: booking.totalAmount },
        lastBookingDate: new Date(),
    });

    res.status(200).json(
        new ApiResponse(200, 'Trip completed', { booking })
    );
});

// @desc    Cancel booking
// @route   POST /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
        throw ApiError.notFound('Booking not found');
    }

    // Check authorization
    if (req.user?.role === 'user' && booking.customerId.toString() !== req.user.id) {
        throw ApiError.forbidden('Not authorized to cancel this booking');
    }

    // Validate allowed cancel transition
    validateTransition(booking.status as BookingStatus, 'cancelled');

    booking.status = 'cancelled';
    await booking.save();

    // Update car status
    await Car.findByIdAndUpdate(booking.carId, { status: 'Available' });

    res.status(200).json(
        new ApiResponse(200, 'Booking cancelled successfully', { booking })
    );
});
