import { Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import { AuthRequest } from '../middleware/auth';
import { paymentService } from '../services/paymentService';

// @desc    Create Razorpay Order
// @route   POST /api/payments/create-order
// @access  Private
export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { bookingId } = req.body;

    if (!bookingId) {
        throw ApiError.badRequest('bookingId is required');
    }

    const userId = req.user?.id;
    if (!userId) {
        throw ApiError.unauthorized('Authentication required');
    }

    const { order, payment } = await paymentService.createOrder(bookingId, userId);

    res.status(200).json(
        new ApiResponse(200, 'Razorpay order created successfully', { order, payment })
    );
});

// @desc    Verify Razorpay Payment
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw ApiError.badRequest('Missing payment verification fields');
    }

    const payment = await paymentService.capturePayment(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    );

    res.status(200).json(
        new ApiResponse(200, 'Payment verified and booking confirmed', { payment })
    );
});

// @desc    Razorpay Webhook Handler
// @route   POST /api/payments/webhook
// @access  Public (verified by signature)
export const handleWebhook = asyncHandler(async (req: AuthRequest, res: Response) => {
    const signature = req.headers['x-razorpay-signature'] as string;

    if (!signature) {
        throw ApiError.badRequest('Missing webhook signature');
    }

    const event = req.body.event;
    const result = await paymentService.handleWebhook(event, req.body, signature);

    res.status(200).json(
        new ApiResponse(200, 'Webhook processed', result)
    );
});

// @desc    Process refund
// @route   POST /api/payments/refund
// @access  Private (admin)
export const processRefund = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { paymentId, amount } = req.body;

    if (!paymentId) {
        throw ApiError.badRequest('paymentId is required');
    }

    const result = await paymentService.processRefund(paymentId, amount);

    res.status(200).json(
        new ApiResponse(200, 'Refund processed successfully', result)
    );
});

// @desc    Get payment details for a booking
// @route   GET /api/payments/:bookingId
// @access  Private
export const getPaymentByBooking = asyncHandler(async (req: AuthRequest, res: Response) => {
    const payment = await paymentService.getPaymentByBooking(req.params.bookingId);

    if (!payment) {
        throw ApiError.notFound('No payment found for this booking');
    }

    res.status(200).json(
        new ApiResponse(200, 'Payment details retrieved', { payment })
    );
});
