import Course from '../models/Course.js';
import Section from '../models/Section.js';
import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import ApiError, { asyncHandler } from '../utils/ApiError.js';
import { sanitizeLessonForStudent } from '../utils/sanitize.js';
import { computeUnlocked, orderedLessonIdsFromCourse } from '../utils/unlock.js';

// Populate a course with ordered sections -> lessons.
async function loadFullCourse(courseId) {
  return Course.findById(courseId).populate({
    path: 'sections',
    options: { sort: { order: 1 } },
    populate: { path: 'lessons', options: { sort: { order: 1 } } },
  });
}

// GET /api/courses  (published catalog, or all for admin via ?all=1)
export const listCourses = asyncHandler(async (req, res) => {
  const { search, category, level, all } = req.query;
  const filter = {};
  if (!(all && req.user?.role === 'admin')) filter.isPublished = true;
  if (search) filter.title = { $regex: search, $options: 'i' };
  if (category) filter.category = category;
  if (level) filter.level = level;

  const courses = await Course.find(filter)
    .populate('sections', 'lessons')
    .sort({ createdAt: -1 })
    .lean();

  const withCounts = courses.map((c) => ({
    ...c,
    lessonCount: (c.sections || []).reduce(
      (n, s) => n + (s.lessons?.length || 0),
      0
    ),
  }));
  res.json({ courses: withCounts });
});

// GET /api/courses/:id  (full course + TOC; students get sanitized + unlock state)
export const getCourse = asyncHandler(async (req, res) => {
  const course = await loadFullCourse(req.params.id);
  if (!course) throw new ApiError(404, 'Course not found');

  const isAdmin = req.user?.role === 'admin';
  if (!course.isPublished && !isAdmin) throw new ApiError(404, 'Course not found');

  const courseObj = course.toObject();

  if (isAdmin) {
    return res.json({ course: courseObj, enrollment: null, unlocked: null });
  }

  // student view
  const enrollment = req.user
    ? await Enrollment.findOne({ student: req.user._id, course: course._id })
    : null;

  const orderedIds = orderedLessonIdsFromCourse(course);
  const unlockedSet = computeUnlocked(orderedIds, enrollment, course.sequentialUnlock);

  courseObj.sections = courseObj.sections.map((s) => ({
    ...s,
    lessons: s.lessons.map((l) => {
      const sanitized = sanitizeLessonForStudent(l);
      const unlocked = unlockedSet.has(String(l._id));
      const prog = enrollment?.progress.find((p) => String(p.lesson) === String(l._id));
      return {
        ...sanitized,
        unlocked,
        completed: !!prog?.completed,
        // Do not leak video path or marker bodies for locked lessons.
        ...(unlocked ? {} : { videoPath: undefined, markers: [], chapters: [], content: '' }),
      };
    }),
  }));

  res.json({
    course: courseObj,
    enrolled: !!enrollment,
    enrollmentId: enrollment?._id || null,
    percentComplete: enrollment?.percentComplete || 0,
  });
});

// POST /api/courses  (admin)
export const createCourse = asyncHandler(async (req, res) => {
  const { title, description, category, level, thumbnail, sequentialUnlock } = req.body;
  if (!title) throw new ApiError(400, 'title is required');
  const course = await Course.create({
    title,
    description,
    category,
    level,
    thumbnail,
    sequentialUnlock: sequentialUnlock !== false,
    createdBy: req.user._id,
  });
  res.status(201).json({ course });
});

// PATCH /api/courses/:id  (admin) — metadata + publish toggle + reorder sections
export const updateCourse = asyncHandler(async (req, res) => {
  const allowed = [
    'title',
    'description',
    'category',
    'level',
    'thumbnail',
    'isPublished',
    'sequentialUnlock',
    'sections', // reordered array of section ids
  ];
  const update = {};
  for (const key of allowed) if (key in req.body) update[key] = req.body[key];

  const course = await Course.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!course) throw new ApiError(404, 'Course not found');
  res.json({ course });
});

// DELETE /api/courses/:id  (admin) — cascade sections, lessons, enrollments
export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new ApiError(404, 'Course not found');
  await Lesson.deleteMany({ course: course._id });
  await Section.deleteMany({ course: course._id });
  await Enrollment.deleteMany({ course: course._id });
  await course.deleteOne();
  res.json({ ok: true });
});
