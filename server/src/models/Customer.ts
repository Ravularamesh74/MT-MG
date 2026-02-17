import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface ICustomer extends Document {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: 'customer' | 'admin';
    city?: string;
    totalBookings: number;
    totalSpent: number;
    customerSince: Date;
    status: 'Active' | 'Inactive' | 'VIP';
    verified: boolean;
    lastBookingDate?: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    generateAuthToken(): string;
}

const customerSchema = new Schema<ICustomer>(
    {
        name: {
            type: String,
            required: [true, 'Please provide a name'],
            trim: true,
            maxlength: [100, 'Name cannot be more than 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Please provide an email'],
            unique: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Please provide a password'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // Don't include password in queries by default
        },
        phone: {
            type: String,
            required: [true, 'Please provide a phone number'],
            match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number'],
        },
        role: {
            type: String,
            enum: ['customer', 'admin'],
            default: 'customer',
        },
        city: {
            type: String,
            trim: true,
        },
        totalBookings: {
            type: Number,
            default: 0,
        },
        totalSpent: {
            type: Number,
            default: 0,
        },
        customerSince: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ['Active', 'Inactive', 'VIP'],
            default: 'Active',
        },
        verified: {
            type: Boolean,
            default: false,
        },
        lastBookingDate: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
customerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
customerSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
customerSchema.methods.generateAuthToken = function (): string {
    return jwt.sign(
        { id: this._id, email: this.email, role: this.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpire as any }
    );
};

// Update VIP status based on spending
customerSchema.pre('save', function (next) {
    if (this.totalSpent >= 100000) {
        this.status = 'VIP';
    }
    next();
});

const Customer = mongoose.model<ICustomer>('Customer', customerSchema);

export default Customer;
