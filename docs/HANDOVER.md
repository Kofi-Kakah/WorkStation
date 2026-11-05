# Project Handover

## 1. Status

WorkStation is a unified collaboration and project-management platform
combining Slack-style chat, Trello-style boards, and Jira-style issue tracking
in one workspace.

- Sections 1-14 were implemented, verified, and approved.
- Section 15 added production artifacts and documentation. It is awaiting final
  approval.
- **No live deployment was performed.** This environment has no Google Cloud
  CLI, no Firebase CLI, no project credentials, and no running Docker daemon.
  The deployment artifacts are complete, but a person with access to project
  `workshop-111f1` must execute the steps in `docs/DEPLOYMENT.md`.

## 2. Architecture at a glance

```text
Browser (React SPA, Firebase Web SDK)
  |  Firebase ID token (Bearer) + HTTPS
  v
Firebase Hosting  --/api/** rewrite-->  Cloud Run (Express, Node 22)
  |                                        |
  |  static assets                         +--> Cloud Firestore
  +--> CDN                                 +--> Firebase Storage
                                           +--> Firebase Auth (token verification)
                                           +--> Firebase Cloud Messaging
```

- **Frontend:** React 19, Vite, Tailwind CSS 4, Chakra UI, React Router,
  TanStack Query, Firebase Web SDK, dnd-kit.
- **Backend:** one Express modular monolith in ES modules, with
  `routes -> controller -> service -> repository` layering.
- **Data:** Firestore is the source of truth; Storage holds attachments; FCM
  delivers push notifications.
- **Auth:** Firebase Authentication. Express verifies every ID token with the
  Admin SDK and derives identity from the verified UID.
- **Authorization:** centralized in
  `Backend/src/shared/services/permissionService.js` and enforced in
  repositories/services. The client never enforces permissions.
- **Canonical work records:** `issues/{issueId}`. Board cards reference an
  issue and hold only placement data. Status changes and card moves are
  synchronized transactionally.
- **Real time:** Server-Sent Events stream message invalidation signals per
  conversation (`GET /api/v1/channels/:channelId/events`), with heartbeat,
  reconnect, and a five-stream-per-user cap.

## 3. Module inventory

### Backend (`Backend/src`)

| Area | Responsibility |
|---|---|
| `auth` | Registration, token verification, password-reset support, logout |
| `users` | Profiles, preferences, profile lookup |
| `workspaces`, `invitations` | Workspaces, membership, roles, invite links |
| `projects` | Projects, visibility, project members, archive |
| `channels` | Channels, DMs, groups, members, read cursors, presence |
| `messages` | Messages, threads, reactions, search, SSE |
| `attachments` | Validated uploads and signed downloads |
| `boards`, `lists`, `cards` | Kanban boards, ordering, card placement |
| `issues`, `comments` | Issue tracking, workflow, comments, saved views |
| `sprints` | Sprint planning and issue assignment |
| `integrations` | Message-to-issue conversion |
| `notifications`, `activities` | In-app/push notifications, workspace activity |
| `analytics`, `search` | Workspace analytics and bounded global search |
| `shared/` | Errors, constants, validation, permission/notification/activity services |

### Frontend (`Frontend/src`)

Feature folders: `auth`, `dashboard`, `workspace`, `projects`, `chat`,
`boards`, `issues`, `notifications`, `search`, `productivity`, `settings`.
Shared UI lives in `components/`, application chrome in `layouts/`, and
cross-cutting state in `contexts/` and `hooks/`.

## 4. Security posture

- Firebase ID tokens are verified server-side on every protected route; UIDs
  and roles from request bodies are never trusted as identity.
- Workspace, project, channel, and role checks are enforced in the backend.
- Firestore and Storage client rules deny all access; the Admin SDK bypasses
  them, so Express remains the only data path.
- Private attachments are served through five-minute signed URLs after an
  authorization check; objects are never public.
- Uploads are limited to 10 MB and an allowlist of MIME types, and file
  signatures are checked, not just headers.
- CORS uses an exact origin allowlist in production.
- Helmet, request IDs, structured logs, centralized error handling, Zod
  validation, and rate limits are enabled.
- No credentials, service-account keys, or `.env` files are committed.
  Cloud Build uploads exclude environment files via `.gcloudignore`.

## 5. Verification performed in this environment

| Check | Result |
|---|---|
| Backend ESLint | Pass |
| Backend Vitest | 20 files, 106 tests passed |
| Frontend ESLint | Pass |
| Frontend Vitest (jsdom + RTL) | 5 files, 20 tests passed |
| Frontend production build | Pass (Vite build completed; `Frontend/dist` generated) |
| JSON configuration (`firebase.json`, `.firebaserc`, `firestore.indexes.json`) | Parse successfully |
| `Backend/cloudbuild.yaml` | Parses successfully with a YAML parser |
| Production logger | Emits JSON with Cloud Logging `severity` values |
| Docker image build | **Not verified** — Docker daemon was unavailable in this environment |
| Live Cloud Run / Hosting deploy | **Not performed** — no cloud credentials or CLIs |
| Firestore/Storage rules/index deployment | **Not performed** — requires Firebase CLI and project access |

