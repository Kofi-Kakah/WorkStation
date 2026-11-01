# MASTER DEVELOPMENT INSTRUCTIONS — UNIFIED COLLABORATION & PROJECT MANAGEMENT PLATFORM

## 1. YOUR ROLE AND PRIMARY OBJECTIVE

You are the lead software architect, senior full-stack JavaScript developer, UI/UX designer, database architect, and quality assurance engineer responsible for building a professional, production-oriented SaaS application.

You are building a unified collaboration and project management platform that combines the most useful functionality of:

- Slack — team communication and real-time messaging.
- Trello — visual project organization and Kanban boards.
- Jira — professional issue tracking, workflows, and project management.

These must not be three disconnected applications placed inside one interface.

Your responsibility is to build ONE cohesive platform where communication, project organization, and issue tracking work together through shared workspaces, users, projects, permissions, notifications, and data.

The application must have a professional, modern, polished interface with a liquid-glass visual language, responsive layouts, light mode, and dark mode.

You must follow every instruction in this document.

---

# 2. CRITICAL DEVELOPMENT RULE: SECTION-BY-SECTION APPROVAL

THIS IS THE MOST IMPORTANT INSTRUCTION IN THIS DOCUMENT.

You MUST develop this application in clearly separated implementation sections.

You are NOT authorized to implement the entire application at once.

You must complete only ONE section at a time.

After completing a section:

1. Explain what you implemented.
2. List every file you created.
3. List every existing file you modified.
4. Explain the architecture and important implementation decisions.
5. Explain how I can run and test the implementation.
6. Report any errors, limitations, or unfinished work.
7. Confirm that the section is complete.
8. STOP WORKING.
9. Wait for my explicit approval before beginning the next section.

Do not automatically continue to the next section.

Do not assume that silence means approval.

Do not interpret a request to fix something in the current section as approval to start the next section.

If I request modifications, make only those modifications and wait for approval again.

Only proceed when I explicitly tell you something equivalent to:

- Approved. Continue.
- Proceed to the next section.
- Section approved.
- Move on to the next phase.

If I reject an implementation, correct it before requesting approval again.

## Approval checkpoints

Follow this exact sequence:

| Section | Development stage |
|---|---|
| 1 | Project inspection and architecture planning |
| 2 | Environment setup and project foundation |
| 3 | Design system and application shell |
| 4 | Firebase configuration and authentication |
| 5 | User profiles and workspace management |
| 6 | Projects, teams, and invitations |
| 7 | Slack-style communication |
| 8 | Trello-style Kanban boards |
| 9 | Jira-style issue management |
| 10 | Cross-module integrations |
| 11 | Notifications and activity system |
| 12 | Advanced productivity features |
| 13 | Security and performance |
| 14 | Testing and quality assurance |
| 15 | Production deployment and documentation |

You must never skip an approval checkpoint.

---

# 3. TECHNOLOGY STACK — STRICT REQUIREMENTS

Use the following technologies.

## Frontend

- React
- Vite
- JavaScript (ES6+)
- JSX
- React Router
- Chakra UI
- Tailwind CSS
- Lucide React icons
- TanStack Query for API state and caching
- Firebase JavaScript SDK
- A suitable React drag-and-drop library for Kanban functionality

## Backend

- Node.js
- Express.js
- JavaScript (ES Modules)
- Firebase Admin SDK
- Cloud Firestore
- Zod for request validation
- Helmet for HTTP security headers
- CORS
- Express rate limiting
- A suitable logging solution

## Firebase services

- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Cloud Messaging
- Firebase Emulator Suite for local development

## Testing

- Vitest
- Supertest
- React Testing Library
- Firebase Emulator Suite

## Deployment

- React frontend: Firebase Hosting or another suitable static hosting platform.
- Express backend: Google Cloud Run.
- Database: Cloud Firestore.
- File storage: Firebase Storage.

## Strict language rules

THE ENTIRE APPLICATION MUST BE WRITTEN IN JAVASCRIPT.

Do not use TypeScript.

Do not create:

- `.ts`
- `.tsx`
- `tsconfig.json`
- TypeScript interfaces
- TypeScript type declarations

Use:

- `.js`
- `.jsx`
- JavaScript ES modules
- JSDoc comments when additional documentation of data structures is useful.

Do not introduce another programming language into the application's source code.

Configuration files must use formats supported by the respective tools.

---

# 4. PRODUCT VISION AND APPLICATION IDENTITY

The application is a unified workspace for teams, developers, companies, project managers, and organizations.

It should provide one environment where users can:

1. Communicate with team members.
2. Create projects and organize work.
3. Manage tasks and bugs.
4. Track project progress.
5. Collaborate through discussions.
6. Assign responsibilities.
7. Monitor deadlines.
8. Share files.
9. Receive notifications.
10. Track team activities.

## Three major product experiences

### A. Communication module — Slack-inspired

Users should be able to:

- Create channels.
- Join channels.
- Create private channels.
- Send direct messages.
- Create group conversations.
- Send real-time messages.
- Reply to specific messages.
- Create message threads.
- React to messages with emojis.
- Edit messages.
- Delete messages.
- Share files and images.
- Search messages.
- Mention users.
- Mention issues.
- See online status.
- See typing indicators.
- See message timestamps.
- See read receipts.
- Pin important messages.
- Receive notifications.

### B. Project organization module — Trello-inspired

Users should be able to:

- Create boards.
- Rename boards.
- Delete boards.
- Create columns/lists.
- Rename columns.
- Reorder columns.
- Create cards.
- Edit cards.
- Delete cards.
- Drag cards between columns.
- Reorder cards.
- Assign members.
- Add labels.
- Add descriptions.
- Add due dates.
- Create checklists.
- Add comments.
- Upload attachments.
- Track card activity.
- View project progress.

### C. Issue management module — Jira-inspired

Users should be able to:

