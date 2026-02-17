import { Router } from 'express';
import {
    getAllReviews,
    getCarReviews,
    createReview,
    updateReview,
    deleteReview,
} from '../controllers/reviewController';
import { protect } from '../middleware/auth';
import { validate, schemas } from '../middleware/validate';

const router = Router();

router.get('/', getAllReviews);
router.get('/car/:carId', getCarReviews);
router.post('/', protect, validate(schemas.createReview), createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

export default router;
