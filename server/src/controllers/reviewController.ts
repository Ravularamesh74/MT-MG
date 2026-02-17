import { Response, Request } from 'express';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import Review from '../models/Review';
import Booking from '../models/Booking';
import { AuthRequest } from '../middleware/auth';

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
export const getAllReviews = asyncHandler(async (_req: Request, res: Response) => {
    const reviews = await Review.find({ verified: true })
        .populate('customerId', 'name')
        .sort({ createdAt: -1 });

    res.status(200).json(
        new ApiResponse(200, 'Reviews retrieved successfully', { reviews, total: reviews.length })
    );
});

// @desc    Get reviews for a car
// @route   GET /api/reviews/car/:carId
// @access  Public
export const getCarReviews = asyncHandler(async (req: Request, res: Response) => {
    const reviews = await Review.find({ carId: req.params.carId, verified: true })
        .populate('customerId', 'name')
        .sort({ createdAt: -1 });

    // Calculate average rating
    const avgRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

    res.status(200).json(
        new ApiResponse(200, 'Car reviews retrieved successfully', {
            reviews,
            total: reviews.length,
            averageRating: avgRating.toFixed(1)
        })
    );
});

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
export const createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { bookingId, rating, review: reviewText } = req.body;

    // Get booking
    const booking = await Booking.findById(bookingId);

    if (!booking) {
        throw ApiError.notFound('Booking not found');
    }

    // Check if customer owns the booking
    if (booking.customerId.toString() !== req.user?.id) {
        throw ApiError.forbidden('You can only review your own bookings');
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
        throw ApiError.conflict('You have already reviewed this booking');
    }

    // Create review
    const newReview = await Review.create({
        customerId: req.user.id,
        customerName: booking.customerName,
        bookingId,
        carId: booking.carId,
        rating,
        review: reviewText,
        location: booking.pickupLocation,
    });

    res.status(201).json(
        new ApiResponse(201, 'Review created successfully', { review: newReview })
    );
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
export const updateReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    let review = await Review.findById(req.params.id);

    if (!review) {
        throw ApiError.notFound('Review not found');
    }

    // Check ownership
    if (review.customerId.toString() !== req.user?.id && req.user?.role !== 'admin') {
        throw ApiError.forbidden('Not authorized to update this review');
    }

    review = await Review.findByIdAndUpdate(
        req.params.id,
        { rating: req.body.rating, review: req.body.review },
        { new: true, runValidators: true }
    );

    res.status(200).json(
        new ApiResponse(200, 'Review updated successfully', { review })
    );
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
export const deleteReview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const review = await Review.findById(req.params.id);

    if (!review) {
        throw ApiError.notFound('Review not found');
    }

    // Check ownership
    if (review.customerId.toString() !== req.user?.id && req.user?.role !== 'admin') {
        throw ApiError.forbidden('Not authorized to delete this review');
    }

    await review.deleteOne();

    res.status(200).json(
        new ApiResponse(200, 'Review deleted successfully', null)
    );
});
