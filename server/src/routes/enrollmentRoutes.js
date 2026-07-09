import { Router } from 'express';
import { myEnrollments, updateProgress } from '../controllers/enrollmentController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/me/enrollments', requireAuth, myEnrollments);
router.patch('/enrollments/:id/progress', requireAuth, updateProgress);

export default router;
