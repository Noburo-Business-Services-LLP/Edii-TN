# Deploying EDII-TN LMS

**Architecture:** Frontend → Vercel · Backend → Render · Database → MongoDB Atlas.

> ⚠️ Video note: Render's **free** tier has an ephemeral disk and sleeps after
> ~15 min idle, so uploaded videos in `/uploads` won't persist there. Everything
> else works. For persistent video, use a paid Render disk or move video to Bunny
> Stream later.

---

## 1. Push to GitHub

This project is a monorepo (`/client` + `/server`). Create a **new, empty** GitHub
repo (e.g. `edii-lms`), then from the project root:

```bash
git init
git add -A
git commit -m "Initial commit: EDII-TN LMS"
git branch -M main
git remote add origin https://github.com/<you>/edii-lms.git
git push -u origin main
```

`.env` files and `node_modules/` are gitignored — secrets are **not** committed.

---

## 2. Backend on Render

**Option A — Blueprint (uses `render.yaml`):**
Dashboard → **New → Blueprint** → pick your repo → it reads `render.yaml`.

**Option B — Manual:** New → **Web Service** → connect repo →
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/api/health`

**Environment variables** (Render dashboard → Environment):
| Key | Value |
|-----|-------|
| `MONGO_URI` | your Atlas connection string (with `/edii-lms` db name) |
| `JWT_ACCESS_SECRET` | long random string (Blueprint auto-generates) |
| `JWT_REFRESH_SECRET` | long random string (Blueprint auto-generates) |
| `CLIENT_URL` | your Vercel URL (fill in after step 3) |

After the first deploy, seed the database once from your machine (points at Atlas):
```bash
cd server && npm run seed
```
Note the backend URL, e.g. `https://edii-lms-api.onrender.com`.

---

## 3. Frontend on Vercel

Dashboard → **Add New → Project** → import the repo →
- **Root Directory:** `client`
- Framework preset: **Vite** (auto-detected)
- Build Command: `npm run build` · Output: `dist`

**Environment variable:**
| Key | Value |
|-----|-------|
| `VITE_API_URL` | your Render backend origin, e.g. `https://edii-lms-api.onrender.com` (no trailing slash) |

Deploy. Vercel gives you a URL like `https://edii-lms.vercel.app`.

---

## 4. Close the loop (CORS)

Back in Render, set `CLIENT_URL` to your Vercel URL and let the backend redeploy.
Auth uses Bearer tokens (not cookies), so this is mainly for tidy CORS.

Done — open the Vercel URL and log in.
