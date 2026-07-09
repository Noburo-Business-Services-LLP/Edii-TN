import { Router } from 'express';
import { updateLesson, deleteLesson } from '../controllers/lessonController.js';
import { submitAttempt, myAttempts } from '../controllers/quizController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = Router();

router.patch('/:id', requireAuth, requireRole('admin'), updateLesson);
router.delete('/:id', requireAuth, requireRole('admin'), deleteLesson);

router.post('/:id/attempt', requireAuth, submitAttempt);
router.get('/:id/attempts', requireAuth, myAttempts);

export default router;
