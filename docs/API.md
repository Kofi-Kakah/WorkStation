# API Reference

The WorkStation API is a versioned REST API served by the Express backend in
`Backend/`. All application routes are mounted under `/api/v1`; health probes
are unversioned under `/api`.

- **Local base URL:** `http://localhost:4000`
- **Production base URL:** `https://<hosting-domain>` (Firebase Hosting rewrites
  `/api/**` to the Cloud Run service) or the Cloud Run URL directly.
- **Content type:** JSON unless stated otherwise. Attachment uploads use
  `application/octet-stream`.

## Authentication

Every route except `POST /api/v1/auth/register`, the password-reset routes, and
the health probes requires a Firebase ID token:

```http
Authorization: Bearer <firebase-id-token>
```

The backend verifies the token with the Firebase Admin SDK, derives the user ID
from the verified token, and never accepts a client-supplied UID as identity.
Verified tokens are cached in process memory for `AUTH_TOKEN_CACHE_MS`
(default 60 000 ms); revocations take effect within that window.

The frontend signs in with the Firebase client SDK, then calls
`POST /api/v1/auth/verify` to ensure a Firestore profile exists before loading
workspace data.

## Response conventions

- Successful responses are JSON objects. Most include `ok: true`; resource
  endpoints return the resource at a named key (for example `{ "ok": true,
  "workspace": { ... } }`).
- Errors use one shape:

```json
{
  "error": "Human-readable message",
  "code": "MACHINE_READABLE_CODE",
  "details": [{ "path": "field", "message": "Why it failed" }]
}
```

`details` is present only for validation failures.

