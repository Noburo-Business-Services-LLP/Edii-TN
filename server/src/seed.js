import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Course from './models/Course.js';
import Section from './models/Section.js';
import Lesson from './models/Lesson.js';
import Enrollment from './models/Enrollment.js';
import QuizAttempt from './models/QuizAttempt.js';

async function run() {
  await connectDB(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edii-lms');

  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Course.deleteMany({}),
    Section.deleteMany({}),
    Lesson.deleteMany({}),
    Enrollment.deleteMany({}),
    QuizAttempt.deleteMany({}),
  ]);

  // --- Users ---
  const admin = new User({ name: 'EDII Admin', email: 'admin@edii-tn.org', role: 'admin' });
  await admin.setPassword('Admin@123');
  await admin.save();

  const student = new User({ name: 'Test Student', email: 'student@edii-tn.org', role: 'student' });
  await student.setPassword('Student@123');
  await student.save();

  // --- Sample course ---
  const course = await Course.create({
    title: 'Entrepreneurship Essentials',
    description:
      'A starter course on turning an idea into a viable business — from opportunity spotting to a first business model. Built for EDII-TN learners.',
    category: 'Entrepreneurship',
    level: 'Beginner',
    thumbnail: '',
    isPublished: true,
    sequentialUnlock: true,
    createdBy: admin._id,
  });

  const section1 = await Section.create({
    course: course._id,
    title: 'Module 1: Finding the Opportunity',
    order: 0,
  });
  const section2 = await Section.create({
    course: course._id,
    title: 'Module 2: Building the Model',
    order: 1,
  });

  const lesson1 = await Lesson.create({
    course: course._id,
    section: section1._id,
    title: 'What is entrepreneurship?',
    type: 'video',
    order: 0,
    videoPath: '', // admin uploads a real video from the dashboard
    duration: 300,
    chapters: [
      { title: 'Introduction', timestamp: 0 },
      { title: 'What problem are you solving?', timestamp: 60 },
      { title: 'Value creation', timestamp: 150 },
      { title: 'Wrap-up', timestamp: 240 },
    ],
    markers: [
      {
        timestamp: 60,
        type: 'summary',
        pauseVideo: false,
        title: 'Key idea',
        body: 'Entrepreneurship is about creating value by solving a real problem for a real customer.',
      },
      {
        timestamp: 120,
        type: 'quiz',
        pauseVideo: true,
        question: {
          text: 'What is at the core of entrepreneurship?',
          type: 'single',
          options: ['Raising money', 'Solving a real problem', 'Having an office', 'Hiring staff'],
          correctAnswers: [1],
          explanation: 'Value creation by solving a real problem is the core.',
          points: 1,
        },
      },
    ],
  });

  const lesson2 = await Lesson.create({
    course: course._id,
    section: section1._id,
    title: 'Spotting opportunities',
    type: 'video',
    order: 1,
    duration: 300,
    markers: [],
  });

  const quizLesson = await Lesson.create({
    course: course._id,
    section: section2._id,
    title: 'Module 1 Quiz',
    type: 'quiz',
    order: 0,
    quiz: {
      passingScore: 70,
      maxAttempts: 0,
      blocksProgression: true,
      questions: [
        {
          text: 'A business model describes how a company...',
          type: 'single',
          options: ['Files taxes', 'Creates and captures value', 'Designs a logo', 'Picks an office'],
          correctAnswers: [1],
          explanation: 'A business model is about creating and capturing value.',
          points: 1,
        },
        {
          text: 'Which are valid revenue models? (select all)',
          type: 'multi',
          options: ['Subscription', 'One-time sale', 'Advertising', 'Wishful thinking'],
          correctAnswers: [0, 1, 2],
          explanation: 'Subscription, one-time sale and advertising are all real revenue models.',
          points: 2,
        },
      ],
    },
  });

  section1.lessons = [lesson1._id, lesson2._id];
  await section1.save();
  section2.lessons = [quizLesson._id];
  await section2.save();

  course.sections = [section1._id, section2._id];
  await course.save();

  console.log('\n✓ Seed complete');
  console.log('  Admin   : admin@edii-tn.org / Admin@123');
  console.log('  Student : student@edii-tn.org / Student@123');
  console.log(`  Course  : ${course.title} (${course._id})`);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