- Create issues.
- Create tasks.
- Create bugs.
- Create stories.
- Create epics.
- Create subtasks.
- Set priorities.
- Assign issues.
- Set reporters.
- Set issue statuses.
- Create custom workflows.
- Add descriptions.
- Add comments.
- Link related issues.
- Track dependencies.
- Create sprints.
- Manage backlogs.
- Search and filter issues.
- Track issue history.
- View project progress.

---

# 5. CORE ARCHITECTURAL PRINCIPLES

Follow these principles throughout development.

## 5.1 Modular monolithic backend

Build one Express backend organized into independent business modules.

Do not create microservices at the beginning.

Each module must have clearly separated responsibilities.

Examples:

- Authentication
- Users
- Workspaces
- Projects
- Channels
- Messages
- Boards
- Lists
- Cards
- Issues
- Notifications
- Integrations

Modules should communicate through reusable services and clearly defined interfaces.

Avoid placing all application logic in controllers.

## 5.2 Separation of concerns

Use the following structure inside backend modules:

- Routes: define API endpoints.
- Controllers: handle HTTP requests and responses.
- Services: contain business logic.
- Repositories: handle Firestore database operations.
- Validators: validate incoming data.
- Utilities: reusable helper functions.

A controller should not contain complicated business logic.

A React component should not directly implement backend business rules.

## 5.3 Single source of truth

An issue must be the canonical record for a work item.

A Trello-style card should represent an issue on a board.

Do not create independent issue and card records that can contradict one another.

A card should reference an issue using `issueId`.

Board-specific placement information belongs to the card placement, including:

- Board ID
- List ID
- Position
- Display metadata

If an issue changes status, synchronize its board representation.

If a user moves a card to another workflow column, update the corresponding issue status according to the project's configured workflow.

Design this to support an issue appearing on multiple boards if required.

## 5.4 Authorization must be enforced by the backend

Never trust the frontend to enforce permissions.

Every sensitive backend operation must verify:

- The user's identity.
- Workspace membership.
- Project membership where applicable.
- Resource access.
- Role permissions.
- Ownership where applicable.

Firebase Admin SDK bypasses Firestore Security Rules.

Therefore, Express must independently enforce authorization.

## 5.5 Avoid unnecessary duplication

Use shared services for functionality that multiple modules need.

Examples:

- Notification service.
- Activity service.
- Permission service.
- File upload service.
- User lookup service.

Do not duplicate the same logic across controllers.

---

# 6. VISUAL DESIGN SYSTEM

The application's design must be premium, modern, professional, minimal, and visually consistent.

The interface must use a liquid-glass visual style.

The application should feel like a polished modern SaaS product rather than a generic admin dashboard.

## 6.1 Required color palette

Use this exact Amethyst palette throughout the application.

```css
:root {
  --amethyst-50: #ffffff;
  --amethyst-100: #f7ecff;
  --amethyst-200: #efdaff;
  --amethyst-300: #e5c7ff;
  --amethyst-400: #dbb3ff;
  --amethyst-500: #ce97ff;
  --amethyst-600: #bd79ff;
  --amethyst-700: #9660ce;
  --amethyst-800: #694192;
  --amethyst-900: #392053;
  --amethyst-950: #261437;
}
```

Do not replace this palette with unrelated colors.

You may use neutral supporting colors for borders, text, backgrounds, and semantic states.

The Amethyst palette must remain the primary visual identity.

## 6.2 Semantic color usage

Use these roles consistently.

| Purpose | Color |
|---|---|
| Main accent | Amethyst 500 |
| Primary button | Amethyst 600 |
| Primary button hover | Amethyst 700 |
| Light accent background | Amethyst 100 |
| Dark accent background | Amethyst 900 |
| Focus ring | Amethyst 400 |
| Active navigation | Amethyst 100 / 900 |
| Highlight | Amethyst 300 |
| Strong dark accent | Amethyst 950 |
| Glass highlight | White with transparency |
| Glass border | White or neutral with transparency |

Use semantic colors for:

- Success
- Warning
- Error
- Information

Do not use Amethyst for every single element. Preserve visual hierarchy.

## 6.3 Liquid-glass design language

The interface should use a restrained liquid-glass aesthetic.

Apply the effect to appropriate interface elements:

- Sidebar.
- Navigation panels.
- Floating toolbars.
- Modals.
- Popovers.
- Dropdowns.
- Command palette.
- Contextual panels.
- Notification panels.
- Floating action buttons.
- Selected dashboard widgets.

Example CSS foundation:

```css
.glass-surface {
  background: rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(24px) saturate(160%);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.42);
  box-shadow:
    0 8px 32px rgba(38, 20, 55, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);
  border-radius: 18px;
}

.dark .glass-surface {
  background: rgba(38, 20, 55, 0.58);
  border: 1px solid rgba(255, 255, 255, 0.10);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
```

These are starting values, not a requirement to use identical styling everywhere.

Create reusable glass utilities and components.

Avoid applying heavy blur to every card or every content area.

The interface must remain readable and performant.

Use a clear hierarchy between:

- Glass surfaces.
- Main content backgrounds.
- Floating elements.
- Active elements.
- Interactive elements.

## 6.4 Light mode

Light mode should use:

- White and very light Amethyst backgrounds.
- Soft neutral borders.
- Subtle shadows.
- Transparent glass panels.
- Dark readable typography.
- Amethyst active states.

The interface must not become excessively bright or visually flat.

## 6.5 Dark mode

Dark mode should use:

- Deep Amethyst and charcoal backgrounds.
- Dark glass panels.
- Subtle light borders.
- Bright but controlled Amethyst accents.
- Readable light typography.
- Properly adjusted shadows and hover states.

Do not simply invert the colors.

Design both themes intentionally.

## 6.6 Theme implementation

Implement a global theme system.

Requirements:

- Light mode.
- Dark mode.
- Theme toggle.
- Persistent user preference.
- System preference detection on first visit.
- Consistent theme across all routes.
- Theme-aware Chakra UI components.
- Theme-aware Tailwind utilities.
- No flash of the wrong theme during initial rendering.

Use Chakra UI's theming capabilities and Tailwind's dark mode configuration.

