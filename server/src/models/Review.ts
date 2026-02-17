import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
    customerId: mongoose.Types.ObjectId;
    customerName: string;
    bookingId: mongoose.Types.ObjectId;
    carId?: mongoose.Types.ObjectId;
    rating: number;
    review: string;
    location?: string;
    date: Date;
    verified: boolean;
}

const reviewSchema = new Schema<IReview>(
    {
        customerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Customer ID is required'],
        },
        customerName: {
            type: String,
            required: true,
        },
        bookingId: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
            required: [true, 'Booking ID is required'],
        },
        carId: {
            type: Schema.Types.ObjectId,
            ref: 'Car',
        },
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot exceed 5'],
        },
        review: {
            type: String,
            required: [true, 'Review text is required'],
            minlength: [10, 'Review must be at least 10 characters'],
            maxlength: [1000, 'Review cannot exceed 1000 characters'],
            trim: true,
        },
        location: {
            type: String,
            trim: true,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        verified: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Only customers with completed bookings can review
reviewSchema.pre('save', async function (next) {
    const booking = await mongoose.model('Booking').findById(this.bookingId);

    if (!booking || booking.status !== 'completed') {
        throw new Error('Can only review completed bookings');
    }

    this.verified = true;
    next();
});

// Indexes
reviewSchema.index({ customerId: 1 });
reviewSchema.index({ carId: 1 });
reviewSchema.index({ rating: -1 });

const Review = mongoose.model<IReview>('Review', reviewSchema);

export default Review;
