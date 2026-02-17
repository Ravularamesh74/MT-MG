import { Router } from 'express';
import {
    createOrder,
    verifyPayment,
    handleWebhook,
    processRefund,
    getPaymentByBooking,
} from '../controllers/paymentController';
import { protect } from '../middleware/auth';
import { allowRoles } from '../middleware/rbac.middleware';
import express from 'express';

const router = Router();

// Payment operations (authenticated)
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/:bookingId', protect, getPaymentByBooking);

// Webhook (public - verified by Razorpay signature)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Refund (admin only)
router.post('/refund', protect, allowRoles('admin'), processRefund);

export default router;
