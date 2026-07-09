import Lesson from '../models/Lesson.js';
import Enrollment from '../models/Enrollment.js';
import QuizAttempt from '../models/QuizAttempt.js';
import ApiError, { asyncHandler } from '../utils/ApiError.js';
import { gradeAnswers } from '../utils/grade.js';

// POST /api/lessons/:id/attempt
// body: { markerId?, answers: [[Number]] }
//   - markerId set  -> grade a single in-video checkpoint question
//   - markerId null -> grade the standalone lesson quiz
export const submitAttempt = asyncHandler(async (req, res) => {
  const { markerId = null, answers = [] } = req.body;
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) throw new ApiError(404, 'Lesson not found');

  let questions;
  let passingScore = 100;
  let maxAttempts = 0;

  if (markerId) {
    const marker = lesson.markers.id(markerId);
    if (!marker || marker.type !== 'quiz' || !marker.question) {
      throw new ApiError(400, 'No quiz at that marker');
    }
    questions = [marker.question];
  } else {
    if (!lesson.quiz?.questions?.length) throw new ApiError(400, 'Lesson has no quiz');
    questions = lesson.quiz.questions;
    passingScore = lesson.quiz.passingScore ?? 70;
    maxAttempts = lesson.quiz.maxAttempts ?? 0;
  }

  if (maxAttempts > 0) {
    const used = await QuizAttempt.countDocuments({
      student: req.user._id,
      lesson: lesson._id,
      markerId,
    });
    if (used >= maxAttempts) throw new ApiError(429, 'No attempts remaining');
  }

  const { score } = gradeAnswers(questions, answers);
  const passed = score >= passingScore;

  const attempt = await QuizAttempt.create({
    student: req.user._id,
    lesson: lesson._id,
    markerId,
    answers,
    score,
    passed,
  });

  // Per-question feedback (safe to reveal after an attempt).
  const feedback = questions.map((q, i) => ({
    correctAnswers: q.correctAnswers,
    explanation: q.explanation,
    yourAnswer: answers[i] || [],
  }));

  res.status(201).json({ attempt: { score, passed, _id: attempt._id }, feedback });
});

// GET /api/lessons/:id/attempts  (a student's own attempts on a lesson)
export const myAttempts = asyncHandler(async (req, res) => {
  const attempts = await QuizAttempt.find({
    student: req.user._id,
    lesson: req.params.id,
  })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ attempts });
});
