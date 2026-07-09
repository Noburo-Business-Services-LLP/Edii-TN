import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/edii-lms');
  app.listen(PORT, () => console.log(`✓ API running on http://localhost:${PORT}`));
}

start();
