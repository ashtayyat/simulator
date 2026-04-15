# Office Simulator (Word / Excel / PowerPoint)

A full-stack starter project for simulating Office training workflows with 3 role portals:

- **Admin portal**: manage users, courses, enrollments, exams, public/course templates, and all course results.
- **Teacher portal**: manage own courses, enroll students, create exams, create course templates, and monitor student results.
- **Student portal**: access enrolled courses, take exams, browse templates, and review grades.

## Stack

- **Frontend:** React + Vite + React Router + Remotion player
- **Backend:** Node.js + Express
- **Database:** SQLite (SQL schema + relational constraints)

## Quick Start

```bash
npm install
npm run dev
```

- Frontend runs on `http://localhost:5173`
- Backend runs on `http://localhost:4000`

## Demo Accounts

All seeded with password `Password123!`:

- `admin@office-sim.com`
- `teacher@office-sim.com`
- `student@office-sim.com`

## Notes

- Database file is `backend/office_simulator.db` and auto-initializes on first backend launch.
- Remotion is used in the Templates page to preview PowerPoint-like animated slide templates.
