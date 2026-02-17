import { Router } from 'express';
import {
    getAllBookings,
    getBooking,
    createBooking,
    updateBookingStatus,
    cancelBooking,
    assignDriver,
    startTrip,
    completeTrip,
} from '../controllers/bookingController';
import { protect, optionalAuth } from '../middleware/auth';
import { allowRoles } from '../middleware/rbac.middleware';
import { validate, schemas } from '../middleware/validate';

const router = Router();

router.get('/', protect, getAllBookings);
router.get('/:id', protect, getBooking);

// Create booking - supports guest and authenticated
router.post('/', optionalAuth, validate(schemas.createBooking), createBooking);

// Status management (admin/vendor)
router.patch('/:id/status', protect, allowRoles('admin', 'vendor'), updateBookingStatus);
router.post('/:id/assign', protect, allowRoles('admin', 'vendor'), assignDriver);
router.post('/:id/start', protect, allowRoles('admin', 'vendor'), startTrip);
router.post('/:id/complete', protect, allowRoles('admin', 'vendor'), completeTrip);

// Cancel booking (user can cancel their own)
router.post('/:id/cancel', protect, cancelBooking);

export default router;
