import { Response, Request } from 'express';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';
import Booking from '../models/Booking';
import Car from '../models/Car';
import User from '../models/User';

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
    // Total revenue
    const bookings = await Booking.find({ status: { $nin: ['cancelled', 'draft'] } });
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

    // Total revenue this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyBookings = await Booking.find({
        status: { $nin: ['cancelled', 'draft'] },
        createdAt: { $gte: startOfMonth },
    });
    const monthlyRevenue = monthlyBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

    // Active bookings (ongoing)
    const activeBookings = await Booking.countDocuments({ status: 'ongoing' });

    // Pending approvals (pending_payment and confirmed)
    const pendingApprovals = await Booking.countDocuments({ status: { $in: ['pending_payment', 'confirmed'] } });

    // Fleet stats
    const totalFleet = await Car.countDocuments();
    const availableFleet = await Car.countDocuments({ status: 'Available' });
    const rentedFleet = await Car.countDocuments({ status: 'Rented' });
    const maintenanceFleet = await Car.countDocuments({ status: 'Maintenance' });

    // Total users
    const totalCustomers = await User.countDocuments({ role: 'user' });
    const vipCustomers = await User.countDocuments({ status: 'VIP', role: 'user' });
    const totalVendors = await User.countDocuments({ role: 'vendor' });

    res.status(200).json(
        new ApiResponse(200, 'Dashboard statistics retrieved successfully', {
            totalRevenue: {
                value: totalRevenue,
                monthly: monthlyRevenue,
            },
            activeBookings: {
                value: activeBookings,
            },
            pendingApprovals: {
                value: pendingApprovals,
            },
            fleet: {
                total: totalFleet,
                available: availableFleet,
                rented: rentedFleet,
                maintenance: maintenanceFleet,
                availability: totalFleet > 0 ? Math.round((availableFleet / totalFleet) * 100) : 0,
            },
            customers: {
                total: totalCustomers,
                vip: vipCustomers,
            },
            vendors: {
                total: totalVendors,
            },
        })
    );
});

// @desc    Get revenue data
// @route   GET /api/dashboard/revenue
// @access  Private/Admin
export const getRevenueData = asyncHandler(async (_req: Request, res: Response) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const bookings = await Booking.find({
        status: { $nin: ['cancelled', 'draft'] },
        createdAt: { $gte: thirtyDaysAgo },
    }).sort({ createdAt: 1 });

    // Group by date
    const revenueByDate: { [key: string]: number } = {};
    bookings.forEach((booking) => {
        const date = booking.createdAt.toISOString().split('T')[0];
        revenueByDate[date] = (revenueByDate[date] || 0) + booking.totalAmount;
    });

    const revenueData = Object.entries(revenueByDate).map(([date, revenue]) => ({
        date,
        revenue,
    }));

    res.status(200).json(
        new ApiResponse(200, 'Revenue data retrieved successfully', { revenueData })
    );
});

// @desc    Get booking status distribution
// @route   GET /api/dashboard/bookings-status
// @access  Private/Admin
export const getBookingStatusData = asyncHandler(async (_req: Request, res: Response) => {
    const statuses = ['draft', 'pending_payment', 'confirmed', 'assigned', 'ongoing', 'completed', 'cancelled', 'refunded'];

    const statusData = await Promise.all(
        statuses.map(async (status) => {
            const count = await Booking.countDocuments({ status });
            return { name: status, value: count };
        })
    );

    res.status(200).json(
        new ApiResponse(200, 'Booking status data retrieved successfully', { statusData })
    );
});

// @desc    Get category revenue
// @route   GET /api/dashboard/category-revenue
// @access  Private/Admin
export const getCategoryRevenue = asyncHandler(async (_req: Request, res: Response) => {
    const categories = ['Sedan', 'SUV', 'MUV', 'Luxury', 'Economy'];

    const categoryData = await Promise.all(
        categories.map(async (category) => {
            const cars = await Car.find({ category });
            const carIds = cars.map((car) => car._id);

            const bookings = await Booking.find({
                carId: { $in: carIds },
                status: { $nin: ['cancelled', 'draft'] },
            });

            const revenue = bookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

            return {
                category,
                revenue,
                bookings: bookings.length,
            };
        })
    );

    res.status(200).json(
        new ApiResponse(200, 'Category revenue data retrieved successfully', { categoryData })
    );
});
