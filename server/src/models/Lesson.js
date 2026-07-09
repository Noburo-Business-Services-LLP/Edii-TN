import mongoose from 'mongoose';

// A single quiz question, reused by markers and standalone quizzes.
const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    type: { type: String, enum: ['single', 'multi', 'boolean'], default: 'single' },
    options: [{ type: String }],
    // Indexes (into options) of the correct answer(s). For boolean: [0]=true, [1]=false.
    correctAnswers: [{ type: Number }],
    explanation: { type: String, default: '' },
    points: { type: Number, default: 1 },
  },
  { _id: true }
);

// Interactive markers pinned to a timestamp on a video lesson.
const markerSchema = new mongoose.Schema(
  {
    timestamp: { type: Number, required: true }, // seconds
    type: { type: String, enum: ['quiz', 'summary', 'note'], required: true },
    // quiz markers block resuming until answered
    pauseVideo: { type: Boolean, default: true },
    question: questionSchema, // if type === 'quiz'
    title: { type: String, default: '' }, // if summary/note
    body: { type: String, default: '' },
  },
  { _id: true }
);

const lessonSchema = new mongoose.Schema(
  {
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    type: { type: String, enum: ['video', 'quiz', 'reading'], default: 'video' },

    // video lessons
    videoPath: { type: String, default: '' }, // relative path in /uploads
    duration: { type: Number, default: 0 }, // seconds
    markers: [markerSchema],
    // Chapters = the in-video table of contents. For a single long video the
    // TOC is driven by these: they auto-highlight as playback crosses them and
    // seek the video when clicked.
    chapters: [
      {
        title: { type: String, required: true },
        timestamp: { type: Number, required: true }, // seconds
      },
    ],

    // standalone quiz lessons
    quiz: {
      questions: [questionSchema],
      passingScore: { type: Number, default: 70 }, // percent
      maxAttempts: { type: Number, default: 0 }, // 0 = unlimited
      blocksProgression: { type: Boolean, default: true },
    },

    // reading lessons
    content: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Lesson', lessonSchema);
