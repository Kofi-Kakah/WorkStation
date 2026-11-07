import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Box, HStack, Icon, Text, VStack } from "@chakra-ui/react";
import {
  AlertTriangle,
  Bug,
  Check,
  CircleDot,
  Clock3,
  FolderKanban,
  Hash,
  Plus,
  RefreshCw,
  Settings2,
  Users,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  StatCard,
  Toggle,
} from "../../components/ui/index.js";
import { LoadingState } from "../../components/feedback/LoadingState.jsx";
import { useAuth } from "../../contexts/useAuth.jsx";
import { api } from "../../services/apiClient.js";

const WIDGET_STORAGE_KEY = "workstation-dashboard-widgets-v2";

const STAT_WIDGETS = [
  {
    id: "openIssues",
    label: "Open issues",
    description: "Issues that are not done",
  },
  {
    id: "activeChannels",
    label: "Active channels",
    description: "Channels you can access",
  },
  {
    id: "assignedIssues",
    label: "Assigned issues",
    description: "Issues with an assignee",
  },
  {
    id: "projectProgress",
    label: "Project progress",
    description: "Average completion across projects",
  },
];

const PANEL_WIDGETS = [
  { id: "status", label: "Work by status" },
  { id: "deadlines", label: "Due this week" },
  { id: "projects", label: "Active projects" },
  { id: "recentIssues", label: "Recent issues" },
];

const WIDGETS = [...STAT_WIDGETS, ...PANEL_WIDGETS];

const STATUS_ROWS = [
  { key: "backlog", label: "Backlog", color: "var(--text-muted)" },
  { key: "todo", label: "To do", color: "var(--text-secondary)" },
  { key: "in_progress", label: "In progress", color: "var(--accent)" },
  { key: "in_review", label: "In review", color: "var(--warning)" },
  { key: "done", label: "Done", color: "var(--success)" },
];

const ISSUE_STATUS = {
  backlog: { label: "Backlog", variant: "neutral" },
  todo: { label: "To do", variant: "neutral" },
  in_progress: { label: "In progress", variant: "accent" },
  in_review: { label: "In review", variant: "warning" },
  done: { label: "Done", variant: "success" },
};

function readWidgetPreferences() {
  try {
    const stored = JSON.parse(
      localStorage.getItem(WIDGET_STORAGE_KEY) || "{}",
    );
    return stored && typeof stored === "object" && !Array.isArray(stored)
      ? stored
      : {};
  } catch (error) {
    console.warn("Could not load dashboard widget preferences", error?.message);
    return {};
  }
}

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function exportCsv(filename, headers, rows) {
  const csv = [headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatUpdatedAgo(timestamp, now) {
  if (!timestamp) return "Waiting for workspace data";
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000));
  if (seconds < 10) return "Updated just now";
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `Updated ${hours}h ago`;
}

function formatDueDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function useClock(intervalMs = 15000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

function useOnlineStatus() {
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  return online;
}

function TextAction({ children, onClick, icon: ActionIcon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-control px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent-soft hover:text-accent-hot"
    >
      {ActionIcon && (
        <ActionIcon size={13} strokeWidth={1.5} aria-hidden="true" />
      )}
      {children}
    </button>
  );
}

function PanelCard({ title, description, action, children }) {
  return (
    <Card className="flex min-w-0 flex-col p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-primary">{title}</h2>
          {description && (
            <p className="mt-1 text-xs text-muted">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

function InlineErrorCard({ title, message, onRetry }) {
  return (
    <Card className="p-4 sm:p-5" role="alert">
      <HStack align="start" spacing={3}>
        <Icon
          as={AlertTriangle}
          boxSize={5}
          color="danger"
          mt="2px"
          flexShrink={0}
        />
        <Box minW="0" flex={1}>
          <Text fontSize="sm" fontWeight="600" color="textPrimary">
            {title}
          </Text>
          <Text mt={1} fontSize="xs" color="textSecondary">
            {message}
          </Text>
        </Box>
        {onRetry && (
          <Button variant="secondary" onClick={onRetry} flexShrink={0}>
            Try again
          </Button>
        )}
      </HStack>
    </Card>
  );
}

function StatusBreakdown({ counts, total }) {
  if (!total) {
    return (
      <p className="py-6 text-sm text-muted">
        No issues in this workspace yet.
      </p>
    );
  }

  return (
    <VStack align="stretch" spacing={3}>
      {STATUS_ROWS.map(({ key, label, color }) => {
        const count = counts[key] || 0;
        const percent = Math.round((count / total) * 100);
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-[86px] shrink-0 text-xs text-secondary">
              {label}
            </span>
            <div
              className="h-[7px] flex-1 overflow-hidden rounded-full bg-surface-raised"
              role="img"
              aria-label={`${label}: ${count} issues, ${percent}%`}
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${percent}%`, background: color }}
              />
            </div>
            <span className="w-8 text-right text-xs tabular-nums text-muted">
              {count}
            </span>
            <span className="w-9 text-right text-[11px] tabular-nums text-muted">
              {percent}%
            </span>
          </div>
        );
      })}
    </VStack>
  );
}

function UpcomingDeadlines({ issues, onOpenIssue }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekLimit = today.getTime() + 7 * 86400000;
  const openIssues = issues.filter((issue) => issue.status !== "done");
  const overdue = openIssues.filter((issue) => {
    const dueDate = issue.dueDate ? new Date(issue.dueDate).getTime() : NaN;
    return dueDate < today.getTime();
  }).length;
  const upcoming = openIssues
    .filter((issue) => {
      const dueDate = issue.dueDate ? new Date(issue.dueDate).getTime() : NaN;
      return dueDate >= today.getTime() && dueDate <= weekLimit;
    })
    .sort((left, right) => new Date(left.dueDate) - new Date(right.dueDate))
    .slice(0, 5);

  return (
    <PanelCard
      title="Due this week"
      description={
        overdue
          ? `${overdue} overdue · next 7 days`
          : "Upcoming deadlines from open issues"
      }
    >
      {upcoming.length ? (
        <ul className="flex flex-col gap-1">
          {upcoming.map((issue) => (
            <li key={issue.id}>
              <button
                type="button"
                onClick={() => onOpenIssue(issue.id)}
                className="flex w-full items-center justify-between gap-3 rounded-control px-2 py-2 text-left transition-colors hover:bg-surface-raised"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Clock3
                    size={14}
                    strokeWidth={1.5}
                    aria-hidden="true"
                    className="shrink-0 text-muted"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-medium text-primary">
                      {issue.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted">
                      {issue.key}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 text-[11px] text-muted">
                  {formatDueDate(issue.dueDate)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-5 text-sm text-muted">
          No open issues due in the next 7 days.
        </p>
      )}
    </PanelCard>
  );
}

function ProjectList({ projects, onCreateProject, onOpenProject }) {
  return (
    <PanelCard
      title="Active projects"
      description="Progress across your workspace"
      action={
        <TextAction icon={Plus} onClick={onCreateProject}>
          New project
        </TextAction>
      }
    >
      {projects.length ? (
        <ul className="flex flex-col">
          {projects.map((project, index) => (
            <li
              key={project.id}
              className={index ? "border-t border-border-subtle" : ""}
            >
              <button
                type="button"
                onClick={() => onOpenProject(project.id)}
                className="w-full rounded-control py-3 text-left transition-colors hover:bg-surface-raised"
              >
                <div className="flex items-center justify-between gap-3 px-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-icon bg-accent-soft text-accent">
                      <FolderKanban
                        size={16}
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-primary">
                        {project.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted">
                        {project.totalIssues} issues ·{" "}
                        {project.completedIssues} complete
                      </span>
                    </span>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-accent">
                    {project.progress}%
                  </span>
                </div>
                <div className="ml-[48px] mr-2 mt-3 h-1 overflow-hidden rounded-full bg-surface-raised">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-6 text-center text-sm text-muted">
          No projects yet. Create a project to start organizing work.
        </p>
      )}
    </PanelCard>
  );
}

function IssueActivity({ issues, onViewAll, onOpenIssue, memberName }) {
  return (
    <PanelCard
      title="Recent issues"
      description="Latest work from your teams"
      action={<TextAction onClick={onViewAll}>View all</TextAction>}
    >
      {issues.length ? (
        <ul className="flex flex-col">
          {issues.slice(0, 5).map((issue, index) => {
            const status = ISSUE_STATUS[issue.status] || {
              label: issue.status,
              variant: "neutral",
            };
            return (
              <li
                key={issue.id}
                className={index ? "border-t border-border-subtle" : ""}
              >
                <button
                  type="button"
                  onClick={() => onOpenIssue(issue.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-control px-2 py-3 text-left transition-colors hover:bg-surface-raised"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Icon
                      as={issue.status === "done" ? Check : CircleDot}
                      boxSize={4}
                      flexShrink={0}
                      color={issue.status === "done" ? "success" : "accent"}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-primary">
                        {issue.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted">
                        {issue.key} · {memberName(issue.assigneeId)}
                      </span>
                    </span>
                  </span>
                  <Badge variant={status.variant} flexShrink={0}>
                    {status.label}
                  </Badge>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-6 text-center text-sm text-muted">
          No issues to show yet.
        </p>
      )}
    </PanelCard>
  );
}

function CustomizePanel({ hiddenWidgets, onToggleWidget, onReset }) {
  const hiddenCount = hiddenWidgets.length;

  return (
    <Card
      id="dashboard-widget-preferences"
      variant="raised"
      className="p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-primary">
            Customize dashboard
          </h2>
          <p className="mt-1 text-xs text-muted">
            Turn widgets on or off for this workspace. Preferences are saved in
            this browser.
          </p>
        </div>
        {hiddenCount > 0 && (
          <TextAction onClick={onReset}>Reset to default</TextAction>
        )}
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {WIDGETS.map((widget) => (
          <div
            key={widget.id}
            className="flex items-center justify-between gap-3 rounded-control border border-border-subtle px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-primary">
                {widget.label}
              </p>
              {widget.description && (
                <p className="mt-0.5 truncate text-[11px] text-muted">
                  {widget.description}
                </p>
              )}
            </div>
            <Toggle
              checked={!hiddenWidgets.includes(widget.id)}
              onChange={(visible) => onToggleWidget(widget.id, visible)}
              label={`Show ${widget.label} widget`}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { activeWorkspace } = useAuth();
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [hiddenByWorkspace, setHiddenByWorkspace] = useState(() =>
    readWidgetPreferences(),
  );
  const now = useClock();
  const isOnline = useOnlineStatus();

  const workspaceKey = activeWorkspace?.id || "default";
  const hiddenWidgets = Array.isArray(hiddenByWorkspace[workspaceKey])
    ? hiddenByWorkspace[workspaceKey]
    : [];
  const isHidden = (widgetId) => hiddenWidgets.includes(widgetId);

  useEffect(() => {
    try {
      localStorage.setItem(
        WIDGET_STORAGE_KEY,
        JSON.stringify(hiddenByWorkspace),
      );
    } catch (error) {
      console.warn("Could not save dashboard widget preferences", error?.message);
    }
  }, [hiddenByWorkspace]);

  const setWidgetVisible = (widgetId, visible) => {
    setHiddenByWorkspace((current) => {
      const currentHidden = Array.isArray(current[workspaceKey])
        ? current[workspaceKey]
        : [];
      const nextHidden = visible
        ? currentHidden.filter((id) => id !== widgetId)
        : [...new Set([...currentHidden, widgetId])];
      return { ...current, [workspaceKey]: nextHidden };
    });
    const widget = WIDGETS.find((item) => item.id === widgetId);
    setAnnouncement(
      `${widget?.label || "Widget"} ${visible ? "shown" : "hidden"}.`,
    );
  };

  const resetWidgets = () => {
    setHiddenByWorkspace((current) => ({ ...current, [workspaceKey]: [] }));
    setAnnouncement("Dashboard widgets reset to default.");
  };

  const workspaceId = activeWorkspace?.id;
  const analyticsQuery = useQuery({
    queryKey: ["analytics", "workspace", workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: async () =>
      (
        await api.get(
          `/analytics/workspace?workspaceId=${encodeURIComponent(workspaceId)}&includeIssues=true`,
        )
      ).analytics,
  });
  const channelsQuery = useQuery({
    queryKey: ["channels", workspaceId, "dashboard"],
    enabled: Boolean(workspaceId),
    queryFn: async () =>
      (
        await api.get(
          `/channels?workspaceId=${encodeURIComponent(workspaceId)}`,
        )
      ).channels || [],
  });
  const membersQuery = useQuery({
    queryKey: ["workspace-members", workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: async () =>
      (
        await api.get(
          `/workspaces/${encodeURIComponent(workspaceId)}/members`,
        )
      ).members || [],
  });

  const projects = (analyticsQuery.data?.projects || []).map((project) => ({
    ...project,
    progress: project.totalIssues
      ? Math.round((project.completedIssues / project.totalIssues) * 100)
      : 0,
  }));
  const issues = (analyticsQuery.data?.issues || []).map((issue) => ({
    ...issue,
    key: issue.issueKey || issue.id,
  }));
  const channels = channelsQuery.data || [];
  const summary = analyticsQuery.data?.summary;
  const statusCounts = analyticsQuery.data?.statusCounts || {};
  const membersById = new Map(
    (membersQuery.data || []).map((member) => [
      member.userId,
      member.profile?.displayName || "Workspace member",
    ]),
  );
  const memberName = (userId) =>
    userId ? membersById.get(userId) || "Workspace member" : "Unassigned";

  const openIssues = issues.filter((issue) => issue.status !== "done");
  const assignedIssues = issues.filter((issue) => issue.assigneeId).length;
  const unassignedIssues = issues.length - assignedIssues;
  const projectProgress = projects.length
    ? Math.round(
        projects.reduce((total, project) => total + project.progress, 0) /
          projects.length,
      )
    : 0;
  const publicChannels = channels.filter(
    (channel) => channel.visibility !== "private",
  ).length;
  const privateChannels = channels.length - publicChannels;

  const isRefreshing =
    analyticsQuery.isFetching ||
    channelsQuery.isFetching ||
    membersQuery.isFetching;
  const freshnessLabel = !activeWorkspace
    ? "No workspace selected"
    : !isOnline
      ? "Offline — showing the last loaded data"
      : isRefreshing
        ? "Refreshing workspace data…"
        : formatUpdatedAgo(analyticsQuery.dataUpdatedAt, now);
  const freshnessDotClass = !activeWorkspace
    ? "bg-muted"
    : !isOnline
      ? "bg-warning"
      : isRefreshing
        ? "animate-pulse bg-accent"
        : analyticsQuery.dataUpdatedAt
          ? "bg-success"
          : "bg-muted";

  const refreshDashboard = () => {
    if (!workspaceId) return;
    void Promise.all([
      analyticsQuery.refetch(),
      channelsQuery.refetch(),
      membersQuery.refetch(),
    ]);
  };

  const openAnalyticsError = analyticsQuery.error
    ? analyticsQuery.error.message || "Workspace analytics are unavailable."
    : null;
  const channelsError = channelsQuery.error
    ? channelsQuery.error.message || "Workspace channels are unavailable."
    : null;

  const exportIssues = (rows, filename) =>
    exportCsv(
      filename,
      ["Key", "Title", "Status", "Priority", "Assignee", "Due date"],
      rows.map((issue) => [
        issue.key,
        issue.title,
        issue.status,
        issue.priority,
        memberName(issue.assigneeId),
        issue.dueDate,
      ]),
    );

  const activeChannelsCaption = channels.length
    ? `${publicChannels} public · ${privateChannels} private`
    : "No channels yet";

  const statCards = [
    {
      id: "openIssues",
      label: "Open issues",
      value: openIssues.length,
      icon: Bug,
      caption:
        summary?.overdueIssues > 0
          ? `${summary.overdueIssues} overdue`
          : summary?.dueSoonIssues > 0
            ? `${summary.dueSoonIssues} due this week`
            : "No overdue work",
      attention: Boolean(summary?.overdueIssues),
      loading: analyticsQuery.isPending,
      error: openAnalyticsError,
      onViewDetails: () => navigate("/issues"),
      onExportCsv: () => exportIssues(openIssues, "open-issues.csv"),
      onHide: () => setWidgetVisible("openIssues", false),
    },
    {
      id: "activeChannels",
      label: "Active channels",
      value: channels.length,
      icon: Hash,
      caption: activeChannelsCaption,
      loading: channelsQuery.isPending,
      error: channelsError,
      onViewDetails: () => navigate("/channels"),
      onExportCsv: () =>
        exportCsv(
          "channels.csv",
          ["Name", "Visibility", "Topic"],
          channels.map((channel) => [
            channel.name,
            channel.visibility,
            channel.topic,
          ]),
        ),
      onHide: () => setWidgetVisible("activeChannels", false),
    },
    {
      id: "assignedIssues",
      label: "Assigned issues",
      value: assignedIssues,
      icon: Users,
      caption: issues.length
        ? `${unassignedIssues} unassigned`
        : "No issues yet",
      loading: analyticsQuery.isPending,
      error: openAnalyticsError,
      onViewDetails: () => navigate("/issues"),
      onExportCsv: () =>
        exportIssues(
          issues.filter((issue) => issue.assigneeId),
          "assigned-issues.csv",
        ),
      onHide: () => setWidgetVisible("assignedIssues", false),
    },
    {
      id: "projectProgress",
      label: "Project progress",
      value: `${projectProgress}%`,
      icon: FolderKanban,
      featured: true,
      caption: projects.length
        ? `${projects.length} projects · ${summary?.completedIssues ?? 0}/${summary?.totalIssues ?? 0} done`
        : "No projects yet",
      loading: analyticsQuery.isPending,
      error: openAnalyticsError,
      onViewDetails: () => navigate("/projects"),
      onExportCsv: () =>
        exportCsv(
          "projects.csv",
          ["Project", "Total issues", "Completed", "Active", "Progress"],
          projects.map((project) => [
            project.name,
            project.totalIssues,
            project.completedIssues,
            project.activeIssues,
            `${project.progress}%`,
          ]),
        ),
      onHide: () => setWidgetVisible("projectProgress", false),
    },
  ].filter((card) => !isHidden(card.id));

  const showStatus = !isHidden("status");
  const showDeadlines = !isHidden("deadlines");
  const showProjects = !isHidden("projects");
  const showRecentIssues = !isHidden("recentIssues");

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>

      {!activeWorkspace && (
        <Card className="p-5">
          <HStack
            justify="space-between"
            align={{ base: "flex-start", sm: "center" }}
            flexDirection={{ base: "column", sm: "row" }}
            gap={4}
          >
            <Box>
              <Text fontWeight="600">Set up your workspace</Text>
              <Text mt={1} color="textSecondary" fontSize="sm">
                Create a workspace to organize your team and projects.
              </Text>
            </Box>
            <Button variant="primary" onClick={() => navigate("/workspace")}>
              Create workspace
            </Button>
          </HStack>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-[24px] font-semibold leading-tight tracking-[-0.03em] text-primary md:text-[28px]">
            {activeWorkspace?.name || "Workspace overview"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span
              className={`h-[7px] w-[7px] rounded-full ${freshnessDotClass}`}
              aria-hidden="true"
            />
            <span>{freshnessLabel}</span>
            {summary && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  {summary.totalIssues} issues across {summary.projectCount}{" "}
                  projects
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="icon"
            aria-label="Refresh dashboard"
            title="Refresh dashboard"
            onClick={refreshDashboard}
            disabled={!activeWorkspace || isRefreshing}
          >
            <RefreshCw
              size={15}
              strokeWidth={1.5}
              aria-hidden="true"
              className={isRefreshing ? "animate-spin" : ""}
            />
          </Button>
          <Button
            variant="secondary"
            aria-expanded={customizeOpen}
            aria-controls="dashboard-widget-preferences"
            onClick={() => setCustomizeOpen((open) => !open)}
          >
            <Settings2 size={14} strokeWidth={1.5} aria-hidden="true" />
            Customize
          </Button>
          <Button
            variant="primary"
            onClick={() => navigate("/projects", { state: { create: true } })}
          >
            <Plus size={15} strokeWidth={1.5} aria-hidden="true" />
            Create project
          </Button>
        </div>
      </div>

      {customizeOpen && (
        <CustomizePanel
          hiddenWidgets={hiddenWidgets}
          onToggleWidget={setWidgetVisible}
          onReset={resetWidgets}
        />
      )}

      {activeWorkspace && (
        <section aria-label="Key metrics">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <StatCard key={card.id} {...card} />
            ))}
          </div>
          {!statCards.length && (
            <p className="text-sm text-muted">
              All summary metrics are hidden. Use Customize to restore them.
            </p>
          )}
        </section>
      )}

      {activeWorkspace && analyticsQuery.isPending && (
        <Card className="p-4 sm:p-5">
          <LoadingState label="Loading workspace activity…" />
        </Card>
      )}

      {openAnalyticsError && (
        <InlineErrorCard
          title="Workspace analytics are unavailable"
          message={openAnalyticsError}
          onRetry={refreshDashboard}
        />
      )}

      {analyticsQuery.isSuccess && (
        <>
          {(showStatus || showDeadlines) && (
            <div
              className={
                showStatus && showDeadlines
                  ? "grid grid-cols-1 gap-4 lg:grid-cols-3"
                  : "grid grid-cols-1 gap-4"
              }
            >
              {showStatus && (
                <div
                  className={
                    showStatus && showDeadlines ? "lg:col-span-2" : undefined
                  }
                >
                  <PanelCard
                    title="Work by status"
                    description="Current issue distribution across accessible projects."
                  >
                    <StatusBreakdown
                      counts={statusCounts}
                      total={summary?.totalIssues || 0}
                    />
                  </PanelCard>
                </div>
              )}
              {showDeadlines && (
                <UpcomingDeadlines
                  issues={issues}
                  onOpenIssue={(issueId) => navigate(`/issues/${issueId}`)}
                />
              )}
            </div>
          )}

          {(showProjects || showRecentIssues) && (
            <div
              className={
                showProjects && showRecentIssues
                  ? "grid grid-cols-1 gap-4 lg:grid-cols-2"
                  : "grid grid-cols-1 gap-4"
              }
            >
              {showProjects && (
                <ProjectList
                  projects={projects}
                  onCreateProject={() => navigate("/projects", { state: { create: true } })}
                  onOpenProject={(projectId) =>
                    navigate(`/projects/${projectId}`)
                  }
                />
              )}
              {showRecentIssues && (
                <IssueActivity
                  issues={issues}
                  onViewAll={() => navigate("/issues")}
                  onOpenIssue={(issueId) => navigate(`/issues/${issueId}`)}
                  memberName={memberName}
                />
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted">
            <Clock3 size={13} strokeWidth={1.5} aria-hidden="true" />
            <span>
              {summary?.totalIssues ?? 0} issues across{" "}
              {summary?.projectCount ?? 0} projects
              {summary?.completedIssues
                ? ` · ${summary.completedIssues} completed`
                : ""}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardPage;
