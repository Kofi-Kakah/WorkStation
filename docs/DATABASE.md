# Database Architecture

WorkStation uses Cloud Firestore as its primary database and Firebase Storage
for binary files. The browser never reads Firestore or Storage directly:
Firestore and Storage security rules deny all client access, and every read or
write goes through the Express API, which verifies a Firebase ID token and
enforces authorization with the Admin SDK.

This document describes the document shapes and access patterns the backend
actually uses. Update it whenever a collection or required index changes.

## Data-model principles

1. **Issues are canonical.** A work item exists once in `issues/{issueId}`.
   Board cards reference it with `issueId` and store only placement data.
2. **Authorization data is relational.** Membership documents
   (`workspaces/{id}/members`, `projects/{id}/members`,
   `channels/{id}/members`) are the source of truth for access. Arrays such as
   `users/{uid}.workspaceIds` exist only to list a user's workspaces quickly and
   are updated in the same transaction as the membership.
3. **Server time only.** Timestamps are written with Firestore
   `serverTimestamp()` (or `Timestamp.fromMillis` for computed expiry).
4. **Bounded lists.** No document grows without limit. Messages, comments,
   notifications, activities, cards, and uploads are separate documents; all
   list endpoints paginate or enforce explicit caps.
5. **Denormalize only what reads need.** `senderName`, `senderAvatarUrl`,
   `actorName`, `issueKey`, and `reactionSummary` are snapshots for rendering;
   the authoritative records remain `users`, `issues`, and reaction documents.
6. **Transactions for invariants.** Multi-document changes that must agree
   (membership + user index, issue status + card placement, sprint assignment,
   invitation acceptance) run in Firestore transactions.

## Collection map

```text
users/{uid}
  notifications/{notificationId}
  devices/{sha256Token}
  savedIssueViews/{viewId}

workspaces/{workspaceId}
  members/{uid}
  activities/{activityId}

invitations/{sha256Token}

projects/{projectId}
  members/{uid}

channels/{channelId}
  members/{uid}
  messages/{messageId}
    reactions/{reactionId}
  uploads/{uploadId}

boards/{boardId}
  lists/{listId}
  cards/{cardId}

issues/{issueId}
  comments/{commentId}

sprints/{sprintId}
```

`channels` holds both channels (`type: "channel"`) and direct/group
conversations (`type: "direct"` or `"group"`). Conversation IDs are derived
from a hash of the workspace and sorted member IDs, so the same member set
resolves to one conversation.

## Document shapes

### `users/{uid}`

```js
{
  uid, email, emailVerified, displayName, bio, avatarUrl,
  timezone, locale,
  role: "member",                 // default platform role
  workspaceIds: ["..."],          // convenience index, membership is authoritative
  notificationPreferences: { email: true, inApp: true, push: true },
  searchLower: "displayname",     // prefix search key
  createdAt, updatedAt
}
```

### `users/{uid}/notifications/{notificationId}`

```js
{
  id, userId, workspaceId, type, title, body,
  resource: { type, id } | null,
  link, actorId, dedupeKey,
  data: {},
  read: false,
  createdAt, updatedAt, readAt
}
```

The document ID is a SHA-256 hash of `dedupeKey` when a key is supplied; this
makes duplicate events idempotent. Notification preferences can suppress the
in-app record, the push attempt, or both.

### `users/{uid}/devices/{sha256Token}`

```js
{ token, userAgent, createdAt, updatedAt }
```

Document IDs are hashes so a raw FCM token is not exposed through Firestore
metadata. Tokens are never returned by the API.

### `users/{uid}/savedIssueViews/{viewId}`

```js
{
  workspaceId, name,
  filters: { projectId?, status?, type?, priority?, assigneeId?,
             dueDateFrom?, dueDateTo?, search?, sprintId? },
  createdAt, updatedAt
}
```

### `workspaces/{workspaceId}`

```js
{
  name, description,
  slug: "name-abcdef",
  ownerId,
  createdAt, updatedAt
}
```

