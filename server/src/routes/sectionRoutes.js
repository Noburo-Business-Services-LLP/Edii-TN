import { Router } from 'express';
import { updateSection, deleteSection } from '../controllers/sectionController.js';
import { createLesson } from '../controllers/lessonController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = Router();

router.post('/:id/lessons', requireAuth, requireRole('admin'), createLesson);
router.patch('/:id', requireAuth, requireRole('admin'), updateSection);
router.delete('/:id', requireAuth, requireRole('admin'), deleteSection);

export default router;
