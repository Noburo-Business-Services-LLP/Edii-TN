import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    // null for a full-lesson quiz; set to the marker's _id for an in-video checkpoint
    markerId: { type: mongoose.Schema.Types.ObjectId, default: null },
    answers: [{ type: [Number] }], // per-question selected option indexes
    score: { type: Number, default: 0 }, // percent
    passed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('QuizAttempt', quizAttemptSchema);
