import { asyncHandler } from '../utils/ApiError.js';

// POST /api/upload/video  (admin, multipart field "video")
// Returns the stored relative path; the admin then saves it onto a lesson.
export const handleVideoUpload = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No video uploaded' });
  res.status(201).json({
    videoPath: req.file.filename,
    size: req.file.size,
    originalName: req.file.originalname,
  });
});
