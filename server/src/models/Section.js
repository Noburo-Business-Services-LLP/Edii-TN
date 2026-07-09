import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    // Ordered list of lesson ids.
    lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
  },
  { timestamps: true }
);

export default mongoose.model('Section', sectionSchema);
