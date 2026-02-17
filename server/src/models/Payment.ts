import mongoose, { Document, Schema } from 'mongoose';

export type PaymentStatus = 'created' | 'authorized' | 'captured' | 'failed' | 'refunded';

export interface IPayment extends Document {
    bookingId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    orderId: string;
    paymentId?: string;
    signature?: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    refundId?: string;
    refundAmount?: number;
    method?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
    {
        bookingId: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        orderId: {
            type: String,
            required: true,
            unique: true,
        },
        paymentId: {
            type: String,
            sparse: true,
        },
        signature: {
            type: String,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: 'INR',
        },
        status: {
            type: String,
            enum: ['created', 'authorized', 'captured', 'failed', 'refunded'],
            default: 'created',
        },
        refundId: {
            type: String,
        },
        refundAmount: {
            type: Number,
        },
        method: {
            type: String,
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model<IPayment>('Payment', paymentSchema);

export default Payment;
