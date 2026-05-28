# Team Task Manager

A full-stack web app for creating projects, assigning tasks, and tracking progress with **role-based access control** (Admin / Member per project).

## Features

- **Authentication** — Sign up, sign in, JWT sessions
- **Projects** — Create projects; creator becomes Admin
- **Team management** — Admins add members by email, set roles, remove members
- **Tasks** — Create, assign, update status (To Do / In Progress / Done), due dates
- **Dashboard** — Task counts by status, overdue tasks, recent activity
- **RBAC** — Project-scoped Admin vs Member permissions

## Tech stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| API      | Node.js, Express, express-validator |
| Database | SQLite + Prisma ORM                 |
| Auth     | JWT + bcrypt                        |
| UI       | React, Vite, React Router           |

## Quick start

```bash
# From project root
npm install
npm run install:all
npm run db:setup
npm run dev
```

- **Frontend:** http://localhost:5173  
- **API:** http://localhost:3001  

### Demo accounts (after seed)

| Email            | Password     | Role on demo project |
|------------------|--------------|----------------------|
| admin@demo.com   | password123  | Admin                |
| member@demo.com  | password123  | Member               |

## API overview

All protected routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Auth |
| GET | `/api/dashboard` | Auth |
| GET/POST | `/api/projects` | Auth |
| GET/PATCH/DELETE | `/api/projects/:id` | Member / Admin* |
| GET/POST | `/api/projects/:id/members` | Member / Admin* |
| PATCH/DELETE | `/api/projects/:id/members/:userId` | Admin |
| GET/POST | `/api/tasks/projects/:id/tasks` | Member |
| GET/PATCH/DELETE | `/api/tasks/:id` | Member |

\* PATCH/DELETE project requires Admin.

## Data model

```
User ──┬── ProjectMember (role: ADMIN | MEMBER) ── Project
       ├── Task (assignee)
       └── Task (creator)
```

## RBAC rules

- **Admin:** Edit/delete project, manage team roles, delete any task
- **Member:** View project, create/edit tasks, delete own tasks only
- Users only see projects they belong to
- Assignees must be project members

## Production notes

- Change `JWT_SECRET` in `server/.env`
- Switch Prisma datasource to PostgreSQL for production
- Run `npm run build --prefix client` and serve static files behind your API or a reverse proxy