### `workspaces/{workspaceId}/members/{uid}`

```js
{ userId, role: "owner" | "admin" | "project_manager" | "member" | "guest",
  invitedBy?, joinedAt }
```

### `workspaces/{workspaceId}/activities/{activityId}`

```js
{
  id, workspaceId, actorId, actorName,
  action: "issue.created" | "card.moved" | "...",
  resource: { type, id, key? } | null,
  context: {},
  createdAt
}
```

### `invitations/{sha256Token}`

```js
{
  workspaceId, email, role: "project_manager" | "member" | "guest",
  invitedBy, status: "pending" | "accepted" | "rejected" | "expired",
  tokenHash, expiresAt, createdAt, updatedAt
}
```

Invitation documents live at the top level and are addressed by token hash, so
listing invitations for a workspace requires knowing which documents belong to
it; the backend validates workspace access before creating or listing them.

### `projects/{projectId}`

```js
{
  workspaceId, name,
  key: "PROJ-A1B2C3",            // prefix used by issue keys
  description,
  visibility: "workspace" | "restricted",
  status: "active",
  createdBy, createdAt, updatedAt
}
```

### `projects/{projectId}/members/{uid}`

```js
{ userId, role: "project_manager" | "member", addedBy, joinedAt }
```

### `channels/{channelId}`

```js
{
  workspaceId,
  type: "channel" | "direct" | "group",
  name, topic?, visibility: "public" | "private",
  archived: false,
  createdBy, createdAt, updatedAt, lastMessageAt
}
```

### `channels/{channelId}/members/{uid}`

```js
{ userId, joinedAt, lastReadAt, lastReadMessageId?, lastSeenAt?, typingExpiresAt? }
```

`lastReadAt` is the per-user read cursor; unread state is derived from it rather
than writing a receipt per message. Typing indicators expire after about seven
seconds (`typingExpiresAt`).

### `channels/{channelId}/messages/{messageId}`

```js
{
  content, senderId, senderName, senderAvatarUrl,
  parentMessageId: null | "...",
  mentions: ["uid"],
  attachmentIds: ["..."],
  reactionSummary: [{ emoji, count }],
  isEdited: false,
  isDeleted: false,
  issueId?: "...",               // set by message-to-issue conversion
  createdAt, updatedAt
}
```

Thread replies carry the root message ID in `parentMessageId`. Nesting deeper
than one level is rejected. Soft deletion keeps the record for thread
integrity; queries filter `isDeleted`.

### `channels/{channelId}/messages/{messageId}/reactions/{reactionId}`

```js
{ userId, emoji, createdAt }
```

`reactionId` is derived from the user and emoji. The message's
`reactionSummary` is updated in the same transaction.

### `channels/{channelId}/uploads/{uploadId}`

```js
{
  id, name, mimeType, size,
  storagePath: "channels/{channelId}/{uploadId}",
  uploadedBy, createdAt
}
```

The companion Storage object is stored at `storagePath` with metadata
`{ channelId, uploadedBy }`. Signed download URLs are generated only after a
channel access check and expire after five minutes.

### `boards/{boardId}`

```js
{ projectId, name, description, archived: false, createdBy, createdAt, updatedAt }
```

New boards receive five lists: Backlog, To do, In progress, In review, Done.

### `boards/{boardId}/lists/{listId}`

```js
{ name, issueStatus: "backlog" | "todo" | "in_progress" | "in_review" | "done",
  position, createdBy, createdAt, updatedAt }
```

### `boards/{boardId}/cards/{cardId}`

```js
{ issueId, listId, position, createdBy, createdAt, updatedAt }
```

Card IDs are deterministic from the board and issue, preventing the same issue
from appearing twice on one board. `position` is an integer using a gap of 1024;
when no gap remains, the backend renumbers the affected list transactionally.

### `issues/{issueId}`

