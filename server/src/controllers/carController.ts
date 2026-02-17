import { Response, Request } from 'express';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import Car from '../models/Car';
import { AuthRequest } from '../middleware/auth';

// @desc    Get all cars
// @route   GET /api/cars
// @access  Public
export const getAllCars = asyncHandler(async (req: Request, res: Response) => {
    const { category, transmission, fuelType, seats, minPrice, maxPrice, status } = req.query;

    let query: any = {};

    // Filters
    if (category && category !== 'all') query.category = category;
    if (transmission) query.transmission = transmission;
    if (fuelType) query.fuelType = fuelType;
    if (seats) query.seats = parseInt(seats as string);
    if (status) query.status = status;
    else query.status = 'Available'; // Default to available cars

    // Price range
    if (minPrice || maxPrice) {
        query.pricePerDay = {};
        if (minPrice) query.pricePerDay.$gte = parseInt(minPrice as string);
        if (maxPrice) query.pricePerDay.$lte = parseInt(maxPrice as string);
    }

    const cars = await Car.find(query).sort({ createdAt: -1 });

    res.status(200).json(
        new ApiResponse(200, 'Cars retrieved successfully', { cars, total: cars.length })
    );
});

// @desc    Get single car
// @route   GET /api/cars/:id
// @access  Public
export const getCar = asyncHandler(async (req: Request, res: Response) => {
    const car = await Car.findById(req.params.id);

    if (!car) {
        throw ApiError.notFound('Car not found');
    }

    res.status(200).json(
        new ApiResponse(200, 'Car retrieved successfully', { car })
    );
});

// @desc    Create car
// @route   POST /api/cars
// @access  Private/Admin
export const createCar = asyncHandler(async (req: AuthRequest, res: Response) => {
    const car = await Car.create(req.body);

    res.status(201).json(
        new ApiResponse(201, 'Car created successfully', { car })
    );
});

// @desc    Update car
// @route   PUT /api/cars/:id
// @access  Private/Admin
export const updateCar = asyncHandler(async (req: AuthRequest, res: Response) => {
    let car = await Car.findById(req.params.id);

    if (!car) {
        throw ApiError.notFound('Car not found');
    }

    car = await Car.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json(
        new ApiResponse(200, 'Car updated successfully', { car })
    );
});

// @desc    Delete car
// @route   DELETE /api/cars/:id
// @access  Private/Admin
export const deleteCar = asyncHandler(async (req: AuthRequest, res: Response) => {
    const car = await Car.findById(req.params.id);

    if (!car) {
        throw ApiError.notFound('Car not found');
    }

    await car.deleteOne();

    res.status(200).json(
        new ApiResponse(200, 'Car deleted successfully', null)
    );
});

// @desc    Update car status
// @route   PATCH /api/cars/:id/status
// @access  Private/Admin
export const updateCarStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status } = req.body;

    const car = await Car.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
    );

    if (!car) {
        throw ApiError.notFound('Car not found');
    }

    res.status(200).json(
        new ApiResponse(200, 'Car status updated successfully', { car })
    );
});

// @desc    Get available cars for date range
// @route   GET /api/cars/available
// @access  Public
export const getAvailableCars = asyncHandler(async (_req: Request, res: Response) => {
    // const { startDate, endDate } = req.query;

    // This would need to check against bookings
    // For now, just return available cars
    const cars = await Car.find({ status: 'Available' });

    res.status(200).json(
        new ApiResponse(200, 'Available cars retrieved successfully', { cars })
    );
});
