import mongoose, { Document, Schema } from 'mongoose';
import { BookingStatus } from '../services/bookingStateMachine';

export interface IBooking extends Document {
    bookingId: string;
    customerId: mongoose.Types.ObjectId;
    customerName: string;
    customerPhone: string;
    carId: mongoose.Types.ObjectId;
    carName: string;
    pickupDate: Date;
    pickupTime: string;
    dropoffDate: Date;
    dropoffTime: string;
    pickupLocation: string;
    dropoffLocation: string;
    duration: string;
    totalAmount: number;
    paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Refunded';
    status: BookingStatus;
    services: string[];
    assignedDriverId?: mongoose.Types.ObjectId;
    actualStartTime?: Date;
    actualEndTime?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
    {
        bookingId: {
            type: String,
            unique: true,
        },
        customerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Customer ID is required'],
        },
        customerName: {
            type: String,
            required: true,
        },
        customerPhone: {
            type: String,
            required: true,
        },
        carId: {
            type: Schema.Types.ObjectId,
            ref: 'Car',
            required: [true, 'Car ID is required'],
        },
        carName: {
            type: String,
            required: true,
        },
        pickupDate: {
            type: Date,
            required: [true, 'Pickup date is required'],
        },
        pickupTime: {
            type: String,
            required: [true, 'Pickup time is required'],
        },
        dropoffDate: {
            type: Date,
            required: [true, 'Dropoff date is required'],
        },
        dropoffTime: {
            type: String,
            required: [true, 'Dropoff time is required'],
        },
        pickupLocation: {
            type: String,
            required: [true, 'Pickup location is required'],
            trim: true,
        },
        dropoffLocation: {
            type: String,
            required: [true, 'Dropoff location is required'],
            trim: true,
        },
        duration: {
            type: String,
            required: true,
        },
        totalAmount: {
            type: Number,
            required: [true, 'Total amount is required'],
            min: [0, 'Amount cannot be negative'],
        },
        paymentStatus: {
            type: String,
            enum: ['Paid', 'Partially Paid', 'Unpaid', 'Refunded'],
            default: 'Unpaid',
        },
        status: {
            type: String,
            enum: ['draft', 'pending_payment', 'confirmed', 'assigned', 'ongoing', 'completed', 'cancelled', 'refunded'],
            default: 'draft',
        },
        services: {
            type: [String],
            default: [],
        },
        assignedDriverId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        actualStartTime: {
            type: Date,
        },
        actualEndTime: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Auto-generate booking ID before saving
bookingSchema.pre('save', async function (next) {
    if (!this.bookingId) {
        const year = new Date().getFullYear();
        const count = await mongoose.model('Booking').countDocuments();
        this.bookingId = `MTB-${year}-${String(count + 1).padStart(5, '0')}`;
    }
    next();
});

// Calculate duration before saving
bookingSchema.pre('save', function (next) {
    if (this.pickupDate && this.dropoffDate) {
        const diff = this.dropoffDate.getTime() - this.pickupDate.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        this.duration = days === 1 ? '1 day' : `${days} days`;
    }
    next();
});

// Indexes for efficient queries
bookingSchema.index({ customerId: 1 });
bookingSchema.index({ carId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ pickupDate: 1 });
bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ assignedDriverId: 1 });

const Booking = mongoose.model<IBooking>('Booking', bookingSchema);

export default Booking;
