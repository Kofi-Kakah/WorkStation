# Project records and access

Projects are stored in the top-level `projects` collection so project queries
can be scoped by `workspaceId`. A project document contains:

```text
workspaceId, name, key, description, visibility, status,
createdBy, createdAt, updatedAt
```

`visibility` is `workspace` or `restricted`; `status` is `active`, `archived`,
or `deleted`. Archive and delete operations retain a tombstone rather than
removing documents and leaving orphaned Firestore subcollections.

Project membership is stored at
`projects/{projectId}/members/{userId}` with `userId`, `role`
(`project_manager` or `member`), `addedBy`, and `joinedAt`. The creator is
added as the first project manager. A workspace membership is required for
every project operation; restricted projects additionally require project
membership unless the actor is a workspace owner or admin.

The project list query filters `projects` by `workspaceId`, then checks
restricted-project membership before returning results. Workspace invitation
records are stored in the top-level `invitations` collection. Their document
ID is a SHA-256 token hash; the plaintext token is only returned once when an
authorized workspace administrator creates the invitation. Invitations expire
after seven days and acceptance atomically writes the workspace membership,
user workspace index, and invitation response.
