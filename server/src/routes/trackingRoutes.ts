import { Router } from 'express';
import {
    updateLocation,
    getVehicleLocation,
    getLocationHistory,
    getActiveVehicles,
} from '../controllers/trackingController';
import { protect } from '../middleware/auth';
import { allowRoles } from '../middleware/rbac.middleware';

const router = Router();

// Update location (drivers/vendors)
router.post('/update', protect, allowRoles('admin', 'vendor'), updateLocation);

// Get active vehicles (admin/vendor)
router.get('/active', protect, allowRoles('admin', 'vendor'), getActiveVehicles);

// Get specific vehicle location (authenticated users)
router.get('/:vehicleId', protect, getVehicleLocation);

// Get vehicle location history (admin/vendor)
router.get('/:vehicleId/history', protect, allowRoles('admin', 'vendor'), getLocationHistory);

export default router;
