import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    category: { type: String, default: 'General' },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPublished: { type: Boolean, default: false },
    // When true, lessons unlock one-by-one. When false, all lessons are open.
    sequentialUnlock: { type: Boolean, default: true },
    // Ordered list of section ids (source of truth for section order).
    sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Section' }],
  },
  { timestamps: true }
);

export default mongoose.model('Course', courseSchema);
