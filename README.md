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

- Node.js **18+** (recommended: Node.js 20 LTS)
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
npm install
npm run install:all
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
