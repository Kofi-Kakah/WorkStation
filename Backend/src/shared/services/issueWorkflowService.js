export const ISSUE_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
];

const STATUS_BY_LIST_NAME = new Map([
  ["backlog", "backlog"],
  ["to do", "todo"],
  ["todo", "todo"],
  ["in progress", "in_progress"],
  ["in review", "in_review"],
  ["done", "done"],
]);

export function normalizeIssueStatus(status) {
  return ISSUE_STATUSES.includes(status) ? status : "backlog";
}

export function statusForBoardList(list) {
  if (ISSUE_STATUSES.includes(list.issueStatus)) return list.issueStatus;
  return STATUS_BY_LIST_NAME.get(list.name.trim().toLowerCase()) || null;
}