| Status | Typical codes |
|---|---|
| 400 | `VALIDATION_ERROR`, `INVALID_JSON`, `INVALID_ARGUMENT` |
| 401 | `UNAUTHORIZED`, `ID_TOKEN_EXPIRED`, `ID_TOKEN_REVOKED` |
| 403 | `FORBIDDEN`, `PERMISSION_DENIED` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` |
| 410 | `FIREBASE_AUTH_REQUIRED` (removed login endpoint) |
| 413 | `PAYLOAD_TOO_LARGE` |
| 429 | `RATE_LIMITED`, `TOO_MANY_STREAMS` |
| 500 | `INTERNAL_ERROR` |
| 503 | `SERVICE_UNAVAILABLE` (readiness probe or transient Firebase failure) |

Unknown errors never return stack traces or Firebase internals.

## Rate limits

Limits are enforced per backend instance. Standard `RateLimit-*` headers are
returned.

| Scope | Limit |
|---|---|
| All `/api/` routes | `RATE_LIMIT_MAX` requests per `RATE_LIMIT_WINDOW_MS` (default 300 per 15 min per IP) |
| `/api/v1/auth/` | 20 requests per 15 min per IP |
| `PUT /channels/:channelId/uploads` | 30 uploads per minute per authenticated user |
| SSE `GET /channels/:channelId/events` | 5 concurrent streams per user |

## Roles

Workspace roles: `owner`, `admin`, `project_manager`, `member`, `guest`.
Project membership additionally carries `project_manager` or `member`.
Authorization is always evaluated server-side by the centralized permission
service.

## Pagination

- Messages: `limit` (1-100, default 50) and `before=<messageId>` for older
  pages. Thread replies use `parentMessageId`.
- Notifications: `limit` (1-50, default 20), `cursor=<notificationId>`,
  `unreadOnly=true|false`. Responses include `items`, `unreadCount`, `hasMore`,
  and `nextCursor`.
- Activities: `limit` (1-50, default 20) and `cursor=<activityId>`.
- Lists such as boards, projects, and workspaces are bounded by design and
  returned in full for the requested workspace/project.

---

## Health

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness. Does not touch Firebase. Returns `{ status, uptime, timestamp }`. |
| GET | `/api/health/ready` | Readiness. Verifies Firestore, Auth, and Storage initialization. Returns 503 when degraded. |

## Authentication

| Method | Path | Auth | Body / notes |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | `{ email, password, displayName? }`. Creates the Firebase user and returns a custom token. |
| POST | `/api/v1/auth/login` | Public | Removed. Always returns 410 `FIREBASE_AUTH_REQUIRED`; sign in with the Firebase client SDK. |
| POST | `/api/v1/auth/password-reset/request` | Public | `{ email }`. Does not reveal whether the account exists. The reset link is returned only outside production. |
| POST | `/api/v1/auth/password-reset/confirm` | Public | `{ oobCode, newPassword }`. |
| POST | `/api/v1/auth/verify` | Public | `{ idToken }`. Verifies the token and creates/returns the Firestore profile. |
| POST | `/api/v1/auth/logout` | Public | No server session exists; the client discards its token. |
| GET | `/api/v1/auth/me` | Bearer | Returns the authenticated user and profile. |

## Users

| Method | Path | Body / notes |
|---|---|---|
| GET | `/api/v1/users/me` | Authenticated profile. |
| PATCH | `/api/v1/users/me` | `{ displayName?, bio?, avatarUrl?, timezone?, locale?, notificationPreferences?: { email?, inApp?, push? } }`. |
| GET | `/api/v1/users/:userId` | Profile of a user who shares a workspace. |

## Workspaces

| Method | Path | Body / notes |
|---|---|---|
| GET | `/api/v1/workspaces` | Workspaces the caller belongs to. |
| POST | `/api/v1/workspaces` | `{ name, description? }`. Caller becomes owner. |
| GET | `/api/v1/workspaces/:workspaceId` | Workspace with `memberRole`. |
| PATCH | `/api/v1/workspaces/:workspaceId` | `{ name?, description? }`. Owner/admin only. |
| GET | `/api/v1/workspaces/:workspaceId/members` | Member list. |
| PATCH | `/api/v1/workspaces/:workspaceId/members/:userId` | `{ role: "admin" \| "project_manager" \| "member" \| "guest" }`. Ownership changes are not allowed through this route. |
| DELETE | `/api/v1/workspaces/:workspaceId/members/:userId` | Remove a member. |
| GET | `/api/v1/workspaces/:workspaceId/invitations` | Pending/all invitations. Owner/admin only. |
| POST | `/api/v1/workspaces/:workspaceId/invitations` | `{ email, role? }`. Returns the invitation including its share token. |

## Invitations

| Method | Path | Body / notes |
|---|---|---|
| POST | `/api/v1/invitations/:token/accept` | Token is 40-100 characters. The authenticated user's email must match the invitation. |
| POST | `/api/v1/invitations/:token/reject` | Same constraints as accept. |

Invitation tokens are stored only as SHA-256 hashes in
`invitations/{tokenHash}` and expire after 7 days.

## Projects

| Method | Path | Body / notes |
|---|---|---|
| GET | `/api/v1/projects?workspaceId=...` | Projects visible to the caller. Guest access is limited to explicit project membership. |
| POST | `/api/v1/projects` | `{ workspaceId, name, description?, visibility?: "workspace" \| "restricted" }`. |
| GET | `/api/v1/projects/:projectId` | Project details. |
| PATCH | `/api/v1/projects/:projectId` | `{ name?, description?, visibility? }`. |
| DELETE | `/api/v1/projects/:projectId` | Delete when authorized. |
| PATCH | `/api/v1/projects/:projectId/archive` | Archive/unarchive the project. |
| GET | `/api/v1/projects/:projectId/members` | Project members. |
| POST | `/api/v1/projects/:projectId/members` | `{ userId, role?: "project_manager" \| "member" }`. |
| DELETE | `/api/v1/projects/:projectId/members/:userId` | Remove a project member. |

Projects receive a generated `key` (for issue keys such as `PROJ-A1B2C3`).

## Channels and conversations

Channels and direct/group conversations share the same record shape; `type` is
`channel`, `direct`, or `group`.

| Method | Path | Body / notes |
|---|---|---|
| GET | `/api/v1/channels?workspaceId=...` | Channels the caller can see (public channels plus joined private channels). |
| POST | `/api/v1/channels` | `{ workspaceId, name, topic?, visibility?: "public" \| "private", memberIds? }`. |
| GET | `/api/v1/channels/conversations?workspaceId=...` | Direct and group conversations for the caller. |
| POST | `/api/v1/channels/conversations` | `{ workspaceId, memberIds, name? }`. Idempotent for the same member set. |
| POST | `/api/v1/channels/:channelId/join` | Join a public channel. |
| GET | `/api/v1/channels/:channelId/members` | Conversation members. |
| POST | `/api/v1/channels/:channelId/members` | `{ userId }`. Requires membership to add another workspace member. |
| DELETE | `/api/v1/channels/:channelId/members/:userId` | Remove a member. |
| POST | `/api/v1/channels/:channelId/presence` | `{ isTyping? }`. Heartbeat/typing update; call periodically (for example every 20 s). |
| POST | `/api/v1/channels/:channelId/read` | `{ messageId? }`. Advances the caller's read cursor. |
| GET | `/api/v1/channels/:channelId` | Channel details. |
| PATCH | `/api/v1/channels/:channelId` | `{ name?, topic?, archived? }`. |

Private channels and conversations require membership. Authorization never
relies on the client hiding a UI element.

## Messages

| Method | Path | Body / notes |
|---|---|---|
| GET | `/api/v1/channels/:channelId/messages` | `limit`, `before`, `parentMessageId?`. Newest first; thread replies excluded unless `parentMessageId` is set. |
| GET | `/api/v1/channels/:channelId/messages/:messageId` | Single message. |
| POST | `/api/v1/channels/:channelId/messages` | `{ content?, parentMessageId?, mentions?, attachmentIds? }`. Content max 8 000 chars; at least content or one attachment is required. |
| PATCH | `/api/v1/channels/:channelId/messages/:messageId` | `{ content, mentions? }`. Author only. |
| DELETE | `/api/v1/channels/:channelId/messages/:messageId` | Soft-delete. Author or moderator. |
| POST | `/api/v1/channels/:channelId/messages/:messageId/reactions` | `{ emoji }`, one of `👍 ❤️ 😂 🎉 👀 🙏`. Toggles the reaction. |
| GET | `/api/v1/messages/search?channelId=...&query=...&limit=...` | Searches one accessible conversation (query 2-100 chars, limit 1-50). |

Mentions must reference members of the same conversation. Attachment IDs must
belong to the same channel and to the uploading user.

## Real-time message events (SSE)

```http
GET /api/v1/channels/:channelId/events
Authorization: Bearer <token>
Accept: text/event-stream
```

- Requires channel membership.
- `event: ready` is sent immediately after the stream opens.
- `event: messages.updated` is sent when messages, reactions, or read state
  change; clients should refetch or reconcile the message list.
- `event: stream.error` indicates the listener failed and the stream closed.
- A `: keep-alive` comment is written every 25 seconds.
- A sixth concurrent stream for the same user returns 429 `TOO_MANY_STREAMS`.

The client must reconnect with backoff if the stream closes. The frontend hook
`useChannelEvents` implements this.

## Attachments

```http
PUT /api/v1/channels/:channelId/uploads
Authorization: Bearer <token>
Content-Type: application/octet-stream
X-File-Name: <URL-encoded file name>
X-File-Type: <MIME type>
```

- Body is the raw file, maximum 10 MB.
- Allowed types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`,
  `application/pdf`, `text/plain`. Magic bytes are validated, not just the
  header.
