import { Response, Request } from 'express';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import ApiResponse from '../utils/ApiResponse';
import User from '../models/User';
import Booking from '../models/Booking';
import { AuthRequest } from '../middleware/auth';

// @desc    Get all customers (users with role 'user')
// @route   GET /api/customers
// @access  Private/Admin
export const getAllCustomers = asyncHandler(async (req: Request, res: Response) => {
    const { status, city } = req.query;

    let query: any = { role: 'user' };
    if (status) query.status = status;
    if (city) query.city = city;

    const customers = await User.find(query).select('-password').sort({ createdAt: -1 });

    res.status(200).json(
        new ApiResponse(200, 'Customers retrieved successfully', { customers, total: customers.length })
    );
});

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
export const getCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customer = await User.findById(req.params.id).select('-password');

    if (!customer) {
        throw ApiError.notFound('Customer not found');
    }

    res.status(200).json(
        new ApiResponse(200, 'Customer retrieved successfully', { customer })
    );
});

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
export const updateCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Remove sensitive fields
    delete req.body.password;
    delete req.body.role;
    delete req.body.totalBookings;
    delete req.body.totalSpent;

    const customer = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true,
        }
    ).select('-password');

    if (!customer) {
        throw ApiError.notFound('Customer not found');
    }

    res.status(200).json(
        new ApiResponse(200, 'Customer updated successfully', { customer })
    );
});

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private/Admin
export const deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
    const customer = await User.findById(req.params.id);

    if (!customer) {
        throw ApiError.notFound('Customer not found');
    }

    await customer.deleteOne();

    res.status(200).json(
        new ApiResponse(200, 'Customer deleted successfully', null)
    );
});

// @desc    Get customer statistics
// @route   GET /api/customers/:id/stats
// @access  Private
export const getCustomerStats = asyncHandler(async (req: Request, res: Response) => {
    const customer = await User.findById(req.params.id).select('-password');

    if (!customer) {
        throw ApiError.notFound('Customer not found');
    }

    // Get booking history
    const bookings = await Booking.find({ customerId: req.params.id })
        .populate('carId', 'name image')
        .sort({ createdAt: -1 })
        .limit(10);

    const stats = {
        customer,
        totalBookings: customer.totalBookings,
        totalSpent: customer.totalSpent,
        memberSince: customer.memberSince,
        status: customer.status,
        recentBookings: bookings,
    };

    res.status(200).json(
        new ApiResponse(200, 'Customer statistics retrieved successfully', { stats })
    );
});
