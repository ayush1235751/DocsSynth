# 🚢 DocsSynth — Production Deployment Guide

This guide provides step-by-step instructions for deploying DocsSynth to production across popular cloud providers (Vercel, Render, Railway, AWS, and MongoDB Atlas).

---

## 1. MongoDB Atlas Setup (Database & Vector Search)

1. Create an account on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a free **M0 Sandbox** or higher cluster.
3. Under **Database Access**, create a database user with read/write permissions.
4. Under **Network Access**, add `0.0.0.0/0` (or your backend hosting provider's IP range).
5. Copy the connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?appName=DocsSynth
   ```
6. *(Optional for hardware acceleration)* Create a Search Index on database `DocsSynth`, collection `Private_DOCS`, named `vector_index`:
   ```json
   {
     "fields": [
       {
         "type": "vector",
         "path": "embedding",
         "numDimensions": 1024,
         "similarity": "cosine"
       },
       {
         "type": "filter",
         "path": "fileName"
       }
     ]
   }
   ```

---

## 2. Backend Deployment (Render / Railway / Fly.io)

### Deploying to Render
1. Create a new **Web Service** linked to your Git repository.
2. Set Root Directory to `Backend`.
3. Set Build Command: `npm install`
4. Set Start Command: `node server.js`
5. Add Environment Variables:
   - `PORT`: `5000` (or let Render set it dynamically)
   - `OPENROUTER_API_KEY`: `your_openrouter_api_key`
   - `MongoDB`: `your_mongodb_connection_uri`
6. Click **Deploy Web Service**. Note your backend URL (e.g. `https://docssynth-api.onrender.com`).

---

## 3. Frontend Deployment (Vercel / Netlify / Cloudflare Pages)

### Deploying to Vercel
1. Import your Git repository in [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Framework Preset: `Vite`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add Environment Variable:
   - `VITE_API_URL`: `https://docssynth-api.onrender.com` (Your deployed Backend URL)
7. Click **Deploy**.

---

## 4. Production Verification Checklist

- [ ] Backend health endpoint (`GET /api/health`) returns status `"ok"`.
- [ ] PDF upload works for files up to 25MB and temporary files are deleted after chunk indexing.
- [ ] RAG Chat returns answers with valid sources and chunk numbers.
- [ ] Active Recall flashcards flip properly and confetti triggers upon completion.
- [ ] Practice Quizzes score accurately and audio playback functions smoothly.