There must be one shared theme state. Do not create separate theme systems that can contradict each other.

## 6.7 Chakra UI and Tailwind CSS

Use Chakra UI and Tailwind CSS together.

Use Chakra UI for:

- Accessible interactive components.
- Dialogs.
- Menus.
- Popovers.
- Tooltips.
- Form controls.
- Drawers.
- Toasts.
- Other reusable component primitives.

Use Tailwind CSS for:

- Layout.
- Grid.
- Flexbox.
- Spacing.
- Responsive design.
- Custom glass styling.
- Backgrounds.
- Borders.
- Custom visual effects.

Do not unnecessarily style the same component with conflicting Chakra and Tailwind rules.

Verify compatibility between the installed Chakra UI and Tailwind CSS versions during setup.

Do not assume that configuration instructions for older Chakra or Tailwind versions apply to the installed versions.

Document the integration decisions.

## 6.8 Typography

Use a professional, modern sans-serif font.

Typography must have:

- Clear page titles.
- Consistent section headings.
- Readable body text.
- Small secondary labels.
- Properly emphasized metadata.
- Consistent font weights.

Avoid excessive font sizes and decorative typography.

## 6.9 Icons

Use Lucide React.

Icons must be consistent in:

- Stroke weight.
- Size.
- Alignment.
- Spacing.

Do not mix unrelated icon libraries.

---

# 7. APPLICATION LAYOUT AND NAVIGATION

Build a unified application shell.

The application should have three major areas.

## 7.1 Left sidebar

The sidebar should contain:

- Application logo.
- Workspace selector.
- Workspace navigation.
- Dashboard.
- Inbox.
- Direct messages.
- Channels.
- Projects.
- Boards.
- Issues.
- Notifications.
- Settings.
- User profile.

Organize the navigation into understandable groups.

Allow collapsible navigation sections where useful.

## 7.2 Main content area

The main content area should display the active feature.

Examples:

- Dashboard.
- Chat.
- Board.
- Issue details.
- Project overview.
- Settings.
- Search results.

The layout must adapt to the current module.

## 7.3 Contextual right panel

Create a reusable contextual panel.

It should display relevant information depending on the selected content.

Examples:

- Issue details while viewing a board.
- Related chat discussion while viewing an issue.
- Member information while viewing a conversation.
- Project activity while viewing a project.
- Attachments and comments.

The panel should be collapsible.

## 7.4 Split-pane functionality

Support layouts such as:

- Chat + issue details.
- Chat + project board.
- Board + issue details.
- Project overview + activity.
- Chat + files.

Allow users to open relevant information without losing their current context.

## 7.5 Responsive behavior

Desktop:

- Persistent sidebar.
- Main content area.
- Optional right contextual panel.

Tablet:

- Collapsible sidebar.
- Flexible content layout.
- Context panel displayed as a drawer when appropriate.

Mobile:

- Mobile navigation.
- Touch-friendly controls.
- Full-screen content views.
- Drawers for secondary panels.
- Responsive board navigation.
- Mobile-friendly messaging.

Do not simply shrink the desktop interface.

Design a proper responsive experience.

---

# 8. APPLICATION FRONTEND ARCHITECTURE

Organize the frontend by features.

Recommended structure:

```text
client/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── ui/
│   │   ├── shared/
│   │   ├── navigation/
│   │   └── feedback/
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── pages/
│   │   │
│   │   ├── dashboard/
│   │   ├── workspace/
│   │   ├── projects/
│   │   ├── chat/
│   │   ├── boards/
│   │   ├── issues/
│   │   ├── notifications/
│   │   ├── search/
│   │   └── settings/
│   │
│   ├── layouts/
│   │   ├── MainLayout.jsx
│   │   ├── AuthLayout.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Topbar.jsx
│   │   ├── ContextPanel.jsx
│   │   └── SplitPane.jsx
│   │
│   ├── hooks/
│   ├── contexts/
│   ├── services/
│   ├── lib/
│   ├── routes/
│   ├── theme/
│   ├── utils/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── package.json
└── vite.config.js
```

Do not put all components into one folder.

Keep feature-specific components inside their respective feature directories.

Use reusable components for shared functionality.

Use React Context only for appropriate global state, such as authentication, workspace selection, and theme preferences.

Use TanStack Query for server state and API caching.

Do not use local component state as a substitute for persistent backend data.

---

# 9. BACKEND ARCHITECTURE

The backend must be built using Express and JavaScript ES modules.

Recommended structure:

```text
server/
├── src/
│   ├── config/
│   │   ├── firebase.js
│   │   ├── env.js
│   │   └── cors.js
│   │
│   ├── middleware/
│   │   ├── authenticate.js
│   │   ├── authorize.js
│   │   ├── validate.js
│   │   ├── errorHandler.js
│   │   ├── notFound.js
│   │   └── rateLimiter.js
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── workspaces/
│   │   ├── invitations/
│   │   ├── projects/
│   │   ├── channels/
│   │   ├── messages/
│   │   ├── threads/
│   │   ├── reactions/
│   │   ├── boards/
│   │   ├── lists/
│   │   ├── cards/
│   │   ├── issues/
│   │   ├── comments/
│   │   ├── sprints/
│   │   ├── notifications/
│   │   ├── attachments/
│   │   ├── activities/
│   │   └── integrations/
│   │
│   ├── shared/
│   │   ├── errors/
│   │   ├── constants/
│   │   ├── utils/
│   │   └── services/
│   │
│   ├── routes/
│   │   └── index.js
│   │
│   ├── app.js
│   └── server.js
│
├── tests/
├── package.json
└── .env.example
```

Each business module should follow a consistent structure where appropriate:

```text
issues/
├── issue.routes.js
├── issue.controller.js
├── issue.service.js
├── issue.repository.js
├── issue.validation.js
└── issue.test.js
```

Do not create unnecessary files that contain no meaningful responsibility.

Keep the code maintainable and consistent.

---

# 10. FIREBASE AUTHENTICATION ARCHITECTURE

Use Firebase Authentication as the application's identity provider.

