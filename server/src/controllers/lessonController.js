import Section from '../models/Section.js';
import Lesson from '../models/Lesson.js';
import ApiError, { asyncHandler } from '../utils/ApiError.js';

// POST /api/sections/:id/lessons  (admin)
export const createLesson = asyncHandler(async (req, res) => {
  const section = await Section.findById(req.params.id);
  if (!section) throw new ApiError(404, 'Section not found');

  const lesson = await Lesson.create({
    section: section._id,
    course: section.course,
    title: req.body.title || 'New lesson',
    type: req.body.type || 'video',
    order: section.lessons.length,
  });
  section.lessons.push(lesson._id);
  await section.save();
  res.status(201).json({ lesson });
});

// PATCH /api/lessons/:id  (admin) — content, markers, quiz, reorder, etc.
export const updateLesson = asyncHandler(async (req, res) => {
  const allowed = [
    'title',
    'order',
    'type',
    'videoPath',
    'duration',
    'markers',
    'chapters',
    'quiz',
    'content',
  ];
  const update = {};
  for (const key of allowed) if (key in req.body) update[key] = req.body[key];

  const lesson = await Lesson.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!lesson) throw new ApiError(404, 'Lesson not found');
  res.json({ lesson });
});

// DELETE /api/lessons/:id  (admin)
export const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new ApiError(404, 'Lesson not found');
  await Section.updateOne({ _id: lesson.section }, { $pull: { lessons: lesson._id } });
  await lesson.deleteOne();
  res.json({ ok: true });
});
