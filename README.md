# EDII-TN Learning Platform (LMS)

A MERN learning platform for **EDII-TN** (Entrepreneurship Development & Innovation Institute, Tamil Nadu), inspired by Coursera/Udemy.

Admins create courses, upload videos, define the table of contents (TOC), and add
in-video **quizzes** and **summaries**. Students enroll, watch, and progress through
courses on a **sequential-unlock** path.

---

## Core concepts

### Roles
- **admin** — full control: courses, videos, TOC, quizzes, users, analytics.
- **student** — browse catalog, enroll, watch, take quizzes, track progress.

### Content hierarchy (the TOC)
```
Course
 └── Section (module / chapter)     ← TOC groupings, ordered
      └── Lesson (lecture)          ← ordered
           ├── type: video   → video + interactive markers
           ├── type: quiz    → standalone quiz
           └── type: reading → rich text
```

### Interactive markers (on the video timeline)
Each video lesson has an array of `markers`, each pinned to a timestamp:
- `quiz`    → **pauses** the video, asks a question, blocks resuming until answered.
- `summary` → shows a key-takeaways card (collects into a "Lesson summary" panel).
- `note`    → lightweight callout / resource link.

### Sequential unlock
A lesson unlocks only after the **previous lesson is completed** (video watched ≥95%
plus any blocking quiz passed). Completed/unlocked lessons can be **rewatched
unlimited times**; locked lessons ahead are not reachable. Enforced on the **server**,
not just hidden in the UI.

---

## Tech stack
- **Backend:** Node, Express, MongoDB (Mongoose), JWT auth, Multer uploads, HTTP range streaming.
- **Frontend:** React + Vite, React Router, Tailwind CSS, TanStack Query, Axios.
- **Video:** stored on local disk, streamed via HTTP Range requests (no cloud service).
  Storage is behind a `services/storage` adapter so it can swap to cloud later.

---

## Project structure
```
LMS-EDII/
├── server/          Express API
│   ├── src/
│   │   ├── models/         Mongoose schemas
│   │   ├── controllers/    route handlers
│   │   ├── routes/         Express routers
│   │   ├── middleware/     auth, role, enrolled, upload, errors
│   │   ├── services/       storage adapter
│   │   ├── utils/          tokens, unlock logic
│   │   ├── config/         db connection
│   │   ├── app.js          express app
│   │   ├── server.js       entry point
│   │   └── seed.js         seed admin + sample course
│   └── uploads/            video files (gitignored)
└── client/          React app
    └── src/
        ├── pages/          Catalog, CourseDetail, LessonPlayer, admin/*
        ├── components/     VideoPlayer, QuizOverlay, TOCSidebar, ...
        ├── features/       auth context, api hooks
        └── lib/            axios client
```

---

## Getting started

### Prerequisites
- Node 18+ (tested on v22)
- MongoDB — either a local install (`mongodb://127.0.0.1:27017`) or a free
  [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

### 1. Backend
```bash
cd server
cp .env.example .env      # then edit MONGO_URI + JWT secrets
npm install
npm run seed              # creates an admin + a sample course
npm run dev               # starts API on http://localhost:5000
```
Seeded admin login: **admin@edii-tn.org / Admin@123**

### 2. Frontend
```bash
cd client
npm install
npm run dev               # starts app on http://localhost:5173
```

---

## API surface (summary)
```
Auth        POST /api/auth/register · /login · /refresh    GET /api/auth/me
Courses     GET /api/courses · GET /api/courses/:id
            POST/PATCH/DELETE /api/courses/:id             (admin)
Sections    POST /api/courses/:id/sections · PATCH/DELETE  (admin)
Lessons     POST /api/sections/:id/lessons · PATCH/DELETE  (admin)
Video       POST /api/upload/video (admin) · GET /api/stream/:lessonId (enrolled)
Enroll      POST /api/courses/:id/enroll · GET /api/me/enrollments
Progress    PATCH /api/enrollments/:id/progress
Quiz        POST /api/lessons/:id/attempt · GET /api/lessons/:id/attempts
```

Write routes require `auth + role('admin')`. Streaming/progress require `auth +
enrolled + unlocked`.