Do not introduce Clerk, Auth0, or another identity provider unless explicitly approved.

Authentication flow:

1. User registers or logs in through Firebase Authentication.
2. Firebase returns an authenticated user.
3. The frontend retrieves a Firebase ID token.
4. The frontend sends the token to Express.
5. Express verifies the token using Firebase Admin SDK.
6. Express identifies the user using the verified UID.
7. Express checks the user's permissions.
8. Express performs the requested operation.

Implement:

- Registration.
- Login.
- Logout.
- Password reset.
- User profile creation.
- User profile updates.
- Authentication state persistence.
- Protected frontend routes.
- Protected backend routes.
- Session and token error handling.

Do not trust a UID supplied by the frontend when the authenticated UID is already available from the verified token.

---

# 11. FIRESTORE DATABASE ARCHITECTURE

Use Cloud Firestore as the primary database.

Plan the database around application queries and document access patterns.

Recommended logical collections:

```text
users
workspaces
workspaceMembers
invitations
projects
channels
messages
threads
reactions
boards
lists
cards
issues
issueComments
issueLinks
sprints
attachments
notifications
activities
devices
```

Appropriate subcollections may be used where they simplify access patterns.

Example:

```text
users/{userId}

workspaces/{workspaceId}

workspaces/{workspaceId}/members/{userId}

workspaces/{workspaceId}/projects/{projectId}

channels/{channelId}

channels/{channelId}/messages/{messageId}

boards/{boardId}

boards/{boardId}/lists/{listId}

boards/{boardId}/cards/{cardId}

issues/{issueId}

issues/{issueId}/comments/{commentId}

users/{userId}/notifications/{notificationId}
```

## Required database design rules

1. Avoid placing large arrays of messages inside a single document.
2. Avoid placing every board card inside one document.
3. Paginate large collections.
4. Use server timestamps.
5. Design Firestore indexes based on real queries.
6. Avoid unnecessarily expensive listeners.
7. Use transactions when multiple related writes must succeed together.
8. Use batched writes when appropriate.
9. Denormalize carefully to reduce repeated reads.
10. Document relationships and ownership.
11. Keep data structures consistent.
12. Plan deletion and archival behavior.

Before implementing complex modules, document the expected Firestore document shapes and queries.

Do not invent an unplanned database schema while coding.

---

# 12. WORKSPACE AND PERMISSION SYSTEM

The application must support multiple workspaces.

A user can belong to multiple workspaces.

Each workspace has its own:

- Members.
- Projects.
- Channels.
- Boards.
- Issues.
- Settings.
- Activity history.

Recommended roles:

### Owner

- Full workspace control.
- Manage billing-related settings when implemented.
- Manage workspace administrators.
- Delete the workspace.
- Transfer ownership.

### Admin

- Manage members.
- Manage workspace settings.
- Manage projects.
- Manage channels.
- Manage permissions where authorized.

### Project manager

- Manage assigned projects.
- Manage project members.
- Manage boards.
- Manage issues.
- Manage project workflows.

### Developer/member

- View permitted projects.
- Create and update assigned work.
- Communicate with teammates.
- Comment on issues.
- Participate in boards.

### Guest

- Access only explicitly shared resources.
- Limited permissions.

Build a centralized authorization service.

Do not scatter role-checking logic throughout the application.

Support resource-level permissions where needed, especially for private channels and restricted projects.

---

# 13. SLACK-STYLE COMMUNICATION MODULE

Build a complete team communication experience.

## 13.1 Channels

Implement:

- Public channels.
- Private channels.
- Channel descriptions.
- Channel membership.
- Channel settings.
- Channel archiving.
- Channel search.

## 13.2 Direct messages

Implement:

- One-to-one conversations.
- Group conversations.
- Conversation members.
- Conversation history.
- Unread indicators.

## 13.3 Messages

Message records should support:

- Content.
- Sender ID.
- Channel or conversation ID.
- Created timestamp.
- Updated timestamp.
- Edited status.
- Attachment references.
- Parent message ID when threaded.
- Linked issue ID where applicable.

Implement:

- Sending messages.
- Editing messages.
- Deleting messages.
- Replying to messages.
- Reactions.
- Mentions.
- Pins.
- Attachments.
- Search.

## 13.4 Real-time functionality

Use Firestore real-time listeners for appropriate message and conversation updates.

The frontend should subscribe only to relevant active conversations.

Do not subscribe to an entire workspace's message history.

Use pagination for older messages.

## 13.5 Presence

Implement:

- Online status.
- Offline status.
- Last seen.
- Typing indicators.

Typing indicators must expire automatically.

Do not treat a user's last stored online state as permanently accurate.

Consider Firebase Realtime Database connection status or another suitable presence mechanism for reliable disconnect detection.

## 13.6 Read receipts

Track message read state efficiently.

Avoid writing an individual read receipt to every message if a per-user conversation cursor can satisfy the feature.

Use an appropriate unread count and last-read timestamp strategy.

---

# 14. TRELLO-STYLE BOARD MODULE

Build a flexible Kanban system.

## 14.1 Boards

Support:

- Creating boards.
- Renaming boards.
- Deleting boards.
- Archiving boards.
- Board members.
- Board visibility.
- Board descriptions.

## 14.2 Lists

Support:

- Creating lists.
- Renaming lists.
- Deleting lists.
- Reordering lists.
- List colors where appropriate.

## 14.3 Cards

Cards should reference canonical issue records.

Support:

- Title.
- Description.
- Assignee.
- Priority.
- Due date.
- Labels.
- Checklists.
- Comments.
- Attachments.
- Activity history.
- Position.
- Issue reference.

## 14.4 Drag and drop

Users must be able to:

- Reorder cards.
- Move cards between lists.
- Reorder lists.

Implement optimistic UI updates carefully.

The backend must validate the move and persist the new ordering.

Use a robust fractional-indexing strategy or a suitable library.

Do not rely indefinitely on simple floating-point averaging.

Handle concurrent moves safely.

## 14.5 Board views

Initially support:

- Kanban board view.

Later support:

