import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  HStack,
  Icon,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  Bug,
  Check,
  CircleDot,
  Clock3,
  FolderKanban,
  Plus,
  Settings2,
  Users,
  Hash,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import GlassCard from "../../components/ui/GlassCard.jsx";
import { useAuth } from "../../contexts/useAuth.jsx";
import { api } from "../../services/apiClient.js";

const STATUS_COLORS = {
  done: "green",
  in_progress: "orange",
  in_review: "yellow",
  todo: "gray",
};

function MetricCard({ label, value, caption, icon: MetricIcon, index }) {
  return (
    <GlassCard
      variant={index === 3 ? "featured" : "lg"}
      className="min-w-0 p-4 sm:p-5"
    >
      <HStack justify="space-between" align="start">
        <Box minW="0">
          <Text
            fontSize="xs"
            color={index === 3 ? "whiteAlpha.900" : "textSecondary"}
          >
            {label}
          </Text>
          <Text
            mt={2}
            fontSize={{ base: "2xl", md: "3xl" }}
            fontWeight="700"
            letterSpacing="-0.04em"
            lineHeight="1"
          >
            {value}
          </Text>
        </Box>
        <Box
          display="grid"
          placeItems="center"
          w="34px"
          h="34px"
          borderRadius="10px"
          bg={index === 3 ? "whiteAlpha.200" : "accentSoft"}
          color={index === 3 ? "white" : "accent"}
        >
          <Icon as={MetricIcon} boxSize={4} />
        </Box>
      </HStack>
      <HStack mt={4} spacing={2} minW="0">
        <Text
          fontSize="10px"
          color={index === 3 ? "whiteAlpha.800" : "textMuted"}
          noOfLines={1}
        >
          {caption}
        </Text>
      </HStack>
    </GlassCard>
  );
}

function StatusBreakdown({ counts }) {
  const statuses = [
    ["backlog", "Backlog", "textMuted"],
    ["todo", "To do", "gray.400"],
    ["in_progress", "In progress", "accent"],
    ["in_review", "In review", "warning"],
    ["done", "Done", "success"],
  ];
  const maximum = Math.max(1, ...statuses.map(([key]) => counts[key] || 0));
  return (
    <GlassCard className="p-4 sm:p-5">
      <Text fontSize="sm" fontWeight="600">Work by status</Text>
      <Text mt={1} mb={4} fontSize="xs" color="textMuted">Current issue distribution across accessible projects.</Text>
      <VStack align="stretch" spacing={3}>
        {statuses.map(([key, label, color]) => (
          <HStack key={key} spacing={3}>
            <Text w="90px" fontSize="xs" color="textSecondary">{label}</Text>
            <Box flex={1} h="7px" borderRadius="full" bg="surfaceRaised">
              <Box
                h="full"
                w={`${((counts[key] || 0) / maximum) * 100}%`}
                borderRadius="full"
                bg={color}
              />
            </Box>
            <Text w="24px" textAlign="right" fontSize="xs" color="textMuted">{counts[key] || 0}</Text>
          </HStack>
        ))}
      </VStack>
    </GlassCard>
  );
}

