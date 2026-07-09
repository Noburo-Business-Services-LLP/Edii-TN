import { Router } from 'express';
import {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../controllers/courseController.js';
import { createSection } from '../controllers/sectionController.js';
import { enroll } from '../controllers/enrollmentController.js';
import { requireAuth } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import { requireRole } from '../middleware/role.js';

const router = Router();

router.get('/', optionalAuth, listCourses);
router.get('/:id', optionalAuth, getCourse);

router.post('/', requireAuth, requireRole('admin'), createCourse);
router.patch('/:id', requireAuth, requireRole('admin'), updateCourse);
router.delete('/:id', requireAuth, requireRole('admin'), deleteCourse);

router.post('/:id/sections', requireAuth, requireRole('admin'), createSection);
router.post('/:id/enroll', requireAuth, enroll);

export default router;