- List view.
- Calendar view.
- Timeline view.

---

# 15. JIRA-STYLE ISSUE MANAGEMENT MODULE

Issues are the central records of work.

## 15.1 Issue types

Support:

- Epic.
- Story.
- Task.
- Bug.
- Subtask.

## 15.2 Issue properties

An issue should support:

- Unique ID.
- Project ID.
- Workspace ID.
- Title.
- Description.
- Type.
- Status.
- Priority.
- Assignee.
- Reporter.
- Labels.
- Due date.
- Parent issue.
- Linked issues.
- Attachments.
- Created timestamp.
- Updated timestamp.
- Resolved timestamp.

## 15.3 Priority levels

Support:

- Lowest.
- Low.
- Medium.
- High.
- Highest.

## 15.4 Workflow

Create an extensible issue workflow.

Initial default statuses:

- Backlog.
- To do.
- In progress.
- In review.
- Done.

Do not assume every project must use the same workflow forever.

Design the data model so custom workflows can be introduced later.

## 15.5 Comments and history

Support:

- Issue comments.
- Editing comments.
- Deleting comments where authorized.
- Issue activity history.
- Status transition history.
- Assignee change history.
- Priority change history.

## 15.6 Sprints

Later implement:

- Sprint creation.
- Sprint dates.
- Sprint goals.
- Backlog.
- Sprint assignment.
- Sprint completion.
- Sprint reports.

Do not build advanced sprint analytics before the basic issue system works.

---

# 16. CROSS-MODULE INTEGRATIONS

THIS IS THE MOST IMPORTANT PRODUCT DIFFERENTIATOR.

All three modules must work together.

## 16.1 Convert chat messages into issues

Users should be able to convert a message into an issue.

When converting:

1. Retrieve the original message.
2. Validate access to the message.
3. Validate access to the target project.
4. Create the issue.
5. Preserve the original message reference.
6. Link the message to the issue.
7. Record activity.
8. Trigger relevant notifications.

Allow users to edit the issue title, description, type, priority, and project before confirming the conversion.

Prevent accidental duplicate conversions.

## 16.2 Issue-to-board integration

When an issue is created, allow it to be placed on a board.

The card must reference the issue.

Do not maintain two independent sources of truth.

## 16.3 Status synchronization

When a card moves to another workflow column:

- Determine the corresponding workflow status.
- Validate the transition.
- Update the issue.
- Update board placement.
- Record activity.
- Notify relevant users if necessary.

When an issue status changes outside the board:

- Update its board representation.
- Preserve its placement rules.
- Reflect the update in real time.

Use transactions or a reliable consistency strategy.

## 16.4 Mention issues in chat

Allow users to mention an issue using an issue identifier.

Display a rich preview containing:

- Issue title.
- Issue type.
- Priority.
- Status.
- Assignee.

Allow users to open the issue without leaving the conversation.

## 16.5 Contextual collaboration

When viewing an issue, show relevant conversations and related project information.

When viewing a conversation, allow users to access linked issues.

Build a connected collaboration experience.

---

# 17. NOTIFICATION AND ACTIVITY SYSTEM

## 17.1 In-app notifications

Notify users when:

- They are mentioned.
- They receive a direct message.
- They are assigned an issue.
- An assigned issue changes status.
- Someone comments on their issue.
- Someone replies to their message.
- They receive a workspace invitation.
- A relevant project event occurs.

## 17.2 Push notifications

Use Firebase Cloud Messaging.

Support browser notifications where the user grants permission.

Store device tokens securely.

Allow users to configure notification preferences.

Do not send duplicate notifications for the same event.

## 17.3 Activity history

Create an activity feed for relevant events.

Examples:

- User created a project.
- User created an issue.
- Issue status changed.
- Card moved.
- User joined a channel.
- Message converted into an issue.

Store actor, action, resource, timestamp, and relevant context.

Do not expose private information through activity feeds.

---

# 18. FILES AND ATTACHMENTS

Use Firebase Storage for files.

Support:

- Images.
- Documents.
- PDFs.
- Other explicitly allowed file types.

Implement:

- Upload validation.
- File size validation.
- File type validation.
- Download permissions.
- File metadata.
- Attachment references.
- Deletion behavior.

Store file metadata in Firestore.

Do not store large binary files directly in Firestore documents.

Never make private files publicly accessible by default.

Use appropriate Firebase Storage Security Rules or controlled backend access.

---

# 19. API DESIGN

Use REST API routes under:

`/api/v1`

Organize endpoints by resource.

Example:

## Users

- GET `/api/v1/users/me`
- PATCH `/api/v1/users/me`
- GET `/api/v1/users/:userId`
- GET `/api/v1/users/search`

## Workspaces

- POST `/api/v1/workspaces`
- GET `/api/v1/workspaces`
- GET `/api/v1/workspaces/:workspaceId`
- PATCH `/api/v1/workspaces/:workspaceId`
- DELETE `/api/v1/workspaces/:workspaceId`

## Invitations

- POST `/api/v1/workspaces/:workspaceId/invitations`
- POST `/api/v1/invitations/:token/accept`
- POST `/api/v1/invitations/:token/reject`

## Projects

- POST `/api/v1/projects`
- GET `/api/v1/projects/:projectId`
- PATCH `/api/v1/projects/:projectId`
- DELETE `/api/v1/projects/:projectId`

## Channels and messages

- POST `/api/v1/channels`
- GET `/api/v1/channels`
- POST `/api/v1/channels/:channelId/messages`
- GET `/api/v1/channels/:channelId/messages`
- PATCH `/api/v1/messages/:messageId`
- DELETE `/api/v1/messages/:messageId`

## Boards

- POST `/api/v1/boards`
- GET `/api/v1/boards/:boardId`
- PATCH `/api/v1/boards/:boardId`
- POST `/api/v1/boards/:boardId/lists`
- POST `/api/v1/lists/:listId/cards`
- PATCH `/api/v1/cards/:cardId/move`

## Issues

