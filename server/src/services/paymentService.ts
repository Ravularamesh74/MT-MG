import crypto from 'crypto';
import { config } from '../config/env';
import { razorpay } from '../config/razorpay';
import Payment from '../models/Payment';
import Booking from '../models/Booking';
import ApiError from '../utils/ApiError';

class PaymentService {
    /**
     * Create a Razorpay order for a booking
     */
    async createOrder(bookingId: string, userId: string) {
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            throw ApiError.notFound('Booking not found');
        }

        if (!razorpay) {
            throw ApiError.internal('Razorpay is not configured');
        }

        const options = {
            amount: Math.round(booking.totalAmount * 100), // Amount in paise
            currency: 'INR',
            receipt: `receipt_${booking.bookingId}`,
            notes: {
                bookingId: booking._id.toString(),
                userId,
            },
        };

        const order = await (razorpay as any).orders.create(options);

        // Save payment record
        const payment = await Payment.create({
            bookingId: booking._id,
            userId,
            orderId: order.id,
            amount: booking.totalAmount,
            currency: 'INR',
            status: 'created',
        });

        return { order, payment };
    }

    /**
     * Verify Razorpay payment signature using HMAC
     */
    verifySignature(orderId: string, paymentId: string, signature: string): boolean {
        const body = orderId + '|' + paymentId;
        const expectedSignature = crypto
            .createHmac('sha256', config.razorpayKeySecret)
            .update(body)
            .digest('hex');

        return expectedSignature === signature;
    }

    /**
     * Process successful payment verification
     */
    async capturePayment(orderId: string, paymentId: string, signature: string) {
        const isValid = this.verifySignature(orderId, paymentId, signature);
        if (!isValid) {
            throw ApiError.badRequest('Invalid payment signature');
        }

        const payment = await Payment.findOne({ orderId });
        if (!payment) {
            throw ApiError.notFound('Payment record not found');
        }

        payment.paymentId = paymentId;
        payment.signature = signature;
        payment.status = 'captured';
        await payment.save();

        // Update booking status
        await Booking.findByIdAndUpdate(payment.bookingId, {
            status: 'confirmed',
            paymentStatus: 'Paid',
        });

        return payment;
    }

    /**
     * Process a refund
     */
    async processRefund(paymentId: string, amount?: number) {
        if (!razorpay) {
            throw ApiError.internal('Razorpay is not configured');
        }

        const payment = await Payment.findOne({ paymentId });
        if (!payment) {
            throw ApiError.notFound('Payment not found');
        }

        if (payment.status === 'refunded') {
            throw ApiError.badRequest('Payment already refunded');
        }

        const refundAmount = amount || payment.amount;

        try {
            const refund = await (razorpay as any).payments.refund(paymentId, {
                amount: Math.round(refundAmount * 100),
            });

            payment.status = 'refunded';
            payment.refundId = refund.id;
            payment.refundAmount = refundAmount;
            await payment.save();

            // Update booking
            await Booking.findByIdAndUpdate(payment.bookingId, {
                paymentStatus: 'Refunded',
            });

            return { refund, payment };
        } catch (error: any) {
            throw ApiError.internal(`Refund failed: ${error.message}`);
        }
    }

    /**
     * Handle Razorpay webhook events
     */
    async handleWebhook(event: string, payload: any, signature: string) {
        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', config.razorpayWebhookSecret)
            .update(JSON.stringify(payload))
            .digest('hex');

        if (expectedSignature !== signature) {
            throw ApiError.unauthorized('Invalid webhook signature');
        }

        const paymentEntity = payload.payment?.entity;

        switch (event) {
            case 'payment.captured': {
                const payment = await Payment.findOne({ orderId: paymentEntity?.order_id });
                if (payment) {
                    payment.paymentId = paymentEntity.id;
                    payment.status = 'captured';
                    payment.method = paymentEntity.method;
                    await payment.save();

                    await Booking.findByIdAndUpdate(payment.bookingId, {
                        status: 'confirmed',
                        paymentStatus: 'Paid',
                    });
                }
                break;
            }
            case 'payment.failed': {
                const payment = await Payment.findOne({ orderId: paymentEntity?.order_id });
                if (payment) {
                    payment.status = 'failed';
                    await payment.save();
                }
                break;
            }
            case 'refund.created': {
                const refundEntity = payload.refund?.entity;
                const payment = await Payment.findOne({ paymentId: refundEntity?.payment_id });
                if (payment) {
                    payment.status = 'refunded';
                    payment.refundId = refundEntity.id;
                    payment.refundAmount = refundEntity.amount / 100;
                    await payment.save();

                    await Booking.findByIdAndUpdate(payment.bookingId, {
                        paymentStatus: 'Refunded',
                    });
                }
                break;
            }
        }

        return { received: true };
    }

    /**
     * Get payment details for a booking
     */
    async getPaymentByBooking(bookingId: string) {
        return await Payment.findOne({ bookingId }).sort({ createdAt: -1 });
    }
}

export const paymentService = new PaymentService();