```js
{
  projectId, workspaceId, issueKey: "PROJ-A1B2C3",
  title, description,
  type: "epic" | "story" | "task" | "bug" | "subtask",
  status: "backlog" | "todo" | "in_progress" | "in_review" | "done",
  priority: "lowest" | "low" | "medium" | "high" | "highest",
  assigneeId: null | "uid",
  reporterId, createdBy,
  labels: [],
  dueDate: null | "YYYY-MM-DD",
  sprintId: null | "...",
  parentIssueId: null | "...",
  relatedIssueIds: [],
  sourceChannelId: null | "...",
  sourceMessageId: null | "...",
  sourceConversationType: null | "channel" | "direct" | "group",
  createdAt, updatedAt, resolvedAt
}
```

`resolvedAt` is set when status becomes `done`. Status changes record activity,
synchronize board cards, and notify the assignee when appropriate.

### `issues/{issueId}/comments/{commentId}`

```js
{ id, issueId, authorId, content, createdAt, updatedAt }
```

### `sprints/{sprintId}`

```js
{
  projectId, workspaceId, name, goal,
  startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD",
  status: "planned" | "active" | "completed",
  createdBy, createdAt, updatedAt
}
```

Sprint assignment writes `issues/{issueId}.sprintId` inside a transaction that
verifies the issue belongs to the sprint's project.

## Required composite indexes

`firestore.indexes.json` defines the composite indexes used by the API. Without
them, the corresponding queries fail in production.

| Collection group | Fields | Used by |
|---|---|---|
| `notifications` | `read` ASC, `createdAt` DESC | Unread notification list |
| `notifications` | `read` ASC, `createdAt` ASC | Batched mark-all-read |
| `messages` | `parentMessageId` ASC, `createdAt` ASC | Thread pagination |
| `messages` | `parentMessageId` ASC, `createdAt` DESC | Thread pagination (reverse) |
| `cards` | `listId` ASC, `position` ASC | Card ordering / move |
| `cards` | `listId` ASC, `position` DESC | Card ordering / move (reverse) |

Deploy with:

```bash
firebase deploy --only firestore:indexes
```

Single-field indexes are created automatically by Firestore.

## Query and scan limits

These bounds are intentional and enforced in code:

- Message pagination: `limit` 1-100 (default 50).
- Message search in one conversation: latest 100 messages per conversation.
- Workspace message search: at most 25 conversations, 100 messages each
  (2,500 documents per request), and the UI flags possibly incomplete results.
- Notification lists: 1-50 per page; mark-all-read processes 400 at a time.
- Boards: 100 lists per board, 400 cards per list, 400 cards per board.
- Message payload: 8,000 characters; 20 mentions; 10 attachments.
- Attachments: 10 MB each; allowlisted MIME types only.
- Sprints: 100 issue assignments per request.
- SSE: 5 concurrent streams per user; 25-second heartbeat.

## Deletion and archival

- Messages: soft delete (`isDeleted`) to preserve threads and audit context.
- Boards: archived (`archived: true`) rather than physically removed when the
  archive endpoint is used.
- Boards/lists: a list cannot be deleted while it contains cards; a card can be
  removed without deleting its issue.
- Projects: archive is available; hard deletion is restricted to authorized
  roles and validated server-side.
- Workspaces: hard deletion is owner-only. Firestore does not cascade
  subcollections; a production deletion workflow must remove subcollections
  explicitly (see Known issues in `HANDOVER.md`).
- Attachments: metadata lives in `channels/{id}/uploads`; binary objects live
  in Storage. Removing a message does not automatically delete its objects.

## Emulator data

Local development uses the Firebase Emulator Suite. Data is in memory by
default and disappears when the emulator stops. The backend connects when
`FIREBASE_USE_EMULATOR=true`; the frontend connects when
`VITE_USE_FIREBASE_EMULATOR=true`. Never copy local emulator data into
production.

## Security rules

`firestore.rules` and `storage.rules` deny all direct client access. This is
not a placeholder: it is the production rule set. All access is mediated by
Express, which applies workspace, project, channel, and role checks. Changing
these rules to allow client reads requires a complete per-collection rules
design and test coverage.