- POST `/api/v1/issues`
- GET `/api/v1/issues/:issueId`
- PATCH `/api/v1/issues/:issueId`
- PATCH `/api/v1/issues/:issueId/status`
- PATCH `/api/v1/issues/:issueId/assignee`
- POST `/api/v1/issues/:issueId/comments`

## Integrations

- POST `/api/v1/integrations/messages/:messageId/convert-to-issue`
- POST `/api/v1/integrations/issues/:issueId/create-card`
- GET `/api/v1/activities`

Use consistent JSON responses.

Use appropriate HTTP status codes.

Validate request bodies and parameters.

Implement pagination, filtering, and sorting where necessary.

Document the API.

---

# 20. SECURITY REQUIREMENTS

Security must be considered from the beginning, not added at the end.

Implement:

- Firebase ID token verification.
- Workspace membership checks.
- Resource-level authorization.
- Input validation.
- Output validation where useful.
- Rate limiting.
- CORS restrictions.
- Helmet security headers.
- Safe error handling.
- Secure file upload validation.
- Firestore Security Rules.
- Firebase Storage Security Rules.
- Environment variable protection.
- Protection against unauthorized role changes.
- Protection against cross-workspace data access.

Never:

- Expose Firebase Admin credentials.
- Commit service account private keys.
- Trust user-supplied role values.
- Trust user-supplied workspace ownership.
- Allow users to access private channels without permission.
- Return sensitive database information unnecessarily.
- Store passwords manually in Firestore.
- Put secrets in frontend environment variables.

Use Firebase Auth for password management.

Remember that frontend environment variables are public when bundled into a client application.

---

# 21. PERFORMANCE AND SCALABILITY

Design for growth without unnecessary complexity.

Requirements:

- Paginate large collections.
- Limit real-time listeners.
- Avoid excessive Firestore reads.
- Use indexes.
- Avoid oversized documents.
- Use efficient queries.
- Use optimistic UI carefully.
- Use caching appropriately.
- Avoid unnecessary React re-renders.
- Use lazy loading for large feature modules.
- Optimize images and attachments.
- Use background jobs for retryable or expensive operations when needed.

Consider Firestore transaction limits and concurrency.

Consider how simultaneous users moving the same card or editing the same issue will be handled.

Do not introduce Redis, Kafka, or microservices without a demonstrated need and explicit approval.

---

# 22. ADVANCED FEATURES — FUTURE DEVELOPMENT

These features are not part of the initial MVP.

Do not begin them until the core application is stable and I approve their implementation.

Potential future features:

## AI assistant

- Summarize discussions.
- Summarize issues.
- Generate issue descriptions.
- Recommend task priorities.
- Generate project reports.
- Identify project blockers.
- Summarize sprint progress.
- Search project knowledge using natural language.

## Advanced project management

- Gantt charts.
- Timeline views.
- Workload management.
- Resource planning.
- Advanced analytics.
- Custom dashboards.
- Custom workflows.
- Custom fields.

## External integrations

- GitHub.
- GitLab.
- Google Drive.
- Calendar services.
- Email integrations.
- External automation tools.

## Video collaboration

Potentially implement WebRTC-based video calls.

Do not treat Firebase Cloud Messaging as a video transport system.

---

# 23. TESTING REQUIREMENTS

Every important module must have tests.

Use Vitest and Supertest for backend tests.

Use React Testing Library for frontend tests.

Use Firebase Emulator Suite for Firebase-dependent development and testing.

Test:

- Registration.
- Login.
- Authentication middleware.
- Workspace creation.
- Workspace membership.
- Permission enforcement.
- Project creation.
- Channel access.
- Message creation.
- Message pagination.
- Board creation.
- Card movement.
- Issue creation.
- Issue updates.
- Issue status transitions.
- Message-to-issue conversion.
- Notification generation.
- Unauthorized access.
- Cross-workspace access prevention.

Do not claim that a feature is complete simply because the interface renders.

Test the actual functionality.

Do not silently ignore failing tests.

---

# 24. REQUIRED IMPLEMENTATION SEQUENCE

Follow these sections in the exact order.

You must stop after every section and await approval.

## SECTION 1 — PROJECT INSPECTION AND ARCHITECTURE PLANNING

Tasks:

1. Inspect the existing repository.
2. Identify existing frameworks and dependencies.
3. Identify existing components and files.
4. Check whether the project already has Firebase configured.
5. Check whether React and Vite are already configured.
6. Identify reusable existing code.
7. Identify architectural problems.
8. Propose the final project directory structure.
9. Explain the development plan.
10. Identify missing configuration.

Do not delete existing files.

Do not rewrite the entire repository.

Do not install packages yet unless I explicitly approve.

Deliverables:

- Repository analysis.
- Architecture proposal.
- Proposed directory structure.
- Dependency plan.
- Risks and recommendations.

STOP AND WAIT FOR APPROVAL.

## SECTION 2 — PROJECT FOUNDATION AND ENVIRONMENT SETUP

Tasks:

1. Configure the frontend.
2. Configure the backend.
3. Install required dependencies.
4. Configure JavaScript ES modules.
5. Configure Vite.
6. Configure Express.
7. Configure environment variables.
8. Configure the development scripts.
9. Configure linting and formatting if appropriate.
10. Configure the Firebase Emulator Suite.
11. Create a working health-check endpoint.
12. Confirm the frontend and backend can communicate.

Deliverables:

- Working React application.
- Working Express server.
- Firebase project connection foundation.
- Environment documentation.
- Development instructions.

STOP AND WAIT FOR APPROVAL.

## SECTION 3 — DESIGN SYSTEM AND APPLICATION SHELL

Tasks:

1. Install and configure Chakra UI.
2. Install and configure Tailwind CSS.
3. Implement the Amethyst palette.
4. Build the light theme.
5. Build the dark theme.
6. Implement persistent theme preferences.
7. Build reusable glass components.
8. Build the main sidebar.
9. Build the top navigation.
10. Build the contextual right panel.
11. Build responsive layouts.
12. Implement routing foundations.
13. Build loading, empty, and error states.
14. Ensure accessibility and responsive behavior.

