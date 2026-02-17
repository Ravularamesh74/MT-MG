import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    phone: string;
    role: 'admin' | 'vendor' | 'user';
    googleId?: string;
    isVerified: boolean;
    city?: string;
    totalBookings: number;
    totalSpent: number;
    walletBalance: number;
    memberSince: Date;
    status: 'Active' | 'Inactive' | 'VIP';
    lastBookingDate?: Date;
    avatar?: string;
    comparePassword(candidatePassword: string): Promise<boolean>;
    generateAccessToken(): string;
}

const userSchema = new Schema<IUser>(
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
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        phone: {
            type: String,
            match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number'],
            default: '',
        },
        role: {
            type: String,
            enum: ['admin', 'vendor', 'user'],
            default: 'user',
        },
        googleId: {
            type: String,
            sparse: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
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
        walletBalance: {
            type: Number,
            default: 0,
        },
        memberSince: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ['Active', 'Inactive', 'VIP'],
            default: 'Active',
        },
        lastBookingDate: {
            type: Date,
        },
        avatar: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate short-lived access token (15 min)
userSchema.methods.generateAccessToken = function (): string {
    return jwt.sign(
        { id: this._id, email: this.email, role: this.role },
        config.jwtSecret,
        { expiresIn: '15m' }
    );
};

// Update VIP status based on spending
userSchema.pre('save', function (next) {
    if (this.totalSpent >= 100000) {
        this.status = 'VIP';
    }
    next();
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model<IUser>('User', userSchema);

export default User;