The Dockerfile targets `node:22-alpine`, installs production dependencies with
`npm ci --omit=dev`, runs as a non-root user, exposes port 8080, and includes a
liveness health check. It still needs one successful `docker build` (or the
Cloud Build pipeline) on a machine with a working Docker daemon.

## 6. Deployment checklist

Follow `docs/DEPLOYMENT.md`. The essential order is:

1. Enable Google Cloud APIs and create the runtime service account with the
   least-privilege roles listed there.
2. Grant the Cloud Build service account `run.admin`,
   `iam.serviceAccountUser`, and `artifactregistry.writer`.
3. `gcloud builds submit . --config Backend/cloudbuild.yaml --project workshop-111f1`
4. `firebase deploy --only firestore:rules,firestore:indexes,storage --project workshop-111f1`
5. Build the SPA with production `VITE_*` values and
   `firebase deploy --only hosting --project workshop-111f1`.
6. Verify health, authentication, uploads, issue/card sync, notifications, and
   the SSE stream.
7. Configure uptime checks and alerts, and enable Firestore backups.

Required external values not present in the repository:

- Google Cloud project access and billing.
- Firebase web app configuration for the production origin.
- A VAPID key if browser push is required.
- Permission to deploy Firestore/Storage rules and indexes.

## 7. Known limitations and follow-up work

1. **No live environment validation.** The deployment commands, IAM setup,
   rules, indexes, and Hosting rewrite have not been executed against the real
   project. Treat the first deployment as a staging exercise.
2. **SSE through Firebase Hosting is unverified.** If Hosting buffers the
   stream, point `VITE_API_BASE` at the Cloud Run URL, add that origin to
   `CORS_ORIGINS`, and rebuild. The backend already sets
   `Cache-Control: no-transform` and `X-Accel-Buffering: no`.
3. **Rate limits are per Cloud Run instance.** They are not global across
   instances. Add Cloud Armor or a shared store only if a global limit becomes
   necessary.
4. **No end-to-end browser tests.** Backend testing includes HTTP integration
   tests and repository/service tests; frontend testing is component-level with
   mocked Firebase. Add Playwright or Cypress for critical flows.
5. **No CI test pipeline.** Cloud Build currently builds and deploys the API;
   it does not run lint/tests. Wire `npm run lint` and `npm test` into CI before
   requiring green deploys.
6. **Invitations are link-based.** No transactional email provider is
   integrated. An admin creates an invitation and shares the link shown in
   Workspace Settings. Password reset, by contrast, uses Firebase's client-side
   email flow.
7. **Search is bounded.** Firestore has no native full-text search. User search
   is prefix-based; message search scans the latest 100 messages in at most 25
   conversations per request. The UI indicates potentially incomplete results.
8. **No malware scanning.** Uploads are constrained by type, size, and magic
   bytes, but are not virus-scanned.
9. **No attachment garbage collection.** Soft-deleting a message does not
   delete its Storage object or upload metadata.
10. **No subcollection cascade deletion.** Removing a workspace or project
    document does not delete its subcollections. Implement an administrative
    cleanup job before offering hard deletion in production.
11. **Unused empty file.** `Backend/src/modules/cards/card.repository.js` is
    zero bytes and unused; board card logic lives in
    `Backend/src/modules/boards/board.repository.js`. It can be removed after
    approval.
12. **Duplicate message-runner mount.** Message routes are mounted under both
    `/channels` and `/messages`; the frontend uses `/messages/search` and
    `/channels/:id/...`. This is harmless but can be simplified later.
13. **Deleted login endpoint.** `POST /api/v1/auth/login` intentionally returns
    410; the SPA signs in with the Firebase client SDK and verifies the token
    through `/auth/verify`.

## 8. Common operations

```bash
# Local backend and frontend
cd Backend && npm run dev
cd Frontend && npm run dev

# Full test suites
cd Backend && npm run lint && npm test
cd Frontend && npm run lint && npm test && npm run build

# Production API
gcloud builds submit . --config Backend/cloudbuild.yaml --project workshop-111f1
gcloud run services logs read workstation-api --region us-central1 --project workshop-111f1 --limit 100

# Rules, indexes, hosting
firebase deploy --only firestore:rules,firestore:indexes,storage --project workshop-111f1
firebase deploy --only hosting --project workshop-111f1
```

## 9. Recommended next steps

1. Deploy to a staging project first and run the verification checklist.
2. Confirm the SSE stream through Hosting; switch to the direct Cloud Run URL
   if needed.
3. Enable Firestore backups, uptime checks, and error/latency alerts.
4. Add CI tests and a browser end-to-end suite.
5. Implement invitation email delivery and subcollection cleanup before
   enabling destructive workspace/project deletion.
6. Remove the unused empty repository file and simplify the duplicate message
   route mount.

## 10. Documentation index

- `README.md` — local setup, scripts, and architecture notes.
- `docs/API.md` — endpoints, authentication, errors, rate limits, SSE.
- `docs/DATABASE.md` — collections, shapes, indexes, limits, deletion behavior.
- `docs/DEPLOYMENT.md` — IAM, Cloud Build, Hosting, rules, monitoring, rollback.
- `Frontend/README.md` — frontend stack, environment, structure, testing.
