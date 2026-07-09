import path from 'path';
import fs from 'fs';
import Lesson from '../models/Lesson.js';
import Course from '../models/Course.js';
import Enrollment from '../models/Enrollment.js';
import ApiError, { asyncHandler } from '../utils/ApiError.js';
import { UPLOAD_DIR } from '../middleware/upload.js';
import { isLessonUnlocked, orderedLessonIdsFromCourse } from '../utils/unlock.js';

async function loadFullCourse(courseId) {
  return Course.findById(courseId).populate({
    path: 'sections',
    options: { sort: { order: 1 } },
    populate: { path: 'lessons', options: { sort: { order: 1 } } },
  });
}

// GET /api/stream/:lessonId  (auth required; enrolled + unlocked, or admin)
// Serves the video with HTTP Range support so the player can seek.
export const streamLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.lessonId);
  if (!lesson || !lesson.videoPath) throw new ApiError(404, 'Video not found');

  // Access control (admins bypass enrollment/unlock checks).
  if (req.user.role !== 'admin') {
    const course = await loadFullCourse(lesson.course);
    if (!course?.isPublished) throw new ApiError(404, 'Video not found');

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: lesson.course,
    });
    if (!enrollment) throw new ApiError(403, 'Enroll to watch this lesson');

    const orderedIds = orderedLessonIdsFromCourse(course);
    if (!isLessonUnlocked(lesson._id, orderedIds, enrollment, course.sequentialUnlock)) {
      throw new ApiError(403, 'Lesson is locked');
    }
  }

  const filePath = path.join(UPLOAD_DIR, path.basename(lesson.videoPath));
  if (!fs.existsSync(filePath)) throw new ApiError(404, 'Video file missing');

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;
  const contentType = 'video/mp4';

  if (!range) {
    res.writeHead(200, { 'Content-Length': fileSize, 'Content-Type': contentType });
    return fs.createReadStream(filePath).pipe(res);
  }

  // Parse "bytes=start-end"
  const match = /bytes=(\d*)-(\d*)/.exec(range);
  const start = match && match[1] ? parseInt(match[1], 10) : 0;
  const end = match && match[2] ? parseInt(match[2], 10) : fileSize - 1;

  if (start >= fileSize || end >= fileSize || start > end) {
    res.writeHead(416, { 'Content-Range': `bytes */${fileSize}` });
    return res.end();
  }

  const chunkSize = end - start + 1;
  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunkSize,
    'Content-Type': contentType,
  });
  fs.createReadStream(filePath, { start, end }).pipe(res);
});