- The server generates the attachment ID; clients cannot choose it.
- Returns `201 { ok: true, attachment: { id, name, mimeType, size } }`.
- Attach the returned ID via `attachmentIds` when sending a message.
- Downloads are returned as signed URLs valid for 5 minutes after an
  authorization check; objects are never public.

## Boards

A board belongs to a project. Cards are references to canonical issues; a card
stores only placement (`listId`, `position`). Lists map to workflow statuses.

| Method | Path | Body / notes |
|---|---|---|
| GET | `/api/v1/boards?projectId=...` | Boards for a project. |
| POST | `/api/v1/boards` | `{ projectId, name, description? }`. Creates five default lists. |
| GET | `/api/v1/boards/:boardId` | Board with lists and cards (each card includes its issue when accessible). |
| PATCH | `/api/v1/boards/:boardId` | `{ name?, description? }`. |
| DELETE | `/api/v1/boards/:boardId` | Archive the board. |
| POST | `/api/v1/boards/:boardId/lists` | `{ name, issueStatus }`, where status is `backlog`, `todo`, `in_progress`, `in_review`, or `done`. |
| POST | `/api/v1/boards/:boardId/lists/reorder` | `{ listIds }` in the new order. |
| PATCH | `/api/v1/boards/:boardId/lists/:listId` | `{ name?, issueStatus? }`. |
| DELETE | `/api/v1/boards/:boardId/lists/:listId` | Delete an empty list. |
| POST | `/api/v1/boards/:boardId/cards` | `{ issueId, listId }`. The issue must belong to the board's project. |
| PATCH | `/api/v1/boards/:boardId/cards/:cardId/move` | `{ listId, position }` (integer 0-400). Status syncs transactionally. |
| DELETE | `/api/v1/boards/:boardId/cards/:cardId` | Remove the card from the board; the issue is unchanged. |

