import { Router } from 'express';
import {
    getDashboardStats,
    getRevenueData,
    getBookingStatusData,
    getCategoryRevenue,
} from '../controllers/dashboardController';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

// All dashboard routes are admin only
router.use(protect, restrictTo('admin'));

router.get('/stats', getDashboardStats);
router.get('/revenue', getRevenueData);
router.get('/bookings-status', getBookingStatusData);
router.get('/category-revenue', getCategoryRevenue);

export default router;
