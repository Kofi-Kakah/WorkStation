# Project boards

## Firestore records

- `boards/{boardId}` references its project and stores the board name,
  description, archive state, and audit timestamps.
- `boards/{boardId}/lists/{listId}` stores a list name and its ordering rank.
- `boards/{boardId}/cards/{cardId}` is a board placement only. It stores the
  canonical `issueId`, list ID, and ordering rank. It does not duplicate issue
  title, status, description, labels, or assignee data.
- The board API resolves issue references from `issues/{issueId}` and only
  returns details for issues belonging to the board's project.

The board repository uses stable integer ordering ranks with gaps. Moving a
card is transactional; if a rank gap is exhausted, the target list is
renumbered in that transaction. Lists are also reordered transactionally.
Lists are limited to 100 and boards to 400 issue placements. This bounds board
reads and keeps Firestore transaction writes below its limit.

## Authorization

Every request verifies workspace membership through the owning project.
Restricted projects remain restricted. Workspace administrators and project
managers can manage boards and lists; authorized project members can place,
move, or remove issue references. Deleting a list containing cards is rejected,
and deleting a board archives it without deleting its placements or issues.

## Current scope boundary

Issue creation, search, comments, checklists, attachment management, and
workflow synchronization are part of later sections. A card cannot create a
separate work record; it can only reference an existing issue in the same
project. The board screen currently accepts an issue ID when placing an issue.