function UpcomingDeadlines({ issues, onOpenIssue }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekLimit = today.getTime() + 7 * 86400000;
  const upcoming = issues
    .filter((issue) => {
      const dueDate = issue.dueDate ? new Date(issue.dueDate).getTime() : NaN;
      return issue.status !== "done" && dueDate >= today.getTime() && dueDate <= weekLimit;
    })
    .sort((left, right) => new Date(left.dueDate) - new Date(right.dueDate))
    .slice(0, 5);
  return (
    <GlassCard className="p-4 sm:p-5">
      <Text fontSize="sm" fontWeight="600">Due this week</Text>
      <Text mt={1} mb={3} fontSize="xs" color="textMuted">Upcoming deadlines from open issues.</Text>
      <VStack align="stretch" spacing={2}>
        {upcoming.map((issue) => (
          <Button
            key={issue.id}
            variant="ghost"
            h="auto"
            px={2}
            py={2}
            justifyContent="space-between"
            onClick={() => onOpenIssue(issue.id)}
          >
            <Text noOfLines={1} fontSize="xs">{issue.title}</Text>
            <Text flexShrink={0} ml={2} fontSize="10px" color="textMuted">
              {new Date(issue.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </Text>
          </Button>
        ))}
        {!upcoming.length && <Text py={5} color="textMuted" fontSize="sm">No open issues due in the next 7 days.</Text>}
      </VStack>
    </GlassCard>
  );
}

function ProjectList({ projects, onCreateProject }) {
  return (
    <GlassCard className="p-4 sm:p-5">
      <HStack justify="space-between" mb={4}>
        <Box>
          <Text fontSize="sm" fontWeight="600">
            Active projects
          </Text>
          <Text
            mt={1}
            fontSize="xs"
            color="textMuted"
          >
            Progress across your workspace
          </Text>
        </Box>
        <Button
          leftIcon={<Plus size={13} />}
          variant="ghost"
          size="xs"
          color="accent"
          _hover={{ color: "accentHot", bg: "accentSoft" }}
          onClick={onCreateProject}
        >
          New project
        </Button>
      </HStack>

      <VStack align="stretch" spacing={0}>
        {projects.length === 0 && (
          <Text
            py={8}
            textAlign="center"
            fontSize="sm"
            color="textMuted"
          >
            No projects yet. Create a project to start organizing work.
          </Text>
        )}
        {projects.map((project, index) => (
          <Box
            key={project.id}
            py={3}
            borderTop={index === 0 ? "none" : "1px solid"}
            borderColor="borderSubtle"
          >
            <HStack justify="space-between" gap={3}>
              <HStack minW="0" spacing={3}>
                <Box
                  display="grid"
                  placeItems="center"
                  w="34px"
                  h="34px"
                  flexShrink={0}
                  borderRadius="9px"
                  bg="accentSoft"
                  color="accent"
                >
                  <Icon as={FolderKanban} boxSize={4} />
                </Box>
                <Box minW="0">
                  <Text fontSize="xs" fontWeight="600" noOfLines={1}>
                    {project.name}
                  </Text>
                  <Text
                    mt={0.5}
                    fontSize="10px"
                    color="textMuted"
                    noOfLines={1}
                  >
                    {project.totalIssues} issues · {project.completedIssues} complete
                  </Text>
                </Box>
              </HStack>
              <Text
                flexShrink={0}
                fontSize="xs"
                fontWeight="600"
                color="accent"
              >
                {project.progress}%
              </Text>
            </HStack>
            <Box
              h="4px"
              mt={3}
              ml="46px"
              borderRadius="full"
              bg="borderSubtle"
              overflow="hidden"
            >
              <Box
                h="full"
                w={`${project.progress}%`}
                borderRadius="full"
                bg="accent"
              />
            </Box>
          </Box>
        ))}
      </VStack>
    </GlassCard>
  );
}

function IssueActivity({ issues, onViewAll, memberName }) {
  return (
    <GlassCard className="p-4 sm:p-5">
      <HStack justify="space-between" mb={4}>
        <Box>
          <Text fontSize="sm" fontWeight="600">
            Recent issues
          </Text>
          <Text
            mt={1}
            fontSize="xs"
            color="textMuted"
          >
            Latest work from your teams
          </Text>
        </Box>
        <Button
          variant="ghost"
          size="xs"
          color="accent"
          _hover={{ color: "accentHot", bg: "accentSoft" }}
          onClick={onViewAll}
        >
          View all
        </Button>
      </HStack>
      <VStack align="stretch" spacing={0}>
        {issues.length === 0 && (
          <Text
            py={8}
            textAlign="center"
            fontSize="sm"
            color="textMuted"
          >
            No issues to show yet.
          </Text>
        )}
        {issues.slice(0, 5).map((issue, index) => (
          <HStack
            key={issue.id}
            justify="space-between"
            gap={3}
            py={3}
            borderTop={index === 0 ? "none" : "1px solid"}
            borderColor="borderSubtle"
          >
            <HStack minW="0" spacing={2.5}>
              <Icon
                as={issue.status === "done" ? Check : CircleDot}
                boxSize={4}
                flexShrink={0}
                color={issue.status === "done" ? "success" : "accent"}
              />
              <Box minW="0">
                <Text fontSize="xs" fontWeight="600" noOfLines={1}>
                  {issue.title}
                </Text>
                <Text
                  mt={0.5}
                  fontSize="10px"
                  color="textMuted"
                  noOfLines={1}
                >
                  {issue.key} · {memberName(issue.assigneeId)}
                </Text>
              </Box>
            </HStack>
            <Badge
              flexShrink={0}
              colorScheme={STATUS_COLORS[issue.status] || "gray"}
              variant="subtle"
              borderRadius="full"
              px={2}
              fontSize="9px"
              textTransform="capitalize"
            >
              {issue.status.replace("_", " ")}
            </Badge>
          </HStack>
        ))}
      </VStack>
    </GlassCard>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { activeWorkspace, user } = useAuth();
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [hiddenByWorkspace, setHiddenByWorkspace] = useState(() => {
    try {
      const preferences = JSON.parse(
        localStorage.getItem("workstation-dashboard-widgets") || "{}",
      );
      return preferences && typeof preferences === "object" && !Array.isArray(preferences)
        ? preferences
        : {};
    } catch (error) {
      console.warn("Could not load dashboard widget preferences", error?.message);
      return {};
    }
  });
  const workspaceKey = activeWorkspace?.id || "default";
  const hiddenWidgets = Array.isArray(hiddenByWorkspace[workspaceKey])
    ? hiddenByWorkspace[workspaceKey]
    : [];
  useEffect(() => {
    try {
      localStorage.setItem(
        "workstation-dashboard-widgets",
        JSON.stringify(hiddenByWorkspace),
      );
    } catch (error) {
      console.warn("Could not save dashboard widget preferences", error?.message);
    }
  }, [hiddenByWorkspace]);
  const setWidgetVisibility = (widgetId, visible) => {
    setHiddenByWorkspace((current) => {
      const currentHidden = current[workspaceKey] || [];
      const nextHidden = visible
        ? currentHidden.filter((id) => id !== widgetId)
        : [...new Set([...currentHidden, widgetId])];
      return { ...current, [workspaceKey]: nextHidden };
    });
  };
  const workspaceId = activeWorkspace?.id;
  const analyticsQuery = useQuery({
    queryKey: ["analytics", "workspace", workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: async () =>
      (await api.get(
        `/analytics/workspace?workspaceId=${encodeURIComponent(workspaceId)}&includeIssues=true`,
      )).analytics,
  });
  const channelsQuery = useQuery({
    queryKey: ["channels", workspaceId, "dashboard"],
    enabled: Boolean(workspaceId),
    queryFn: async () =>
      (await api.get(`/channels?workspaceId=${encodeURIComponent(workspaceId)}`)).channels || [],
  });
  const membersQuery = useQuery({
    queryKey: ["workspace-members", workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: async () =>
      (await api.get(`/workspaces/${encodeURIComponent(workspaceId)}/members`)).members || [],
  });
  const notificationsQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    enabled: Boolean(user?.uid),
    refetchInterval: 60_000,
    queryFn: async () => {
      const response = await api.get("/notifications?limit=1");
      return response.unreadCount || 0;
    },
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
  const projectProgress = projects.length
    ? Math.round(
        projects.reduce(
          (total, project) =>
            total +
            (project.totalIssues
              ? (project.completedIssues / project.totalIssues) * 100
              : 0),
          0,
        ) /
          projects.length,
      )
    : 0;
  const unreadNotifications = notificationsQuery.data;

  const metrics = [
    {
      label: "Open issues",
      value: openIssues.length,
      caption: "Need team attention",
      icon: Bug,
    },
    {
      label: "Active channels",
      value: channels.length,
      caption: "Workspace conversations",
      icon: Hash,
    },
    {
      label: "Assigned issues",
      value: assignedIssues,
      caption: notificationsQuery.isError
        ? "Unread notification count unavailable"
        : `${unreadNotifications ?? 0} unread updates`,
      icon: Users,
    },
    {
      label: "Project progress",
      value: `${projectProgress}%`,
      caption: "Average across active projects",
      icon: FolderKanban,
    },
  ];

  return (
    <Box display="flex" flexDirection="column" gap={{ base: 5, lg: 6 }}>
      {!activeWorkspace && (
        <GlassCard className="p-5">
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
            <Button
              variant="unstyled"
              className="ui-button ui-button--primary"
              onClick={() => navigate("/workspace")}
              flexShrink={0}
              minH="38px"
              px={4}
            >
              Create workspace
            </Button>
          </HStack>
        </GlassCard>
      )}
      <HStack
        justify="space-between"
        align={{ base: "flex-start", sm: "center" }}
        flexDirection={{ base: "column", sm: "row" }}
        gap={3}
      >
        <Box>
          <Text
            fontSize={{ base: "2xl", md: "3xl" }}
            fontWeight="700"
            letterSpacing="-0.035em"
          >
            {activeWorkspace?.name || "Workspace overview"}
          </Text>
          <HStack mt={2} spacing={2} color="textMuted">
            <Box
              aria-hidden="true"
              w="7px"
              h="7px"
              borderRadius="full"
              bg="success"
              boxShadow="0 0 0 3px var(--success-soft)"
            />
            <Text fontSize="xs">Workspace data from connected services</Text>
          </HStack>
        </Box>
        <HStack flexWrap="wrap">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Settings2 size={14} />}
            aria-expanded={customizeOpen}
            aria-controls="dashboard-widget-preferences"
            onClick={() => setCustomizeOpen((open) => !open)}
          >
            Customize
          </Button>
          <Button
            leftIcon={<Plus size={15} />}
            variant="unstyled"
            className="ui-button ui-button--primary"
            h="40px"
            flexShrink={0}
            onClick={() => navigate("/projects")}
          >
            Create project
          </Button>
        </HStack>
      </HStack>

      {analyticsQuery.error && (
        <Alert status="error" borderRadius="16px">
          <AlertIcon />
          {analyticsQuery.error.message || "Workspace analytics are unavailable."}
        </Alert>
      )}
      {channelsQuery.error && (
        <Alert status="error" borderRadius="16px">
          <AlertIcon />
          {channelsQuery.error.message || "Workspace channels are unavailable."}
        </Alert>
      )}
      {notificationsQuery.error && (
        <Alert status="error" borderRadius="warning">
          <AlertIcon />
          Unread notification count is unavailable.
        </Alert>
      )}
      {activeWorkspace && analyticsQuery.isPending && (
        <HStack py={8} justify="center" role="status">
          <Spinner color="accent" />
          <Text color="textSecondary">Loading workspace overview…</Text>
        </HStack>
      )}

      {customizeOpen && (
        <GlassCard id="dashboard-widget-preferences" className="p-4">
          <Text mb={3} fontSize="sm" fontWeight="600">Dashboard widgets</Text>
          <HStack spacing={4} flexWrap="wrap">
            {[
              ["metrics", "Summary metrics"],
              ["activity", "Activity charts"],
              ["projects", "Active projects"],
              ["issues", "Recent issues"],
            ].map(([id, label]) => (
              <Checkbox
                key={id}
                isChecked={!hiddenWidgets.includes(id)}
                onChange={(event) =>
                  setWidgetVisibility(id, event.target.checked)
                }
              >
                {label}
              </Checkbox>
            ))}
          </HStack>
        </GlassCard>
      )}

      {analyticsQuery.isSuccess && !hiddenWidgets.includes("metrics") && (
        <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4}>
          {metrics.map((metric, index) => (
            <MetricCard key={metric.label} {...metric} index={index} />
          ))}
        </SimpleGrid>
      )}

      {analyticsQuery.isSuccess && !hiddenWidgets.includes("activity") && (
        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={4}>
          <Box gridColumn={{ base: "auto", lg: "span 2" }}>
            <StatusBreakdown counts={analyticsQuery.data.statusCounts || {}} />
          </Box>
          <UpcomingDeadlines
            issues={issues}
            onOpenIssue={(issueId) => navigate(`/issues/${issueId}`)}
          />
        </SimpleGrid>
      )}

      {analyticsQuery.isSuccess &&
        (!hiddenWidgets.includes("projects") ||
        !hiddenWidgets.includes("issues")) && (
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
          {!hiddenWidgets.includes("projects") && (
            <ProjectList
              projects={projects}
              onCreateProject={() => navigate("/projects")}
            />
          )}
          {!hiddenWidgets.includes("issues") && (
            <IssueActivity
              issues={issues}
              onViewAll={() => navigate("/issues")}
              memberName={memberName}
            />
          )}
        </SimpleGrid>
      )}

      {analyticsQuery.isSuccess && (
        <HStack spacing={2} color="textMuted" fontSize="xs">
          <Clock3 size={13} />
          <Text>{analyticsQuery.data.summary.totalIssues} issues across {analyticsQuery.data.summary.projectCount} projects</Text>
        </HStack>
      )}
    </Box>
  );
}

export default DashboardPage;
