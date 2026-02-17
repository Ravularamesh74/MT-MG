import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import Car from '../models/Car';
import User from '../models/User';
import Booking from '../models/Booking';
import { AuthRequest } from '../middleware/auth';
import { getIO } from '../config/socket';

// @desc    Get live fleet (simulated)
// @route   GET /api/fleet/live
// @access  Public
export const getLiveFleet = asyncHandler(async (req: AuthRequest, res: Response) => {
    const cars = await Car.find({ status: 'Available' });

    const liveFleet = cars.map(car => {
        const latOffset = (Math.random() - 0.5) * 0.05;
        const lngOffset = (Math.random() - 0.5) * 0.05;

        return {
            id: car._id,
            name: car.name,
            type: car.category,
            image: car.image,
            // Base fare + (pricePerDay / 100) per km roughly
            baseFare: 50,
            perKm: 12 + (Math.random() * 5),
            lat: 12.9716 + latOffset,
            lng: 77.5946 + lngOffset,
            eta: Math.floor(Math.random() * 10) + 2,
            heading: Math.floor(Math.random() * 360)
        };
    });

    res.status(200).json(
        new ApiResponse(200, 'Live fleet retrieved', { vehicles: liveFleet })
    );
});

// @desc    Get route details (simulated)
// @route   GET /api/maps/route
// @access  Public
export const getRoute = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { from, to } = req.query;
    if (!from || !to) throw ApiError.badRequest("From and To are required");

    // Simulate routing
    const distance = Math.floor(Math.random() * 15) + 3;
    const duration = distance * 3; // 3 mins per km

    res.status(200).json({
        distance,
        duration,
        // Detailed polyline would go here
        polyline: "mock_polyline"
    });
});

// @desc    Get live surge multiplier
// @route   GET /api/pricing/surge/live
// @access  Public
export const getSurge = asyncHandler(async (req: AuthRequest, res: Response) => {
    const hour = new Date().getHours();
    let multiplier = 1.0;

    if ((hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 20)) {
        multiplier = 1.2 + (Math.random() * 0.4);
    }

    res.status(200).json({
        multiplier: parseFloat(multiplier.toFixed(1))
    });
});

// @desc    Calculate AI Price
// @route   POST /api/pricing/ai
// @access  Public
export const calculateAiPrice = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { vehicle, distance, demand } = req.body;

    const basePrice = 40;
    // 15 rs per km base
    const price = Math.round((basePrice + (distance * 15)) * demand);

    res.status(200).json({
        price
    });
});

// @desc    Get Wallet Balance
// @route   GET /api/wallet
// @access  Private
export const getWallet = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user?.id);
    if (!user) {
        throw ApiError.notFound('User not found');
    }
    res.status(200).json({
        balance: user.walletBalance || 0,
        currency: 'INR'
    });
});

// @desc    Get Driver ETA
// @route   GET /api/drivers/eta
// @access  Public
export const getDriverEta = asyncHandler(async (req: AuthRequest, res: Response) => {
    res.status(200).json({
        eta: Math.floor(Math.random() * 5) + 1
    });
});

// @desc    Request Instant Ride (Uber style) - Starts simulation
// @route   POST /api/bookings/instant
// @access  Private
export const createInstantBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { vehicleId, pickup, drop, price } = req.body;

    const user = await User.findById(req.user?.id);
    if (!user) throw ApiError.notFound('User not found');

    const car = await Car.findById(vehicleId);
    if (!car) throw ApiError.notFound('Vehicle not available');

    // 1. Create Booking in 'searching' status (if model supports it, otherwise 'draft' or 'pending')
    // We'll use 'pending' for now and simulate the "Finding Driver" part
    const booking = await Booking.create({
        customerId: user._id,
        customerName: user.name,
        customerPhone: user.phone,
        carId: car._id,
        carName: car.name,
        pickupLocation: pickup,
        dropoffLocation: drop,
        pickupDate: new Date(),
        pickupTime: new Date().toLocaleTimeString(),
        dropoffDate: new Date(Date.now() + 3600000),
        dropoffTime: new Date(Date.now() + 3600000).toLocaleTimeString(),
        totalAmount: price,
        status: 'pending',
        paymentStatus: 'Unpaid',
        duration: '1 hour'
    });

    const io = getIO();

    // 2. Simulate "Finding Driver" -> "Driver Assigned" after 3 seconds
    setTimeout(async () => {
        // Update booking
        await Booking.findByIdAndUpdate(booking._id, { status: 'confirmed' });

        // Emit Socket Event to User
        // Note: In real app, we emit to `user:${user._id}` room. 
        // For now, let's assume client joins `booking:${booking._id}`
        io?.to(`booking:${booking._id}`).emit('ride:assigned', {
            bookingId: booking._id,
            driver: {
                name: "Ramesh Kumar",
                rating: 4.8,
                phone: "+91 98765 43210",
                image: "https://randomuser.me/api/portraits/men/32.jpg"
            },
            vehicle: {
                model: car.name,
                plate: car.registrationNo || "KA-01-AB-1234",
                color: "White"
            },
            eta: 3 // mins
        });
    }, 4000);

    // 3. Simulate "Driver Arrived" after 10 seconds (for demo)
    setTimeout(() => {
        io?.to(`booking:${booking._id}`).emit('ride:arrived', {
            message: "Your captain has arrived!"
        });
    }, 12000);

    // 4. Simulate "Ride Started" after 15 seconds
    setTimeout(() => {
        io?.to(`booking:${booking._id}`).emit('ride:started', {
            message: "Ride started. Enjoy your journey!"
        });
    }, 18000);

    // 5. Simulate "Ride Completed" after 25 seconds (fast ride for demo!)
    setTimeout(async () => {
        // Deduct wallet
        if (user.walletBalance >= price) {
            user.walletBalance -= price;
            user.totalSpent += price;
            await user.save();
        }

        await Booking.findByIdAndUpdate(booking._id, {
            status: 'completed',
            paymentStatus: 'Paid'
        });

        io?.to(`booking:${booking._id}`).emit('ride:completed', {
            message: "Ride completed. Amount deducted from wallet."
        });
    }, 28000);


    res.status(201).json({
        id: booking._id,
        status: 'searching',
        message: 'Looking for nearby drivers...'
    });
});
