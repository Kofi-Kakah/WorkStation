/**
 * Application-wide constants. Keep values here so modules can import them
 * rather than redefining them locally.
 */

// Issue types
export const ISSUE_TYPES = {
  EPIC: 'epic',
  STORY: 'story',
  TASK: 'task',
  BUG: 'bug',
  SUBTASK: 'subtask',
};

// Issue priorities
export const ISSUE_PRIORITIES = {
  LOWEST: 'lowest',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  HIGHEST: 'highest',
};

// Default workflow statuses (ordered). Custom workflows can override.
export const DEFAULT_WORKFLOW_STATUSES = [
  { id: 'backlog', name: 'Backlog', category: 'unstarted' },
  { id: 'todo', name: 'To do', category: 'unstarted' },
  { id: 'in_progress', name: 'In progress', category: 'inprogress' },
  { id: 'in_review', name: 'In review', category: 'inprogress' },
  { id: 'done', name: 'Done', category: 'done' },
];

// Default allowed transitions. Empty array = no restriction (any status).
export const DEFAULT_WORKFLOW_TRANSITIONS = {
  backlog: ['todo', 'in_progress'],
  todo: ['backlog', 'in_progress'],
  in_progress: ['todo', 'in_review'],
  in_review: ['todo', 'in_progress', 'done'],
  done: ['todo', 'in_progress', 'in_review'],
};

// Channel types
export const CHANNEL_TYPES = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  DIRECT: 'direct',
  GROUP: 'group',
};

// Attachment allowed types and size limits
export const ATTACHMENT = {
  MAX_SIZE_BYTES: 25 * 1024 * 1024, // 25 MB
  ALLOWED_TYPES: [
    'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'text/plain', 'text/csv', 'text/markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
};

export const API_VERSION = 'v1';

export default {
  ISSUE_TYPES, ISSUE_PRIORITIES, DEFAULT_WORKFLOW_STATUSES,
  DEFAULT_WORKFLOW_TRANSITIONS, CHANNEL_TYPES, ATTACHMENT, API_VERSION,
};