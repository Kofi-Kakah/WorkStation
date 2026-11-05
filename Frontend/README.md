# WorkStation Frontend

React 19 + Vite single-page application for the WorkStation collaboration
platform. It contains the application shell, authentication, dashboards, chat,
Kanban boards, issue tracking, notifications, search, and productivity views.

## Stack

- React 19, React Router 7, TanStack Query 5
- Vite 8, Tailwind CSS 4 (`@tailwindcss/vite`)
- Chakra UI 2.10 with Emotion and framer-motion
- Lucide React icons, dnd-kit for Kanban drag and drop
- Firebase Web SDK 13 (Auth, Firestore, Storage, Messaging)

JavaScript only: the project intentionally has no TypeScript source or
configuration.

## Local development

```bash
cp .env.example .env.local     # fill in Firebase web app values
npm install
npm run dev                    # http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:4000`, so run the
backend at the same time (see the root README). Set
`VITE_USE_FIREBASE_EMULATOR=true` in `.env.local` when using the Firebase
Emulator Suite; the client then connects Auth to `127.0.0.1:9099` and Firestore
to `127.0.0.1:8080`.

All `VITE_*` values are public in the built bundle. Never put server
credentials or private keys in them.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run test` | Vitest + React Testing Library |
| `npm run test:watch` | Watch mode |

## Structure

```text
src/
├── components/     # ui, shared, navigation, feedback
├── contexts/       # AuthProvider, ThemeProvider, workspace context
├── features/       # auth, dashboard, workspace, projects, chat, boards,
│                   # issues, notifications, search, productivity, settings
├── hooks/          # useApi, useAuth, useWorkspace, usePresence
├── layouts/        # MainLayout, Sidebar, Topbar, ContextPanel, SplitPane
├── lib/            # firebase.js, queryClient
├── routes/         # AppRoutes, ProtectedRoute
├── services/       # apiClient, pushNotifications
├── theme/          # Chakra theme, theme provider
├── test/           # Vitest setup
├── App.jsx
├── main.jsx
└── index.css
```

## Key frontend behavior

- **API access** goes through `src/services/apiClient.js`, which attaches the
  current Firebase ID token to every request and normalizes errors as
  `error.status`, `error.code`, and `error.details`.
- **Real-time messages** use `useChannelEvents`, an SSE connection to
  `/api/v1/channels/:channelId/events` with reconnect/backoff and a visible
  connection status.
- **Theme** is controlled by `ThemeProvider`, which resolves the saved
  `workstation-theme` value, falls back to the system preference, applies the
  `dark` class for Tailwind, and persists changes. `ColorModeScript` prevents a
  flash of the wrong theme on first paint.
- **Push notifications** are registered only after the user grants browser
  permission and has push enabled in notification preferences.

## Production build

```bash
# Frontend/.env.production.local
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=workshop-111f1.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=workshop-111f1
VITE_FIREBASE_STORAGE_BUCKET=workshop-111f1.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
VITE_USE_FIREBASE_EMULATOR=false
VITE_API_BASE=/api/v1
```

```bash
npm ci
npm run build
```

Deploy from the repository root with `firebase deploy --only hosting`; Hosting
serves `Frontend/dist` and rewrites `/api/**` to Cloud Run. See
[`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) for the complete procedure.

## Testing

Vitest runs in jsdom with React Testing Library and jest-dom. Tests cover
routing/auth guards, theme persistence, responsive layout behavior, sign-in
validation, password reset, token verification, and SSE stream states. Firebase
and the API are mocked in these tests; browser end-to-end testing is not part of
the current suite.
