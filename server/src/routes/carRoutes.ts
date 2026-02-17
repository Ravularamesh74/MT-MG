import { Router } from 'express';
import {
    getAllCars,
    getCar,
    createCar,
    updateCar,
    deleteCar,
    updateCarStatus,
    getAvailableCars,
} from '../controllers/carController';
import { protect, restrictTo } from '../middleware/auth';
import { validate, schemas } from '../middleware/validate';

const router = Router();

router.get('/', getAllCars);
router.get('/available', getAvailableCars);
router.get('/:id', getCar);

router.post('/', protect, restrictTo('admin'), validate(schemas.createCar), createCar);
router.put('/:id', protect, restrictTo('admin'), updateCar);
router.delete('/:id', protect, restrictTo('admin'), deleteCar);
router.patch('/:id/status', protect, restrictTo('admin'), updateCarStatus);

export default router;
