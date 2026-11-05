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
│   ├── Dockerfile          # production Cloud Run image
│   ├── cloudbuild.yaml     # build, push, deploy pipeline
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

Deployment and reference documentation lives in `docs/`:

- [`docs/API.md`](docs/API.md) — API conventions, endpoints, SSE, error codes.
- [`docs/DATABASE.md`](docs/DATABASE.md) — Firestore collections, indexes, limits.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Cloud Run, Hosting, rules, monitoring.
- [`docs/HANDOVER.md`](docs/HANDOVER.md) — architecture summary, status, known issues.

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
| Frontend | `npm run test` | Vitest + React Testing Library |
| Frontend | `npm run test:watch` | Watch frontend tests |
| Frontend | `npm run preview` | Preview production build |

### Test coverage

The current suite passes: backend 20 test files / 106 tests, frontend 5 test
files / 20 tests. Backend Vitest tests cover workspace/project permissions,
channel membership, message behavior and pagination/search limits, board and
issue operations, integrations, notifications, analytics, CORS policy, API
authentication boundaries, and SSE stream limits. On constrained development
machines, run `npm --prefix Backend test -- --maxWorkers=1 --minWorkers=1` to
avoid worker contention.

Frontend tests use Vitest, jsdom, and React Testing Library. They cover routing
and auth guards, theme persistence and system preference handling, responsive
navigation and context-panel behavior, sign-in validation, Firebase token
verification, authentication failures, password-reset feedback, and SSE
connection states. They mock Firebase and the API; they do not replace Firebase
Emulator or browser end-to-end testing.

## Environment variables

**Backend** (see `.env.example`): `PORT`, `NODE_ENV`, `CORS_ORIGINS`, `TRUST_PROXY`
(set `true` behind Cloud Run's single proxy hop), `AUTH_TOKEN_CACHE_MS`, rate-limit
and logging settings, and Firebase Admin credentials (emulator mode by default).
`AUTH_TOKEN_CACHE_MS` caches verified ID tokens briefly (default 60 s) so Firebase
Auth is not called on every request; revocations propagate within that window.

**Frontend** (see `Frontend/.env.example`): `VITE_FIREBASE_*` client config and
`VITE_USE_FIREBASE_EMULATOR=true` to connect to the emulator locally. Browser
push additionally requires `VITE_FIREBASE_VAPID_KEY`, the public Web Push
certificate key from Firebase Console. These values are public client
configuration, not server credentials. Enable Firebase Cloud Messaging for the
project before opting into browser push.

Notifications are stored per user at
`users/{userId}/notifications/{notificationId}` and device registrations at
`users/{userId}/devices/{sha256Token}`. Device tokens are only accepted for the
authenticated user and are never returned by the API. Notification preferences
are stored on the user's profile. The authenticated `/api/v1/notifications`
routes provide cursor-paginated results, unread counts, read state, and device
registration. Workspace activity is stored at
`workspaces/{workspaceId}/activities/{activityId}` and exposed only to current
workspace members through `/api/v1/activities`.

The Productivity workspace at `/productivity` provides calendar and timeline
views, project and issue analytics, assignee workload summaries, advanced
issue filters, user-owned saved issue views, and sprint planning. Sprints are
stored in `sprints/{sprintId}` and issues reference a sprint through `sprintId`;
issue IDs remain canonical and sprint assignment is validated transactionally
against the sprint's project. Workspace search at `/search` returns accessible
projects, issues, channels, and messages. Message search is scoped to the user's
accessible conversations, scans up to the latest 100 messages per conversation,
and searches at most 25 conversations per request; the UI signals when the
result set may be incomplete. This bounds message-history scans to 2,500
documents per search request. Dashboard widget visibility is persisted in
browser-local preferences, scoped by workspace.

Productivity API routes are under `/api/v1`: `GET /analytics/workspace`,
`GET|POST /issues/views`, `DELETE /issues/views/:viewId`,
`GET|POST /sprints`, `PATCH /sprints/:sprintId/status`,
`PUT /sprints/:sprintId/issues`, and `GET /search`. All routes require Firebase
authentication; workspace and project visibility is checked server-side.

The root `firebase.json` points to `firestore.rules`, `storage.rules`, and
`firestore.indexes.json`. Firestore and Storage client access is denied by
default; application data access must go through Express, which verifies
Firebase ID tokens and enforces workspace/resource authorization. Deploy the
rules and indexes with `firebase deploy --only firestore:rules,firestore:indexes,storage`
before production use. Configure `CORS_ORIGINS` as a comma-separated allowlist
of exact production frontend origins; production requests with other browser
origins are rejected.

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

## Production deployment

The deployment path is Firebase Hosting for the SPA and Cloud Run for the API,
with Firestore, Storage, Auth, and FCM in project `workshop-111f1`.

```bash
# Build, push, and deploy the API (from the repository root)
gcloud builds submit . --config Backend/cloudbuild.yaml --project workshop-111f1

# Apply Firestore/Storage rules and indexes
firebase deploy --only firestore:rules,firestore:indexes,storage --project workshop-111f1

# Build and deploy the SPA; Hosting rewrites /api/** to Cloud Run
firebase deploy --only hosting --project workshop-111f1
```

The backend image is defined by `Backend/Dockerfile` and runs as a non-root user
on Node 22 Alpine. It uses Application Default Credentials from the Cloud Run
service account; no service-account key is stored in the repository or image.
Production logs are structured JSON with a Cloud Logging `severity` field.

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for one-time IAM setup,
environment variables, verification steps, monitoring, rollback, and known
deployment caveats. Nothing in this repository is deployed automatically; the
commands require access to the Google Cloud and Firebase projects.

## Development sections

This repository is developed section-by-section with explicit approval between
sections. See `AGENTS.md` for the full plan.