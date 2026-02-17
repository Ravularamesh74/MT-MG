import mongoose, { Document, Schema } from 'mongoose';

export interface ICar extends Document {
    name: string;
    manufacturer: string;
    year: number;
    category: 'Sedan' | 'SUV' | 'MUV' | 'Luxury' | 'Economy';
    registrationNo: string;
    seats: number;
    transmission: 'Manual' | 'Automatic';
    fuelType: 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid' | 'CNG';
    pricePerDay: number;
    pricePerHour: number;
    status: 'Available' | 'Rented' | 'Maintenance' | 'Inactive';
    location: string;
    image: string;
    images?: string[];
    lastServiceDate?: Date;
    mileage: string;
    features: string[];
}

const carSchema = new Schema<ICar>(
    {
        name: {
            type: String,
            required: [true, 'Please provide a car name'],
            trim: true,
        },
        manufacturer: {
            type: String,
            required: [true, 'Please provide a manufacturer'],
            trim: true,
        },
        year: {
            type: Number,
            required: [true, 'Please provide a manufacturing year'],
            min: [2000, 'Year must be 2000 or later'],
            max: [new Date().getFullYear() + 1, 'Year cannot be in the future'],
        },
        category: {
            type: String,
            required: [true, 'Please provide a category'],
            enum: ['Sedan', 'SUV', 'MUV', 'Luxury', 'Economy'],
        },
        registrationNo: {
            type: String,
            required: [true, 'Please provide a registration number'],
            unique: true,
            uppercase: true,
            trim: true,
        },
        seats: {
            type: Number,
            required: [true, 'Please provide number of seats'],
            min: [2, 'Seats must be at least 2'],
            max: [12, 'Seats cannot exceed 12'],
        },
        transmission: {
            type: String,
            required: [true, 'Please provide transmission type'],
            enum: ['Manual', 'Automatic'],
        },
        fuelType: {
            type: String,
            required: [true, 'Please provide fuel type'],
            enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'],
        },
        pricePerDay: {
            type: Number,
            required: [true, 'Please provide price per day'],
            min: [0, 'Price cannot be negative'],
        },
        pricePerHour: {
            type: Number,
            required: [true, 'Please provide price per hour'],
            min: [0, 'Price cannot be negative'],
        },
        status: {
            type: String,
            enum: ['Available', 'Rented', 'Maintenance', 'Inactive'],
            default: 'Available',
        },
        location: {
            type: String,
            required: [true, 'Please provide a location'],
            trim: true,
        },
        image: {
            type: String,
            default: '',
        },
        images: {
            type: [String],
            default: [],
        },
        lastServiceDate: {
            type: Date,
        },
        mileage: {
            type: String,
            required: [true, 'Please provide mileage information'],
        },
        features: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
carSchema.index({ status: 1 });
carSchema.index({ category: 1 });
carSchema.index({ location: 1 });
carSchema.index({ pricePerDay: 1 });

const Car = mongoose.model<ICar>('Car', carSchema);

export default Car;
