import express from 'express';
import { protect } from '../middleware/auth';
import {
    getLiveFleet,
    getRoute,
    getSurge,
    calculateAiPrice,
    getWallet,
    getDriverEta,
    createInstantBooking
} from '../controllers/uberController';

const router = express.Router();

// Public endpoints (no auth needed for viewing map/prices)
router.get('/fleet/live', getLiveFleet);
router.get('/maps/route', getRoute);
router.get('/pricing/surge/live', getSurge);
router.post('/pricing/ai', calculateAiPrice);
router.get('/drivers/eta', getDriverEta);

// Protected endpoints
router.get('/wallet', protect, getWallet);
router.post('/bookings/instant', protect, createInstantBooking);

export default router;
