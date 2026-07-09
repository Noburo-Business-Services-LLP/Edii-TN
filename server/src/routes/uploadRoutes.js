import { Router } from 'express';
import { uploadVideo } from '../middleware/upload.js';
import { handleVideoUpload } from '../controllers/uploadController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/role.js';

const router = Router();

router.post(
  '/video',
  requireAuth,
  requireRole('admin'),
  (req, res, next) =>
    uploadVideo(req, res, (err) => (err ? res.status(400).json({ error: err.message }) : next())),
  handleVideoUpload
);

export default router;
