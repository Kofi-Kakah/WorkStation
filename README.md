# Unified Collaboration & Project Management Platform

A production-oriented SaaS platform combining Slack-style team chat,
Trello-style Kanban boards, and Jira-style issue tracking in one cohesive
workspace. Built with React + Vite (frontend) and Express + Firebase Admin
(backend), using Cloud Firestore as the single source of truth.

## Repository layout

```
WorkStation/
├── Backend/            # Express + Firebase Admin (ES Modules)
│   ├── src/
│   │   ├── config/     # firebase.js, env.js, cors.js
│   │   ├── middleware/ # authenticate, authorize, validate, errorHandler, notFound, rateLimiter
│   │   ├── modules/    # business modules (auth, users, workspaces, ...)
│   │   ├── shared/     # errors, constants, utils, services (notification, activity, permission)
│   │   ├── routes/     # index.js, health.js
│   │   ├── app.js      # Express app factory
│   │   └── server.js   # process entry point
│   ├── tests/          # vitest + supertest
│   ├── package.json
│   ├── .env.example
│   └── eslint.config.js
└── Frontend/           # React 19 + Vite + Tailwind v4 + Chakra UI
    ├── src/
    │   ├── components/ # ui, shared, navigation, feedback
    │   ├── features/   # auth, dashboard, workspace, projects, chat, boards, issues, ...
    │   ├── layouts/    # MainLayout, AuthLayout, Sidebar, Topbar, ContextPanel, SplitPane
    │   ├── contexts/   # AuthContext, AuthProvider, useAuth, ThemeProvider
    │   ├── hooks/      # useAuth, useWorkspace, useApi, usePresence
    │   ├── services/   # apiClient
    │   ├── lib/        # firebase.js, queryClient
    │   ├── routes/     # AppRoutes, ProtectedRoute
    │   ├── theme/      # chakraTheme.js, ThemeProvider.jsx
    │   ├── utils/
    │   ├── App.jsx, main.jsx, index.css
    ├── package.json
    ├── vite.config.js
    ├── eslint.config.js
    └── index.html
```

## Tech stack

- **Frontend:** React 19, Vite 8, Tailwind CSS 4 (`@tailwindcss/vite`), Chakra UI 2.10, React Router 7, TanStack Query 5, Lucide React, Firebase SDK 13, framer-motion.
- **Backend:** Node 22, Express 4, Firebase Admin 13, Zod, Helmet, CORS, express-rate-limit, winston, uuid.
- **Database:** Cloud Firestore (with Firebase Emulator Suite for local dev).
- **Storage:** Firebase Storage.
- **Auth:** Firebase Authentication (ID token verified by the Admin SDK on every request).

## Local development

### Prerequisites
- Node.js >= 20 (v22 tested).
- Java runtime (only if using the Firebase Emulator Suite).

### 1. Backend

```bash
cd Backend
cp .env.example .env        # adjust values as needed
npm install
npm run dev                # starts http://localhost:4000
```

The backend uses the Firebase Emulator Suite by default (`FIREBASE_USE_EMULATOR=true`).
To use production Firebase instead, set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`,
and `FIREBASE_PRIVATE_KEY` (never commit these) or rely on Application Default Credentials.

### 2. Frontend

```bash
cd Frontend
npm install
npm run dev                # starts http://localhost:5173
```

The Vite dev server proxies `/api/*` to the Express backend, so the SPA can call
`/api/health` etc. without CORS configuration.

### 3. Verify the connection

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/health/ready
# From the browser: http://localhost:5173/ shows the System health page
```

## Scripts

| Package | Script | Purpose |
|---|---|---|
| Backend | `npm run dev` | Start with `--watch` |
| Backend | `npm run start` | Start production |
| Backend | `npm run lint` | ESLint |
| Backend | `npm run test` | Vitest |
| Frontend | `npm run dev` | Vite dev server |
| Frontend | `npm run build` | Production build |
| Frontend | `npm run lint` | ESLint |
| Frontend | `npm run preview` | Preview production build |

## Environment variables

**Backend** (see `.env.example`): `PORT`, `NODE_ENV`, `CORS_ORIGINS`, rate-limit and
logging settings, and Firebase Admin credentials (emulator mode by default).

**Frontend** (see `.env.local`): `VITE_FIREBASE_*` client config (already populated for
project `workshop-111f1`) and `VITE_USE_FIREBASE_EMULATOR=true` to connect to the
emulator locally.

## Architecture notes

- **Modular monolith.** One Express backend organized into independent business
  modules (`auth`, `users`, `workspaces`, `projects`, `channels`, `messages`,
  `boards`, `lists`, `cards`, `issues`, `comments`, `sprints`, `notifications`,
  `attachments`, `activities`, `integrations`). Each module follows
  `routes → controller → service → repository`.
- **Authorization is server-side only.** `middleware/authenticate.js` verifies the
  Firebase ID token; `middleware/authorize.js` enforces role/resource checks using
  the centralized `shared/services/permissionService.js`. Never trust client-supplied
  roles or UIDs.
- **Single source of truth.** `issues/{issueId}` is canonical. Board cards reference
  issues via `issueId`; card placement (boardId, listId, position) lives on the card.
  Status sync uses Firestore transactions.
- **Shared services** (notification, activity, permission, attachment, user-lookup)
  avoid duplicated logic across modules.

## Development sections

This repository is developed section-by-section with explicit approval between
sections. See `AGENTS.md` for the full plan.