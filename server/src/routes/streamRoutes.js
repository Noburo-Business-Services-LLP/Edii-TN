import { Router } from 'express';
import { streamLesson } from '../controllers/streamController.js';
import { streamAuth } from '../middleware/streamAuth.js';

const router = Router();

router.get('/:lessonId', streamAuth, streamLesson);

export default router;
