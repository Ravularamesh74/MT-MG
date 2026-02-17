import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import ApiError from '../utils/ApiError';

export const validate = (schema: Joi.ObjectSchema) => {
    return (req: Request, _res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errorMessage = error.details.map((detail) => detail.message).join(', ');
            throw ApiError.badRequest(errorMessage);
        }

        next();
    };
};

// Common validation schemas
export const schemas = {
    // Auth schemas
    register: Joi.object({
        name: Joi.string().required().min(2).max(100),
        email: Joi.string().email().required(),
        password: Joi.string().required().min(6),
        phone: Joi.string().required().pattern(/^\+?[1-9]\d{1,14}$/),
        city: Joi.string().optional(),
    }),

    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    }),

    // Car schemas
    createCar: Joi.object({
        name: Joi.string().required(),
        manufacturer: Joi.string().required(),
        year: Joi.number().required().min(2000).max(new Date().getFullYear() + 1),
        category: Joi.string().valid('Sedan', 'SUV', 'MUV', 'Luxury', 'Economy').required(),
        registrationNo: Joi.string().required(),
        seats: Joi.number().required().min(2).max(12),
        transmission: Joi.string().valid('Manual', 'Automatic').required(),
        fuelType: Joi.string().valid('Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG').required(),
        pricePerDay: Joi.number().required().min(0),
        pricePerHour: Joi.number().required().min(0),
        location: Joi.string().required(),
        mileage: Joi.string().required(),
        features: Joi.array().items(Joi.string()).optional(),
    }),

    // Booking schemas
    createBooking: Joi.object({
        carId: Joi.string().required(),
        pickupDate: Joi.date().required(),
        pickupTime: Joi.string().required(),
        dropoffDate: Joi.date().required().greater(Joi.ref('pickupDate')),
        dropoffTime: Joi.string().required(),
        pickupLocation: Joi.string().required(),
        dropoffLocation: Joi.string().required(),
        services: Joi.array().items(Joi.string()).optional(),
        // Customer info for guest bookings
        customerName: Joi.string().optional(),
        customerEmail: Joi.string().email().optional(),
        customerPhone: Joi.string().optional(),
    }),

    // Review schemas
    createReview: Joi.object({
        bookingId: Joi.string().required(),
        rating: Joi.number().required().min(1).max(5),
        review: Joi.string().required().min(10).max(1000),
    }),
};