Limits: 100 lists per board, 400 cards per list, 400 cards per board. Moving a
card into a list updates the issue status; moving an issue's status elsewhere
reconciles its card onto the matching list.

## Issues

Issues are the canonical work records. Types: `epic`, `story`, `task`, `bug`,
`subtask`. Statuses: `backlog`, `todo`, `in_progress`, `in_review`, `done`.
Priorities: `lowest`, `low`, `medium`, `high`, `highest`.

| Method | Path | Body / notes |
|---|---|---|
| GET | `/api/v1/issues?projectId=...` | Filters: `status`, `type`, `priority`, `search`, `assigneeId`, `dueDateFrom`, `dueDateTo`, `sprintId`. |
| POST | `/api/v1/issues` | `{ projectId, title, description?, type?, status?, priority?, assigneeId?, parentIssueId?, labels?, dueDate? }`. |
| GET | `/api/v1/issues/:issueId` | Issue details. |
| PATCH | `/api/v1/issues/:issueId` | Any mutable issue field; at least one field required. |
| PATCH | `/api/v1/issues/:issueId/status` | `{ status }`. Records history, syncs board cards, notifies the assignee. |
| PATCH | `/api/v1/issues/:issueId/assignee` | `{ assigneeId }` or `null`. |
| GET | `/api/v1/issues/:issueId/comments` | Issue comments. |
| POST | `/api/v1/issues/:issueId/comments` | `{ content }`, max 4 000 chars. |

### Saved issue views

| Method | Path | Body / notes |
|---|---|---|
| GET | `/api/v1/issues/views?workspaceId=...` | The caller's saved views. |
| POST | `/api/v1/issues/views` | `{ workspaceId, name, filters }`. Filters are the issue filter fields listed above. |
| DELETE | `/api/v1/issues/views/:viewId?workspaceId=...` | Delete a saved view owned by the caller. |

## Sprints

| Method | Path | Body / notes |
|---|---|---|
| GET | `/api/v1/sprints?projectId=...` | Sprints for a project. |
| POST | `/api/v1/sprints` | `{ projectId, name, goal?, startDate, endDate }` (`YYYY-MM-DD`, end >= start). |
| PATCH | `/api/v1/sprints/:sprintId/status` | `{ status: "planned" \| "active" \| "completed" }`. |
| PUT | `/api/v1/sprints/:sprintId/issues` | `{ issueIds }` (max 100). Issues must belong to the sprint's project. |

## Analytics and search

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/analytics/workspace?workspaceId=...&includeIssues=true` | Workspace counts and project/issue breakdown for members. |
| GET | `/api/v1/search?workspaceId=...&query=...` | Search accessible projects, issues, channels, and recent messages (2-120 chars). Message search is bounded as described in the root README. |

## Cross-module integration

| Method | Path | Body / notes |
|---|---|---|
| POST | `/api/v1/integrations/messages/:messageId/convert-to-issue` | `{ channelId, projectId, title, description?, type?, priority?, assigneeId? }`. Returns `201`, or `200` with `alreadyConverted: true` if the message was already converted. |

The conversion is transactional: it verifies access to the message and the
project, creates the issue, stores `sourceChannelId`/`sourceMessageId` on the
issue, links the issue back onto the message, writes activity, and notifies the
assignee when applicable.

## Notifications

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/notifications` | `limit`, `cursor`, `unreadOnly`. Returns `items`, `unreadCount`, `hasMore`, `nextCursor`. |
| POST | `/api/v1/notifications/:notificationId/read` | Mark one notification as read. Only the owner can. |
| POST | `/api/v1/notifications/read-all` | Mark all as read; returns the updated count. |
| POST | `/api/v1/notifications/devices` | `{ token, userAgent? }`. Registers the calling user's FCM token; requires push enabled. |
| DELETE | `/api/v1/notifications/devices` | `{ token }`. Removes the registration. |

Device tokens are stored under `users/{uid}/devices/{sha256(token)}` and are
never returned by the API. Notification preferences are read from the user
profile (`notificationPreferences.inApp`, `.push`, `.email`).

