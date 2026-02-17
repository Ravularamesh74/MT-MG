import { Router } from 'express';
import {
    getAllCustomers,
    getCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerStats,
} from '../controllers/customerController';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

router.get('/', protect, restrictTo('admin'), getAllCustomers);
router.get('/:id', protect, getCustomer);
router.get('/:id/stats', protect, getCustomerStats);
router.put('/:id', protect, updateCustomer);
router.delete('/:id', protect, restrictTo('admin'), deleteCustomer);

export default router;
