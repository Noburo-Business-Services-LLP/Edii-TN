import express from 'express';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import sectionRoutes from './routes/sectionRoutes.js';
import lessonRoutes from './routes/lessonRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import streamRoutes from './routes/streamRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import { errorHandler, notFound } from './middleware/error.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api', enrollmentRoutes); // /me/enrollments and /enrollments/:id/progress

app.use(notFound);
app.use(errorHandler);

export default app;