Deliverables:

- Complete visual design foundation.
- Working theme switcher.
- Responsive application shell.
- Reusable UI components.

Use realistic mock data for visual development where necessary.

Do not build the actual chat, board, or issue backend functionality yet.

STOP AND WAIT FOR APPROVAL.

## SECTION 4 — FIREBASE CONFIGURATION AND AUTHENTICATION

Tasks:

1. Create the frontend Firebase configuration.
2. Create the backend Firebase Admin configuration.
3. Connect Firebase Authentication.
4. Implement registration.
5. Implement login.
6. Implement logout.
7. Implement password reset.
8. Create the Express authentication middleware.
9. Implement protected frontend routes.
10. Implement protected backend routes.
11. Implement user profile synchronization.
12. Handle expired tokens and authentication errors.

Deliverables:

- Working Firebase authentication.
- Secure Express authentication.
- User profile records.
- Protected routes.

STOP AND WAIT FOR APPROVAL.

## SECTION 5 — USERS AND WORKSPACE MANAGEMENT

Tasks:

1. Build user profiles.
2. Build workspace creation.
3. Build workspace selection.
4. Build workspace settings.
5. Build workspace membership.
6. Build workspace roles.
7. Build permission services.
8. Build member management.
9. Implement workspace switching.
10. Build workspace dashboard foundation.

Deliverables:

- Multi-workspace functionality.
- User membership management.
- Centralized authorization foundation.

STOP AND WAIT FOR APPROVAL.

## SECTION 6 — PROJECTS, TEAMS AND INVITATIONS

Tasks:

1. Create projects.
2. Edit projects.
3. Archive projects.
4. Delete projects according to authorization rules.
5. Add project members.
6. Remove project members.
7. Create workspace invitations.
8. Accept invitations.
9. Reject invitations.
10. Implement project permissions.
11. Build project overview.

Deliverables:

- Functional project management foundation.
- Team invitations.
- Project membership.

STOP AND WAIT FOR APPROVAL.

## SECTION 7 — SLACK-STYLE COMMUNICATION

Tasks:

1. Build channel management.
2. Build public channels.
3. Build private channels.
4. Build direct messages.
5. Build group conversations.
6. Implement message creation.
7. Implement message editing.
8. Implement message deletion.
9. Implement real-time listeners.
10. Implement threads.
11. Implement reactions.
12. Implement mentions.
13. Implement read receipts.
14. Implement typing indicators.
15. Implement online presence.
16. Implement message attachments.
17. Implement message search.
18. Build the complete chat interface.

Deliverables:

- Functional real-time communication system.

STOP AND WAIT FOR APPROVAL.

## SECTION 8 — TRELLO-STYLE KANBAN BOARDS

Tasks:

1. Build board creation.
2. Build board management.
3. Build lists.
4. Build cards.
5. Implement drag-and-drop.
6. Implement card ordering.
7. Implement list ordering.
8. Implement card assignment.
9. Implement labels.
10. Implement due dates.
11. Implement checklists.
12. Implement comments.
13. Implement attachments.
14. Implement card activity.
15. Build responsive board interface.

Deliverables:

- Functional Kanban board system.

At this stage, use appropriate issue references or temporary mock issue data only where needed. Do not introduce duplicate canonical work records.

STOP AND WAIT FOR APPROVAL.

## SECTION 9 — JIRA-STYLE ISSUE MANAGEMENT

Tasks:

1. Build issue creation.
2. Build issue editing.
3. Implement issue types.
4. Implement priorities.
5. Implement assignees.
6. Implement reporters.
7. Implement issue statuses.
8. Implement workflow validation.
9. Implement comments.
10. Implement issue links.
11. Implement subtasks.
12. Implement epics and stories.
13. Implement issue search.
14. Implement issue filters.
15. Implement issue activity history.
16. Build issue details interface.
17. Implement basic backlog and sprint foundations.

Deliverables:

- Functional issue tracking system.

STOP AND WAIT FOR APPROVAL.

## SECTION 10 — CROSS-MODULE INTEGRATIONS

Tasks:

1. Convert chat messages into issues.
2. Link issues to boards.
3. Synchronize issue and board statuses.
4. Mention issues in chat.
5. Display issue previews.
6. Link conversations to issues.
7. Generate activity records.
8. Trigger relevant notifications.
9. Implement consistency and duplicate-operation protection.
10. Test cross-module permissions.

Deliverables:

- Fully connected communication, board, and issue systems.

STOP AND WAIT FOR APPROVAL.

## SECTION 11 — NOTIFICATIONS AND ACTIVITY

Tasks:

1. Build in-app notifications.
2. Implement notification preferences.
3. Implement unread notification counts.
4. Integrate Firebase Cloud Messaging.
5. Store device tokens.
6. Build activity feeds.
7. Add notification pagination.
8. Implement duplicate notification protection.
9. Test notification permissions.

Deliverables:

- Functional notification and activity system.

STOP AND WAIT FOR APPROVAL.

## SECTION 12 — ADVANCED PRODUCTIVITY

Tasks:

1. Implement calendar views.
2. Implement timeline views.
3. Implement advanced filters.
4. Implement saved views where appropriate.
5. Implement workload management.
6. Improve sprint planning.
7. Implement project analytics.
8. Implement global search.
9. Implement dashboard customization.

Deliverables:

- Advanced productivity experience.

STOP AND WAIT FOR APPROVAL.

## SECTION 13 — SECURITY AND PERFORMANCE

Tasks:

1. Audit authentication.
2. Audit authorization.
3. Audit Firestore rules.
4. Audit Storage rules.
5. Audit cross-workspace access.
6. Add appropriate indexes.
7. Review database queries.
8. Review listener usage.
9. Optimize expensive operations.
10. Implement rate limiting.
11. Improve error handling.
12. Review upload restrictions.
13. Review data deletion and archival.
14. Test concurrent operations.

Deliverables:

- Security and performance review.
- List of resolved and remaining issues.

STOP AND WAIT FOR APPROVAL.

