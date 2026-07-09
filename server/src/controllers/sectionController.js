import Course from '../models/Course.js';
import Section from '../models/Section.js';
import Lesson from '../models/Lesson.js';
import ApiError, { asyncHandler } from '../utils/ApiError.js';

// POST /api/courses/:id/sections  (admin)
export const createSection = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) throw new ApiError(404, 'Course not found');

  const section = await Section.create({
    course: course._id,
    title: req.body.title || 'New section',
    order: course.sections.length,
  });
  course.sections.push(section._id);
  await course.save();
  res.status(201).json({ section });
});

// PATCH /api/sections/:id  (admin) — title, order, reordered lesson array
export const updateSection = asyncHandler(async (req, res) => {
  const update = {};
  for (const key of ['title', 'order', 'lessons']) {
    if (key in req.body) update[key] = req.body[key];
  }
  const section = await Section.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!section) throw new ApiError(404, 'Section not found');
  res.json({ section });
});

// DELETE /api/sections/:id  (admin) — cascade lessons, unlink from course
export const deleteSection = asyncHandler(async (req, res) => {
  const section = await Section.findById(req.params.id);
  if (!section) throw new ApiError(404, 'Section not found');
  await Lesson.deleteMany({ section: section._id });
  await Course.updateOne({ _id: section.course }, { $pull: { sections: section._id } });
  await section.deleteOne();
  res.json({ ok: true });
});