## Activity

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/activities?workspaceId=...` | Workspace activity feed for current members; `limit`, `cursor`. |

Activity records are scoped to a workspace and are not exposed across
workspace boundaries.

## Complete route index

```text
GET    /api/health
GET    /api/health/ready

POST   /api/v1/auth/register
POST   /api/v1/auth/login                 (410)
POST   /api/v1/auth/password-reset/request
POST   /api/v1/auth/password-reset/confirm
POST   /api/v1/auth/verify
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

GET    /api/v1/users/me
PATCH  /api/v1/users/me
GET    /api/v1/users/:userId

GET    /api/v1/workspaces
POST   /api/v1/workspaces
GET    /api/v1/workspaces/:workspaceId
PATCH  /api/v1/workspaces/:workspaceId
GET    /api/v1/workspaces/:workspaceId/members
PATCH  /api/v1/workspaces/:workspaceId/members/:userId
DELETE /api/v1/workspaces/:workspaceId/members/:userId
GET    /api/v1/workspaces/:workspaceId/invitations
POST   /api/v1/workspaces/:workspaceId/invitations

POST   /api/v1/invitations/:token/accept
POST   /api/v1/invitations/:token/reject

GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/:projectId
PATCH  /api/v1/projects/:projectId
DELETE /api/v1/projects/:projectId
PATCH  /api/v1/projects/:projectId/archive
GET    /api/v1/projects/:projectId/members
POST   /api/v1/projects/:projectId/members
DELETE /api/v1/projects/:projectId/members/:userId

GET    /api/v1/channels
POST   /api/v1/channels
GET    /api/v1/channels/conversations
POST   /api/v1/channels/conversations
POST   /api/v1/channels/:channelId/join
GET    /api/v1/channels/:channelId/members
POST   /api/v1/channels/:channelId/members
DELETE /api/v1/channels/:channelId/members/:userId
POST   /api/v1/channels/:channelId/presence
POST   /api/v1/channels/:channelId/read
GET    /api/v1/channels/:channelId
PATCH  /api/v1/channels/:channelId

GET    /api/v1/channels/:channelId/messages
POST   /api/v1/channels/:channelId/messages
GET    /api/v1/channels/:channelId/messages/:messageId
PATCH  /api/v1/channels/:channelId/messages/:messageId
DELETE /api/v1/channels/:channelId/messages/:messageId
POST   /api/v1/channels/:channelId/messages/:messageId/reactions
GET    /api/v1/channels/:channelId/events
GET    /api/v1/messages/search

PUT    /api/v1/channels/:channelId/uploads

GET    /api/v1/boards
POST   /api/v1/boards
GET    /api/v1/boards/:boardId
PATCH  /api/v1/boards/:boardId
DELETE /api/v1/boards/:boardId
POST   /api/v1/boards/:boardId/lists
POST   /api/v1/boards/:boardId/lists/reorder
PATCH  /api/v1/boards/:boardId/lists/:listId
DELETE /api/v1/boards/:boardId/lists/:listId
POST   /api/v1/boards/:boardId/cards
PATCH  /api/v1/boards/:boardId/cards/:cardId/move
DELETE /api/v1/boards/:boardId/cards/:cardId

GET    /api/v1/issues
POST   /api/v1/issues
GET    /api/v1/issues/views
POST   /api/v1/issues/views
DELETE /api/v1/issues/views/:viewId
GET    /api/v1/issues/:issueId
PATCH  /api/v1/issues/:issueId
PATCH  /api/v1/issues/:issueId/status
PATCH  /api/v1/issues/:issueId/assignee
GET    /api/v1/issues/:issueId/comments
POST   /api/v1/issues/:issueId/comments

GET    /api/v1/sprints
POST   /api/v1/sprints
PATCH  /api/v1/sprints/:sprintId/status
PUT    /api/v1/sprints/:sprintId/issues

GET    /api/v1/analytics/workspace
GET    /api/v1/search

POST   /api/v1/integrations/messages/:messageId/convert-to-issue

GET    /api/v1/notifications
POST   /api/v1/notifications/read-all
POST   /api/v1/notifications/:notificationId/read
POST   /api/v1/notifications/devices
DELETE /api/v1/notifications/devices

GET    /api/v1/activities
```