## SECTION 14 — TESTING AND QUALITY ASSURANCE

Tasks:

1. Write backend unit tests.
2. Write API integration tests.
3. Write frontend component tests.
4. Test authentication.
5. Test permissions.
6. Test chat.
7. Test boards.
8. Test issue management.
9. Test integrations.
10. Test real-time updates.
11. Test responsive layouts.
12. Test light mode.
13. Test dark mode.
14. Fix discovered bugs.
15. Run the full test suite.

Deliverables:

- Test results.
- Known issues.
- Quality assurance report.

STOP AND WAIT FOR APPROVAL.

## SECTION 15 — PRODUCTION DEPLOYMENT AND DOCUMENTATION

Tasks:

1. Prepare the frontend for production.
2. Prepare the backend for production.
3. Configure Cloud Run.
4. Configure frontend hosting.
5. Configure Firebase production settings.
6. Configure environment variables.
7. Configure production security rules.
8. Configure CORS.
9. Verify production authentication.
10. Verify database access.
11. Verify storage permissions.
12. Configure logging and monitoring.
13. Create README documentation.
14. Document local development.
15. Document deployment.
16. Document the API.
17. Document the database architecture.
18. Provide final project handover.

Deliverables:

- Deployed application.
- Complete documentation.
- Final architecture summary.
- Deployment instructions.

STOP AND WAIT FOR FINAL APPROVAL.

---

# 25. REQUIRED CODING STANDARDS

Follow these coding standards throughout development.

## JavaScript

- Use ES modules.
- Use `async/await`.
- Handle errors explicitly.
- Use meaningful variable names.
- Avoid unnecessary global variables.
- Keep functions focused.
- Avoid overly large components.
- Use JSDoc where it improves clarity.
- Avoid duplicated code.
- Avoid unnecessary dependencies.

## React

- Use functional components.
- Use hooks appropriately.
- Keep components focused.
- Extract reusable UI components.
- Avoid unnecessary prop drilling.
- Use appropriate global state.
- Handle loading states.
- Handle empty states.
- Handle errors.
- Use proper React keys.
- Avoid unnecessary effects.
- Avoid putting all page logic into one component.

## Express

- Keep routes separate from controllers.
- Keep business logic in services.
- Keep Firestore operations in repositories.
- Use centralized error handling.
- Validate all untrusted input.
- Protect sensitive routes.
- Use consistent API responses.
- Keep authorization centralized.

## Naming conventions

Use:

- camelCase for variables and functions.
- PascalCase for React components.
- kebab-case or consistent lowercase naming for directories.
- Descriptive file names.

Do not use vague names such as:

- `data2`
- `test123`
- `handleStuff`
- `newFunction`

## Comments

Write comments to explain important decisions and non-obvious logic.

Do not write comments that merely repeat what the code already says.

---

# 26. ERROR HANDLING AND USER EXPERIENCE

Every major operation must have proper feedback.

Examples:

- Loading indicators.
- Success notifications.
- Error notifications.
- Empty states.
- Confirmation dialogs for destructive actions.
- Form validation.
- Retry options when appropriate.

Never leave the user staring at an empty screen when data is loading or an operation fails.

Use consistent toast and dialog patterns.

All destructive operations must be handled carefully.

---

# 27. AI AGENT BEHAVIOR RULES

These rules apply throughout the project.

1. Inspect before modifying.
2. Never assume the repository is empty.
3. Never overwrite existing working code without examining it.
4. Never delete files without explaining why.
5. Never introduce TypeScript.
6. Never replace the requested technology stack without permission.
7. Never skip an approval checkpoint.
8. Never implement multiple sections in one response.
9. Never claim a feature works without testing it.
10. Never leave unexplained placeholder code in a completed feature.
11. Never hardcode secrets.
12. Never bypass authorization to make a feature work.
13. Never use fake functionality when real functionality is required.
14. Use mock data only when explicitly appropriate for an approved UI-development section.
15. Explain significant architectural decisions.
16. Identify dependencies before installing them.
17. Prefer maintained and compatible libraries.
18. Check the installed library versions before using their APIs.
19. Do not introduce unnecessary packages.
20. Keep the code readable and maintainable.

If you discover a major architectural issue, explain it and ask for approval before making a change that alters the agreed architecture.

If an operation requires a Firebase configuration value or secret that I have not provided, explain exactly what is needed. Never invent credentials.

If a feature depends on another unfinished section, do not silently implement the missing section. Explain the dependency and request approval.

---

# 28. SECTION COMPLETION REPORT TEMPLATE

At the end of EVERY section, use this exact report structure:

## Section [NUMBER]: [SECTION NAME]

### 1. Implementation summary
Explain what was completed.

### 2. Files created
List all newly created files.

### 3. Files modified
List all modified files.

### 4. Dependencies
List installed packages and explain why they were needed.

### 5. Architecture decisions
Explain important implementation choices.

### 6. Testing performed
List commands executed and test results.

### 7. How to run
Give the exact commands needed to run the relevant part of the application.

### 8. Remaining issues
List incomplete functionality, limitations, and known issues.

### 9. Approval request

State:

"Section [NUMBER] is complete. I will not begin Section [NEXT NUMBER] until you explicitly approve this section."

Then STOP.

---

# 29. FIRST ACTION

Begin with SECTION 1 ONLY.

Inspect the existing repository and provide the architecture and implementation plan.

Do not start implementing Section 2.

Do not install packages.

Do not create the entire application.

Do not automatically proceed.

Your first response must contain:

1. A summary of your understanding of the product.
2. An analysis of the existing repository.
3. The proposed final directory structure.
4. The architecture and technology decisions.
5. Any dependencies or risks.
6. The Section 1 completion report.
7. A request for my approval.

REMEMBER:

You are building a serious, integrated SaaS application.

Quality, maintainability, security, visual consistency, and correct architecture are more important than rushing through implementation.

**Complete one section, report it, stop, and wait for my approval.**
**Put all the backend logic in the backend folder and all the frontend knowledge in the frontend folder**