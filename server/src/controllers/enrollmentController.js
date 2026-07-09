import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import ApiError, { asyncHandler } from '../utils/ApiError.js';
import {
  computeUnlocked,
  orderedLessonIdsFromCourse,
  isLessonUnlocked,
} from '../utils/unlock.js';

async function loadFullCourse(courseId) {
  return Course.findById(courseId).populate({
    path: 'sections',
    options: { sort: { order: 1 } },
    populate: { path: 'lessons', options: { sort: { order: 1 } } },
  });
}

function recalcPercent(enrollment, totalLessons) {
  const done = enrollment.progress.filter((p) => p.completed).length;
  enrollment.percentComplete = totalLessons === 0 ? 0 : Math.round((done / totalLessons) * 100);
  if (enrollment.percentComplete === 100 && !enrollment.completedAt) {
    enrollment.completedAt = new Date();
  }
}

// POST /api/courses/:id/enroll
export const enroll = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course || !course.isPublished) throw new ApiError(404, 'Course not found');

  let enrollment = await Enrollment.findOne({ student: req.user._id, course: course._id });
  if (enrollment) return res.json({ enrollment });

  enrollment = await Enrollment.create({
    student: req.user._id,
    course: course._id,
    progress: [],
  });
  res.status(201).json({ enrollment });
});

// GET /api/me/enrollments
export const myEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ student: req.user._id })
    .populate('course', 'title thumbnail category level')
    .sort({ updatedAt: -1 })
    .lean();
  res.json({ enrollments });
});

// PATCH /api/enrollments/:id/progress
// body: { lessonId, watchedSeconds?, completed? }
export const updateProgress = asyncHandler(async (req, res) => {
  const { lessonId, watchedSeconds, completed } = req.body;
  const enrollment = await Enrollment.findById(req.params.id);
  if (!enrollment) throw new ApiError(404, 'Enrollment not found');
  if (String(enrollment.student) !== String(req.user._id)) {
    throw new ApiError(403, 'Not your enrollment');
  }

  const lesson = await Lesson.findById(lessonId);
  if (!lesson) throw new ApiError(404, 'Lesson not found');

  const course = await loadFullCourse(enrollment.course);
  const orderedIds = orderedLessonIdsFromCourse(course);

  // Enforce sequential unlock on the server: cannot progress a locked lesson.
  if (!isLessonUnlocked(lessonId, orderedIds, enrollment, course.sequentialUnlock)) {
    throw new ApiError(403, 'Lesson is locked');
  }

  let entry = enrollment.progress.find((p) => String(p.lesson) === String(lessonId));
  if (!entry) {
    entry = { lesson: lessonId, completed: false, watchedSeconds: 0 };
    enrollment.progress.push(entry);
    entry = enrollment.progress[enrollment.progress.length - 1];
  }

  if (typeof watchedSeconds === 'number') {
    entry.watchedSeconds = Math.max(entry.watchedSeconds, watchedSeconds);
  }

  // Auto-complete video lessons at >=95% watched, or accept explicit completed flag.
  const threshold = lesson.duration ? lesson.duration * 0.95 : Infinity;
  if (completed === true || (lesson.type === 'video' && entry.watchedSeconds >= threshold)) {
    if (!entry.completed) {
      entry.completed = true;
      entry.completedAt = new Date();
    }
  }

  recalcPercent(enrollment, orderedIds.length);
  await enrollment.save();

  const unlocked = [...computeUnlocked(orderedIds, enrollment, course.sequentialUnlock)];
  res.json({
    enrollment,
    percentComplete: enrollment.percentComplete,
    unlocked,
  });
});
