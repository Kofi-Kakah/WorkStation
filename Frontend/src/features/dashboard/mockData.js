/**
 * Mock data for visual development (Section 3).
 * Real data will come from Firestore in later sections.
 */

export const mockUser = {
  uid: 'mock-uid-1',
  email: 'alice.chen@acme.com',
  displayName: 'Alice Chen',
  photoURL: null,
  emailVerified: true,
};

export const mockProjects = [
  { id: 'p1', name: 'Mobile App Redesign', key: 'MOBILE', description: 'Revamp the mobile experience', memberCount: 6, issueCount: 24, progress: 62 },
  { id: 'p2', name: 'API Gateway', key: 'API', description: 'New REST gateway service', memberCount: 4, issueCount: 11, progress: 38 },
  { id: 'p3', name: 'Design System', key: 'DS', description: 'Unified component library', memberCount: 3, issueCount: 7, progress: 80 },
];

export const mockBoards = [
  { id: 'b1', name: 'Mobile Roadmap', projectId: 'p1', listCount: 4, cardCount: 18 },
  { id: 'b2', name: 'Sprint 12', projectId: 'p2', listCount: 5, cardCount: 11 },
  { id: 'b3', name: 'Backlog', projectId: 'p3', listCount: 3, cardCount: 7 },
];

export const mockIssues = [
  { id: 'i1', key: 'MOBILE-12', title: 'Implement dark mode toggle', type: 'task', status: 'in_progress', priority: 'high', assignee: 'Marcus Lee', reporter: 'Alice Chen', project: 'Mobile App Redesign' },
  { id: 'i2', key: 'MOBILE-15', title: 'Fix crash on splash screen', type: 'bug', status: 'done', priority: 'highest', assignee: 'Priya Patel', reporter: 'Marcus Lee', project: 'Mobile App Redesign' },
  { id: 'i3', key: 'API-3', title: 'Rate limiting middleware', type: 'task', status: 'todo', priority: 'medium', assignee: null, reporter: 'Alice Chen', project: 'API Gateway' },
  { id: 'i4', key: 'DS-7', title: 'Button component variants', type: 'task', status: 'in_review', priority: 'low', assignee: 'Priya Patel', reporter: 'Priya Patel', project: 'Design System' },
];

export const mockChannels = [
  { id: 'c1', name: 'general', type: 'public', memberCount: 12, unread: 3 },
  { id: 'c2', name: 'random', type: 'public', memberCount: 12, unread: 0 },
  { id: 'c3', name: 'mobile-dev', type: 'private', memberCount: 6, unread: 5 },
  { id: 'c4', name: 'design-review', type: 'private', memberCount: 4, unread: 0 },
];

export const mockNotifications = [
  { id: 'n1', type: 'mention', title: 'Alice mentioned you', body: '@marcus can you review the PR?', time: '5m ago', read: false },
  { id: 'n2', type: 'issue', title: 'MOBILE-15 resolved', body: 'Priya closed the splash-screen bug', time: '1h ago', read: false },
  { id: 'n3', type: 'dm', title: 'New message from Omar', body: 'Hey, are we on for standup?', time: '2h ago', read: true },
  { id: 'n4', type: 'invite', title: 'Workspace invitation', body: 'You were invited to Acme Corp', time: '1d ago', read: true },
];

export const mockActivity = [
  { id: 'a1', actor: 'Alice Chen', action: 'created issue', resource: 'MOBILE-12', time: '10m ago' },
  { id: 'a2', actor: 'Marcus Lee', action: 'moved card', resource: 'Mobile Roadmap', time: '30m ago' },
  { id: 'a3', actor: 'Priya Patel', action: 'updated status', resource: 'DS-7', time: '1h ago' },
];

export default { mockUser, mockProjects, mockBoards, mockIssues, mockChannels, mockNotifications, mockActivity };