import { Router } from 'express';
import authRoutes from './authRoutes';
import carRoutes from './carRoutes';
import bookingRoutes from './bookingRoutes';
import customerRoutes from './customerRoutes';
import reviewRoutes from './reviewRoutes';
import dashboardRoutes from './dashboardRoutes';
import paymentRoutes from './paymentRoutes';
import trackingRoutes from './trackingRoutes';
import uberRoutes from './uber.routes';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/cars', carRoutes);
router.use('/bookings', bookingRoutes);
router.use('/customers', customerRoutes);
router.use('/reviews', reviewRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/payments', paymentRoutes);
router.use('/tracking', trackingRoutes);
router.use('/', uberRoutes);

// Health check route
router.get('/health', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

export default router;
