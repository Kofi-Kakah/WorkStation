import { useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthContext from "../../contexts/AuthContext.jsx";
import MainLayout from "../../layouts/MainLayout.jsx";
import DashboardPage from "../dashboard/DashboardPage.jsx";

const WORKSPACE = { id: "preview-workspace-1", name: "Acme Studio" };

const MEMBERS = [
  { userId: "u1", profile: { displayName: "Avery Quinn" } },
  { userId: "u2", profile: { displayName: "Riley Chen" } },
  { userId: "u3", profile: { displayName: "Jordan Ellis" } },
  { userId: "u4", profile: { displayName: "Sam Okafor" } },
];

const CHANNELS = [
  {
    id: "c1",
    name: "general",
    visibility: "public",
    topic: "Team-wide announcements",
  },
  {
    id: "c2",
    name: "design",
    visibility: "public",
    topic: "Design reviews and critique",
  },
  {
    id: "c3",
    name: "engineering",
    visibility: "public",
    topic: "Implementation notes",
  },
  { id: "c4", name: "leads", visibility: "private", topic: "Staff sync" },
  {
    id: "c5",
    name: "release",
    visibility: "private",
    topic: "Release coordination",
  },
];

function isoDay(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

const ISSUES = [
  {
    id: "i1",
    issueKey: "ACME-112",
    title: "Harden session refresh on tab focus",
    status: "in_progress",
    priority: "high",
    assigneeId: "u1",
    dueDate: isoDay(2),
  },
  {
    id: "i2",
    issueKey: "ACME-118",
    title: "Board drag previews flicker on Safari",
    status: "in_review",
    priority: "highest",
    assigneeId: "u2",
    dueDate: isoDay(4),
  },
  {
    id: "i3",
    issueKey: "ACME-121",
    title: "Notification digest preferences",
    status: "todo",
    priority: "medium",
    assigneeId: "u3",
    dueDate: isoDay(6),
  },
  {
    id: "i4",
    issueKey: "ACME-124",
    title: "Channel membership audit trail",
    status: "todo",
    priority: "low",
    assigneeId: null,
    dueDate: isoDay(12),
  },
  {
    id: "i5",
    issueKey: "ACME-101",
    title: "Compose message composer shortcuts",
    status: "in_progress",
    priority: "medium",
    assigneeId: "u4",
    dueDate: isoDay(-3),
  },
  {
    id: "i6",
    issueKey: "ACME-098",
    title: "Project archive flow",
    status: "backlog",
    priority: "low",
    assigneeId: null,
    dueDate: null,
  },
  {
    id: "i7",
    issueKey: "ACME-095",
    title: "Issue search ranking",
    status: "backlog",
    priority: "medium",
    assigneeId: "u1",
    dueDate: null,
  },
  {
    id: "i8",
    issueKey: "ACME-088",
    title: "Sprint report export",
    status: "done",
    priority: "high",
    assigneeId: "u2",
    dueDate: null,
  },
  {
    id: "i9",
    issueKey: "ACME-084",
    title: "Workspace switcher keyboard access",
    status: "done",
    priority: "medium",
    assigneeId: "u3",
    dueDate: null,
  },
  {
    id: "i10",
    issueKey: "ACME-079",
    title: "Firestore index for issue filters",
    status: "done",
    priority: "high",
    assigneeId: "u1",
    dueDate: null,
  },
  {
    id: "i11",
    issueKey: "ACME-127",
    title: "Attachment upload retries",
    status: "in_progress",
    priority: "high",
    assigneeId: "u2",
    dueDate: isoDay(9),
  },
  {
    id: "i12",
    issueKey: "ACME-129",
    title: "Mobile drawer focus trap",
    status: "in_review",
    priority: "medium",
    assigneeId: "u4",
    dueDate: isoDay(5),
  },
  {
    id: "i13",
    issueKey: "ACME-130",
    title: "Board column virtualization",
    status: "todo",
    priority: "highest",
    assigneeId: "u1",
    dueDate: isoDay(1),
  },
  {
    id: "i14",
    issueKey: "ACME-131",
    title: "Saved view sharing permissions",
    status: "done",
    priority: "medium",
    assigneeId: "u3",
    dueDate: null,
  },
];

const PROJECTS = [
  {
    id: "p1",
    name: "Collaboration core",
    totalIssues: 6,
    completedIssues: 2,
    activeIssues: 4,
  },
  {
    id: "p2",
    name: "Issue tracking",
    totalIssues: 5,
    completedIssues: 2,
    activeIssues: 3,
  },
  {
    id: "p3",
    name: "Workspace security",
    totalIssues: 3,
    completedIssues: 1,
    activeIssues: 2,
  },
];

function buildAnalytics() {
  const statusCounts = {
    backlog: 0,
    todo: 0,
    in_progress: 0,
    in_review: 0,
    done: 0,
  };
  const now = Date.now();
  const dueSoonLimit = now + 7 * 86400000;
  let overdueIssues = 0;
  let dueSoonIssues = 0;

  ISSUES.forEach((issue) => {
    statusCounts[issue.status] += 1;
    if (issue.status === "done" || !issue.dueDate) return;
    const due = new Date(issue.dueDate).getTime();
    if (due < now) overdueIssues += 1;
    if (due >= now && due <= dueSoonLimit) dueSoonIssues += 1;
  });

  return {
    summary: {
      projectCount: PROJECTS.length,
      totalIssues: ISSUES.length,
      completedIssues: statusCounts.done,
      activeIssues: ISSUES.length - statusCounts.done,
      overdueIssues,
      dueSoonIssues,
    },
    statusCounts,
    workload: [],
    projects: PROJECTS,
    issues: ISSUES,
  };
}

/**
 * Dev-only harness for visually checking the Overview page against the
 * Emberline reference without Firebase or the API. Not reachable in
 * production builds.
 */
export default function DashboardPreviewPage() {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { staleTime: Infinity, gcTime: Infinity, retry: false },
      },
    });
    client.setQueryData(["analytics", "workspace", WORKSPACE.id], buildAnalytics());
    client.setQueryData(["channels", WORKSPACE.id, "dashboard"], CHANNELS);
    client.setQueryData(["workspace-members", WORKSPACE.id], MEMBERS);
    return client;
  });

  const authValue = useMemo(
    () => ({
      user: { uid: "preview-user" },
      profile: { displayName: "Avery Quinn", photoURL: "" },
      loading: false,
      authenticated: true,
      workspaces: [WORKSPACE],
      activeWorkspace: WORKSPACE,
      activeWorkspaceId: WORKSPACE.id,
      selectWorkspace: () => {},
      getIdToken: async () => "preview-token",
    }),
    [],
  );

  return (
    <AuthContext.Provider value={authValue}>
      <QueryClientProvider client={queryClient}>
        <MainLayout>
          <DashboardPage />
        </MainLayout>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
}
