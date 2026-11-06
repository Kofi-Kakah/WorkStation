# WorkStation Frontend

React 19 + Vite single-page application for the WorkStation collaboration
platform. It combines Slack-style messaging, Trello-style Kanban boards, and
Jira-style issue tracking in one workspace, plus an Overview and a unified
activity ("Pulse") view.

The current UI is a self-contained **WorkStation demo workspace** (`src/workstation`)
with a dark, hairline-and-ember design language. It runs without Firebase or the
Express API: state is seeded, kept in React, and persisted to `localStorage`.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
```

No environment variables are required for the demo workspace. The dev server
binds to `0.0.0.0` so it also works behind a preview proxy.

## Routes

| Path | Module | What it does |
|---|---|---|
| `/` | Overview | Hero, live stats, sprint burndown, my focus, unified activity, module sync |
| `/boards` | Trello-style | Drag-and-drop Kanban; moving a card updates the linked issue |
| `/issues` | Jira-style | Sprint header, filters, grouped workflow list, full issue detail drawer |
| `/channels` | Slack-style | Channels + DMs, threads, reactions, message → issue capture |
| `/pulse` | Cross-module | Unified event stream, module bridge toggles, shortcuts |

Keyboard: `⌘K` command palette, `c` create issue, `g` then `b` / `i` / `c` / `p`
to jump between modules, `Esc` to close overlays.

Demo data is stored under the `workstation.demo.v2` localStorage key. Use
**Reset demo data** in the workspace menu (bottom-left) or on Pulse to restore
the seed state.

## Design system

Visual language: near-black surfaces, 1px hairlines, corner bracket details,
ember-red glow for state that matters, an isometric "three systems" scene, and a
mono-first instrumentation feel.

- Tokens and component classes live in `src/workstation/styles/workstation.css`
  (`--vg-*` variables, `.ws-*` classes). The legacy token set in `index.css` is
  untouched.
- Type: **Chakra Petch** for display, **JetBrains Mono** for UI and data
  (self-hosted via `@fontsource`).
- Surfaces use cursor spotlights (`.ws-spot`), staggered entrance motion, and a
  marquee ticker; all motion is disabled under `prefers-reduced-motion`.

## Structure

```text
src/
├── workstation/          # The WorkStation app (routed experience)
│   ├── components/       # Shell, CommandPalette, IssueDrawer, CreateIssueModal, ui primitives
│   ├── data/seed.js      # People, projects, issues, boards, channels, activity
│   ├── lib/              # format helpers, spotlight hook
│   ├── pages/            # Overview, Boards, Issues, Channels, Pulse
│   ├── store/            # workspace reducer/provider, overlay state, hooks
│   ├── styles/           # design tokens + .ws-* component CSS
│   ├── WorkstationApp.jsx
│   └── __tests__/        # shell smoke tests + cross-module sync tests
├── components/           # v1 primitives (Chakra) — see "Legacy console" below
├── contexts/             # Firebase auth and profile context (v1)
├── features/             # v1 screens: auth, dashboard, projects, chat, boards, issues…
├── layouts/              # MainLayout + navigation (v1)
├── routes/               # AppRoutes (v1)
├── services/             # apiClient (v1)
├── theme/                # Chakra theme + theme provider (v1)
├── App.jsx               # Router + WorkstationApp
├── main.jsx              # Fonts, global CSS, mount
└── index.css             # Tailwind reset + legacy tokens
```

## One record, three surfaces

Per the platform architecture, an **issue is the single source of truth**:

- A board card is not a copy — it is the issue rendered in a workflow column.
  Dragging a card dispatches a workflow change and the issue's status updates.
- A Slack message can be captured as an issue (`Bug` icon in the message hover
  toolbar); the issue stores `slackChannelId` / `slackMessageId` and the channel
  receives a confirmation reply.
- The issue drawer links back to the board and the originating thread, and every
  change writes to the shared activity feed.

The demo store (`src/workstation/store/WorkspaceProvider.jsx`) implements these
transitions as a reducer, which is where a real API would be wired in.

## Legacy console (v1)

`src/features`, `src/layouts`, `src/routes`, `src/contexts`, `src/services`,
`src/theme`, and the Chakra primitives under `src/components` are the earlier
backend-connected screens (Firebase Auth + `/api/v1`). They are **preserved but
not routed** by the new app: `App.jsx` mounts only the WorkStation experience.
Their unit tests still run and pass.

To integrate them again, mount `src/routes/AppRoutes.jsx` inside the Chakra +
`AuthProvider` + `ThemeProvider` tree (see git history) and configure the
`.env.example` Firebase values.

## Stack

- React 19, React Router 7, Vite 8, Tailwind CSS 4 (`@tailwindcss/vite`)
- dnd-kit (boards), Lucide React icons, `@fontsource` Chakra Petch + JetBrains Mono
- Chakra UI 2.10 remains installed for the legacy console screens
- JavaScript only: no TypeScript source or configuration

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run test` | Vitest + React Testing Library |
| `npm run test:watch` | Watch mode |

## Testing

Vitest runs in jsdom with React Testing Library and jest-dom. The suite covers
the WorkStation shell (overview, boards, issues, channels render), cross-module
sync in the store (card move → issue status, Slack capture → new issue), plus
the existing routing/auth, theme, and primitive tests. Firebase and the API are
mocked where the legacy screens are exercised; browser end-to-end testing is not
part of the current suite.

## Production build

```bash
npm run build
```

Deploy from the repository root with `firebase deploy --only hosting`; Hosting
serves `Frontend/dist`. See [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md).
