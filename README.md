# Office Simulator Platform

A multi-portal Office simulator web application built with **React**, **Remotion**, and a **SQL (SQLite)** backend.

> If you open `https://<user>.github.io/<repo>/` and only see README text, your repository is currently publishing documentation/static root instead of the built React app. Use the GitHub Pages workflow in this repo to deploy `client/dist`.

## Why this happened on GitHub Pages

GitHub Pages only hosts **static files**. Your app has two parts:
- Frontend (React) ✅ can run on GitHub Pages.
- Backend (Express + SQLite) ❌ cannot run directly on GitHub Pages.

So for a working online demo, you need:
1. Deploy frontend to GitHub Pages.
2. Deploy backend separately (Render/Railway/Fly/VM), then set `VITE_API_URL` to that backend.

## Portals

- **Public**: Landing page + login.
- **Admin**: Manage users, courses, enrollments, exams, templates, and course results.
- **Teacher**: Manage own courses, enrollments, exams, templates, and student results.
- **Student**: Access enrolled courses, view templates, and take exams.

## Tech Stack

- Frontend: React + Vite + React Router + Remotion Player
- Backend: Node.js + Express
- Database: SQLite (`better-sqlite3`)

## Prerequisites

- Node.js **22 LTS** (also used by CI)
- npm **9+**

Check versions:

```bash
node -v
npm -v
```

## Local Run (recommended first)

From project root:

1) Install root + workspace dependencies

```bash
npm ci
npm ci --prefix server
npm ci --prefix client
```

2) Initialize and seed database

```bash
npm run db:init
npm run db:seed
```

3) Start both services

```bash
npm run dev
```

4) Open:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`
- Health: `http://localhost:4000/health`

## Default Login Accounts

- `admin@office.local` / `admin123`
- `teacher@office.local` / `teacher123`
- `student@office.local` / `student123`

## GitHub Pages Deployment (Frontend)

This repo includes `.github/workflows/deploy-pages.yml` to deploy `client/dist`.

### Required repository settings

1. Go to **Settings → Pages**.
2. Under **Build and deployment**, choose **GitHub Actions**.
3. Commit to `main` (or run workflow manually).

### Optional repository variable

If backend is deployed, set repo variable:

- Name: `VITE_API_URL`
- Value: `https://your-backend-domain/api`

Without this variable, the frontend defaults to `http://localhost:4000/api` (works only locally).

## Environment Variables

See `client/.env.example`:

- `VITE_API_URL` → backend API base URL
- `VITE_BASE_PATH` → `/simulator/` for GitHub Pages project sites

## Useful Commands

```bash
# Backend only
npm run dev --prefix server

# Frontend only
npm run dev --prefix client

# Build frontend
npm run build

# Start backend (no watch)
npm run start
```

## Troubleshooting

### I see README page instead of app

- Ensure Pages source is **GitHub Actions**.
- Ensure workflow `Deploy Client to GitHub Pages` succeeded.
- Ensure app URL is the workflow output URL.

### App loads but login/API fails on GitHub Pages

- Backend is not hosted on GitHub Pages.
- Deploy backend separately.
- Set repo variable `VITE_API_URL` to deployed backend `/api` URL.

### npm install returns 403 Forbidden

If your environment blocks the npm public registry:

```bash
npm config get registry
npm config set registry https://registry.npmjs.org/
npm install
npm run install:all
```

If your organization requires an internal registry, use that registry URL.


## Validation and sessions

The canonical application lives in `client/` and `server/`. The earlier
`frontend/` and `backend/` scaffold is superseded by this layout.

After installing dependencies, run:

```bash
npm run check --prefix server
npm test --prefix server
npm run build
```

The API integration test creates and removes its own temporary SQLite database.
It checks login, role and course restrictions, enrollment, template visibility,
exam validation, answer-key filtering, grading, and duplicate submission rejection.
The frontend build validates JSX through Vite. PR validation does not deploy Pages.

Login returns a random bearer session token valid for 12 hours. Sessions live in
server memory, so restarting the backend or refreshing the page requires login.
Passwords for new users and seeded accounts use salted scrypt hashes. Existing
plaintext demo passwords are upgraded on successful login. Demo credentials above
are for local development; replace them before exposing a deployment.

`PORT` overrides the backend port and `DB_PATH` overrides the SQLite file path.
