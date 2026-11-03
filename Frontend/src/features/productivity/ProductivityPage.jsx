import { useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Save,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Card from "../../components/ui/Card.jsx";
import { useAuth } from "../../contexts/useAuth.jsx";
import { api } from "../../services/apiClient.js";

const STATUSES = ["backlog", "todo", "in_progress", "in_review", "done"];
const TYPES = ["epic", "story", "task", "bug", "subtask"];
const PRIORITIES = ["lowest", "low", "medium", "high", "highest"];
const EMPTY_ISSUES = [];
const EMPTY_FILTERS = {
  projectId: "",
  status: "all",
  type: "all",
  priority: "all",
  assigneeId: "",
  dueDateFrom: "",
  dueDateTo: "",
  search: "",
  sprintId: "",
};

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value._seconds === "number") return new Date(value._seconds * 1000);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateKey(value) {
  const date = toDate(value);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateLabel(value) {
  const date = toDate(value);
  return date
    ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date)
    : "No due date";
}

function issueMatches(issue, filters) {
  const issueDueDate = dateKey(issue.dueDate);
  return (
    (!filters.status || filters.status === "all" || issue.status === filters.status) &&
    (!filters.type || filters.type === "all" || issue.type === filters.type) &&
    (!filters.priority || filters.priority === "all" || issue.priority === filters.priority) &&
    (!filters.assigneeId ||
      (filters.assigneeId === "unassigned"
        ? !issue.assigneeId
        : issue.assigneeId === filters.assigneeId)) &&
    (!filters.dueDateFrom || (issueDueDate && issueDueDate >= filters.dueDateFrom)) &&
    (!filters.dueDateTo || (issueDueDate && issueDueDate <= filters.dueDateTo)) &&
    (!filters.sprintId || issue.sprintId === filters.sprintId) &&
    (!filters.search ||
      `${issue.title} ${issue.description || ""} ${issue.issueKey || ""}`
        .toLowerCase()
        .includes(filters.search.toLowerCase()))
  );
}

function Metric({ label, value, caption }) {
  return (
    <Card className="p-4">
      <Text color="textMuted" fontSize="xs">{label}</Text>
      <Text mt={2} fontSize="2xl" fontWeight="700">{value}</Text>
      <Text mt={1} color="textMuted" fontSize="xs">{caption}</Text>
    </Card>
  );
}

function CalendarView({ issues, month, onMonthChange }) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(
    firstDay.getFullYear(),
    firstDay.getMonth(),
    1 - ((firstDay.getDay() + 6) % 7),
  );
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
  const dueByDate = new Map();
  issues.forEach((issue) => {
    const key = dateKey(issue.dueDate);
    if (key) dueByDate.set(key, [...(dueByDate.get(key) || []), issue]);
  });

  return (
    <Card className="p-4">
      <HStack justify="space-between" mb={4}>
        <Text fontWeight="700">
          {new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(month)}
        </Text>
        <HStack>
          <Button aria-label="Previous month" size="sm" variant="ghost" onClick={() => onMonthChange(-1)}>
            <ChevronLeft size={16} />
          </Button>
          <Button aria-label="Next month" size="sm" variant="ghost" onClick={() => onMonthChange(1)}>
            <ChevronRight size={16} />
          </Button>
        </HStack>
      </HStack>
      <Box display="grid" gridTemplateColumns="repeat(7, minmax(0, 1fr))" gap={1}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <Text key={day} py={2} textAlign="center" color="textMuted" fontSize="xs">
            {day}
          </Text>
        ))}
        {days.map((day) => {
          const key = dateKey(day);
          const items = dueByDate.get(key) || [];
          const isCurrentMonth = day.getMonth() === month.getMonth();
          return (
            <Box
              key={key}
              minH={{ base: "74px", md: "100px" }}
              p={{ base: 1, md: 2 }}
              border="1px solid"
              borderColor="borderSubtle"
              borderRadius="10px"
              opacity={isCurrentMonth ? 1 : 0.45}
              overflow="hidden"
            >
              <Text fontSize="xs" color="textMuted">{day.getDate()}</Text>
              <VStack align="stretch" spacing={1} mt={1}>
                {items.slice(0, 2).map((issue) => (
                  <Box key={issue.id} px={1.5} py={1} borderRadius="5px" bg="accentSoft">
                    <Text fontSize="10px" color="accent" noOfLines={1}>{issue.title}</Text>
                  </Box>
                ))}
                {items.length > 2 && (
                  <Text fontSize="9px" color="textMuted">+{items.length - 2} more</Text>
                )}
              </VStack>
            </Box>
          );
        })}
      </Box>
    </Card>
  );
}

function TimelineView({ issues }) {
  const rangeStart = new Date();
  rangeStart.setHours(0, 0, 0, 0);
  rangeStart.setDate(rangeStart.getDate() - ((rangeStart.getDay() + 6) % 7));
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeStart.getDate() + 56);
  const rangeStartTime = rangeStart.getTime();
  const rangeLength = rangeEnd.getTime() - rangeStartTime;
  const visible = issues
    .filter((issue) => {
      const dueDate = toDate(issue.dueDate);
      const referenceDate = dueDate || toDate(issue.createdAt);
      return (
        referenceDate &&
        referenceDate.getTime() >= rangeStartTime &&
        referenceDate.getTime() <= rangeEnd.getTime()
      );
    })
    .slice(0, 60);
  const ticks = Array.from({ length: 9 }, (_, index) => {
    const date = new Date(rangeStart);
    date.setDate(date.getDate() + index * 7);
    return date;
  });

  return (
    <Card className="overflow-x-auto p-4">
      <Box minW="760px">
        <Box display="grid" gridTemplateColumns="240px minmax(0, 1fr)" gap={3} mb={3}>
          <Text color="textMuted" fontSize="xs">Work item</Text>
          <Box display="grid" gridTemplateColumns="repeat(9, minmax(0, 1fr))">
            {ticks.map((date) => (
              <Text key={date.toISOString()} color="textMuted" fontSize="10px">
                {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </Text>
            ))}
          </Box>
        </Box>
        <VStack align="stretch" spacing={2}>
          {visible.map((issue) => {
            const due = toDate(issue.dueDate);
            const created = toDate(issue.createdAt) || due;
            const start = Math.max(rangeStartTime, created.getTime());
            const end = Math.min(rangeEnd.getTime(), due?.getTime() || start + 86400000 * 3);
            const left = Math.max(0, ((start - rangeStartTime) / rangeLength) * 100);
            const width = Math.max(2, Math.min(100 - left, ((end - start) / rangeLength) * 100));
            return (
              <Box
                key={issue.id}
                display="grid"
                gridTemplateColumns="240px minmax(0, 1fr)"
                gap={3}
                alignItems="center"
                minH="38px"
              >
                <Box minW="0">
                  <Text fontSize="xs" fontWeight="600" noOfLines={1}>{issue.title}</Text>
                  <Text color="textMuted" fontSize="10px">{issue.issueKey || issue.id} · {dateLabel(issue.dueDate)}</Text>
                </Box>
                <Box position="relative" h="28px" borderRadius="full" bg="surfaceRaised">
                  <Box
                    position="absolute"
                    left={`${Math.min(98, left)}%`}
                    w={`${width}%`}
                    top="7px"
                    h="14px"
                    borderRadius="full"
                    bg={issue.status === "done" ? "success" : "accent"}
                    opacity={0.82}
                    title={`${issue.title}: ${dateLabel(issue.dueDate)}`}
                  />
                </Box>
              </Box>
            );
          })}
          {!visible.length && (
            <Text py={8} color="textMuted" textAlign="center" fontSize="sm">
              Add due dates to issues to see them on the timeline.
            </Text>
          )}
        </VStack>
      </Box>
    </Card>
  );
}

export default function ProductivityPage() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [targetSprintId, setTargetSprintId] = useState("");
  const [savedViewName, setSavedViewName] = useState("");
  const [selectedIssueIds, setSelectedIssueIds] = useState([]);
  const [sprintName, setSprintName] = useState("");
  const [sprintGoal, setSprintGoal] = useState("");
  const [sprintStart, setSprintStart] = useState("");
  const [sprintEnd, setSprintEnd] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const workspaceId = activeWorkspace?.id;

  const analyticsQuery = useQuery({
    queryKey: ["analytics", "workspace", workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: async () =>
      (await api.get(
        `/analytics/workspace?workspaceId=${encodeURIComponent(workspaceId)}&includeIssues=true`,
      )).analytics,
  });
  const projects = analyticsQuery.data?.projects || [];
  const allIssues = analyticsQuery.data?.issues ?? EMPTY_ISSUES;
  const issues = useMemo(
    () => allIssues.filter((issue) => {
      if (filters.projectId && issue.projectId !== filters.projectId) return false;
      return issueMatches(issue, filters);
    }),
    [allIssues, filters],
  );
  const membersQuery = useQuery({
    queryKey: ["workspace-members", workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: async () =>
      (await api.get(`/workspaces/${encodeURIComponent(workspaceId)}/members`)).members || [],
  });
  const savedViewsQuery = useQuery({
    queryKey: ["saved-issue-views", workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: async () =>
      (await api.get(`/issues/views?workspaceId=${encodeURIComponent(workspaceId)}`)).views || [],
  });
  const currentProjectId = filters.projectId || projects[0]?.id || "";
  const sprintsQuery = useQuery({
    queryKey: ["sprints", currentProjectId],
    enabled: Boolean(currentProjectId),
    queryFn: async () =>
      (await api.get(`/sprints?projectId=${encodeURIComponent(currentProjectId)}`)).sprints || [],
  });

  const createViewMutation = useMutation({
    mutationFn: async () => api.post("/issues/views", {
      workspaceId,
      name: savedViewName.trim(),
      filters: { ...filters, projectId: filters.projectId || undefined },
    }),
    onSuccess: async () => {
      setSavedViewName("");
      await queryClient.invalidateQueries({ queryKey: ["saved-issue-views", workspaceId] });
    },
  });
  const removeViewMutation = useMutation({
    mutationFn: async (viewId) =>
      api.delete(`/issues/views/${encodeURIComponent(viewId)}?workspaceId=${encodeURIComponent(workspaceId)}`),
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["saved-issue-views", workspaceId] }),
  });
  const createSprintMutation = useMutation({
    mutationFn: async () => api.post("/sprints", {
      projectId: currentProjectId,
      name: sprintName.trim(),
      goal: sprintGoal.trim(),
      startDate: sprintStart,
      endDate: sprintEnd,
    }),
    onSuccess: async () => {
      setSprintName("");
      setSprintGoal("");
      await queryClient.invalidateQueries({ queryKey: ["sprints", currentProjectId] });
    },
  });
  const assignIssuesMutation = useMutation({
    mutationFn: async (sprintId) =>
      api.put(`/sprints/${encodeURIComponent(sprintId)}/issues`, { issueIds: selectedIssueIds }),
    onSuccess: async () => {
      setSelectedIssueIds([]);
      await queryClient.invalidateQueries({ queryKey: ["issues"] });
      await queryClient.invalidateQueries({ queryKey: ["sprints", currentProjectId] });
    },
  });
  const updateSprintMutation = useMutation({
    mutationFn: async ({ sprintId, status }) =>
      api.patch(`/sprints/${encodeURIComponent(sprintId)}/status`, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["sprints", currentProjectId] });
    },
  });

  const setFilter = (key, value) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const memberName = (userId) => {
    if (!userId) return "Unassigned";
    const member = (membersQuery.data || []).find(
      (item) => item.userId === userId || item.id === userId,
    );
    return member?.profile?.displayName || member?.displayName || member?.name || "Workspace member";
  };
  const workloadByAssignee = new Map(
    (analyticsQuery.data?.workload || []).map((person) => [
      person.assigneeId || "unassigned",
      person,
    ]),
  );
  const workspaceMemberIds = new Set(
    (membersQuery.data || []).map((member) => member.userId || member.id),
  );
  const workloadRows = [
    ...(membersQuery.data || []).map((member) => {
      const assigneeId = member.userId || member.id;
      return workloadByAssignee.get(assigneeId) || {
        assigneeId,
        total: 0,
        active: 0,
        overdue: 0,
      };
    }),
    ...[...workloadByAssignee.entries()]
      .filter(
        ([assigneeId]) =>
          assigneeId === "unassigned" || !workspaceMemberIds.has(assigneeId),
      )
      .map(([, person]) => person),
  ];
  const maxActiveWork = Math.max(
    1,
    ...workloadRows.map((person) => person.active),
  );
  const ready = Boolean(workspaceId) && analyticsQuery.isSuccess;

  if (!workspaceId) {
    return <Alert status="info" borderRadius="16px"><AlertIcon />Select a workspace to open productivity tools.</Alert>;
  }

  return (
    <VStack align="stretch" spacing={5} maxW="1440px" mx="auto">
      <Box>
        <Text color="textMuted" fontSize="xs" fontWeight="700" letterSpacing="0.12em" textTransform="uppercase">
          Planning & insights
        </Text>
        <Text mt={2} fontSize={{ base: "2xl", md: "3xl" }} fontWeight="700">Productivity</Text>
        <Text mt={1} color="textSecondary">Plan work by date, understand team capacity, and keep project plans in sync.</Text>
      </Box>

      {analyticsQuery.error && (
        <Alert status="error" borderRadius="16px">
          <AlertIcon />
          {analyticsQuery.error.message || "Unable to load productivity data."}
        </Alert>
      )}
      {!ready && !analyticsQuery.error && (
        <HStack py={8} justify="center"><Spinner color="accent" /><Text color="textSecondary">Loading project data…</Text></HStack>
      )}

      <Card className="p-4">
        <HStack justify="space-between" align="start" flexWrap="wrap" gap={3}>
          <HStack>
            <Filter size={16} />
            <Text fontWeight="700">Issue filters</Text>
          </HStack>
          <Select
            aria-label="Filter by project"
            value={filters.projectId}
            onChange={(event) => {
              setFilter("projectId", event.target.value);
              setFilter("sprintId", "");
              setSelectedIssueIds([]);
            }}
            maxW="240px"
            size="sm"
          >
            <option value="">All accessible projects</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </Select>
        </HStack>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 5 }} spacing={3} mt={4}>
          <Input aria-label="Search work items" placeholder="Search title or key" size="sm" value={filters.search} onChange={(event) => setFilter("search", event.target.value)} />
          <Select aria-label="Filter by status" size="sm" value={filters.status} onChange={(event) => setFilter("status", event.target.value)}>
            <option value="all">All statuses</option>
            {STATUSES.map((status) => <option key={status} value={status}>{status.replace("_", " ")}</option>)}
          </Select>
          <Select aria-label="Filter by type" size="sm" value={filters.type} onChange={(event) => setFilter("type", event.target.value)}>
            <option value="all">All types</option>
            {TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </Select>
          <Select aria-label="Filter by priority" size="sm" value={filters.priority} onChange={(event) => setFilter("priority", event.target.value)}>
            <option value="all">All priorities</option>
            {PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </Select>
          <Select aria-label="Filter by assignee" size="sm" value={filters.assigneeId} onChange={(event) => setFilter("assigneeId", event.target.value)}>
            <option value="">All assignees</option>
            <option value="unassigned">Unassigned</option>
            {(membersQuery.data || []).map((member) => {
              const id = member.userId || member.id;
              return id ? <option key={id} value={id}>{member.profile?.displayName || member.displayName || member.name || id}</option> : null;
            })}
          </Select>
          <Select aria-label="Filter by sprint" size="sm" value={filters.sprintId} onChange={(event) => setFilter("sprintId", event.target.value)}>
            <option value="">All sprints</option>
            {(sprintsQuery.data || []).map((sprint) => (
              <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
            ))}
          </Select>
          <FormControl>
            <FormLabel mb={1} fontSize="xs" color="textMuted">Due from</FormLabel>
            <Input type="date" size="sm" value={filters.dueDateFrom} onChange={(event) => setFilter("dueDateFrom", event.target.value)} />
          </FormControl>
          <FormControl>
            <FormLabel mb={1} fontSize="xs" color="textMuted">Due to</FormLabel>
            <Input type="date" size="sm" value={filters.dueDateTo} onChange={(event) => setFilter("dueDateTo", event.target.value)} />
          </FormControl>
          <Button variant="outline" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>Clear filters</Button>
        </SimpleGrid>
        <HStack mt={4} flexWrap="wrap">
          {(savedViewsQuery.data || []).map((view) => (
            <HStack key={view.id} px={2} py={1} border="1px solid" borderColor="borderSubtle" borderRadius="full">
              <Button variant="ghost" size="xs" onClick={() => setFilters({ ...EMPTY_FILTERS, ...view.filters })}>{view.name}</Button>
              <Button aria-label={`Delete ${view.name} saved view`} variant="ghost" size="xs" onClick={() => removeViewMutation.mutate(view.id)}>×</Button>
            </HStack>
          ))}
          <HStack>
            <Input aria-label="Saved view name" placeholder="Name this view" size="xs" maxW="140px" value={savedViewName} onChange={(event) => setSavedViewName(event.target.value)} />
            <Button
              size="xs"
              leftIcon={<Save size={13} />}
              isDisabled={!savedViewName.trim()}
              isLoading={createViewMutation.isPending}
              onClick={() => createViewMutation.mutate()}
            >
              Save view
            </Button>
          </HStack>
        </HStack>
        {(createViewMutation.error || removeViewMutation.error) && (
          <Text mt={2} fontSize="xs" color="danger">{createViewMutation.error?.message || removeViewMutation.error?.message}</Text>
        )}
      </Card>

      <Tabs colorScheme="purple" isLazy>
        <TabList overflowX="auto">
          <Tab>Overview</Tab>
          <Tab>Calendar</Tab>
          <Tab>Timeline</Tab>
          <Tab>Workload</Tab>
          <Tab>Sprint planning</Tab>
        </TabList>
        <TabPanels>
          <TabPanel px={0}>
            {analyticsQuery.isPending ? (
              <HStack py={8} justify="center"><Spinner color="accent" /></HStack>
            ) : (
              <VStack align="stretch" spacing={4}>
                <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={3}>
                  <Metric label="Active projects" value={analyticsQuery.data?.summary?.projectCount ?? 0} caption="Projects you can access" />
                  <Metric label="Open work" value={analyticsQuery.data?.summary?.activeIssues ?? 0} caption="Issues not yet completed" />
                  <Metric label="Completed" value={analyticsQuery.data?.summary?.completedIssues ?? 0} caption="Completed issues" />
                  <Metric label="Overdue" value={analyticsQuery.data?.summary?.overdueIssues ?? 0} caption={`${analyticsQuery.data?.summary?.dueSoonIssues ?? 0} due in the next 7 days`} />
                </SimpleGrid>
                <Card className="p-4">
                  <Text fontWeight="700" mb={3}>Project progress</Text>
                  <VStack align="stretch" spacing={3}>
                    {(analyticsQuery.data?.projects || []).map((project) => {
                      const progress = project.totalIssues
                        ? Math.round((project.completedIssues / project.totalIssues) * 100)
                        : 0;
                      return (
                        <Box key={project.id}>
                          <HStack justify="space-between">
                            <Text fontSize="sm" fontWeight="600">{project.name}</Text>
                            <Text fontSize="xs" color="textMuted">{project.completedIssues}/{project.totalIssues} · {progress}%</Text>
                          </HStack>
                          <Box mt={2} h="6px" borderRadius="full" bg="surfaceRaised">
                            <Box h="full" w={`${progress}%`} borderRadius="full" bg="accent" />
                          </Box>
                        </Box>
                      );
                    })}
                    {!analyticsQuery.data?.projects?.length && <Text color="textMuted" fontSize="sm">No accessible projects yet.</Text>}
                  </VStack>
                </Card>
              </VStack>
            )}
          </TabPanel>
          <TabPanel px={0}>
            <CalendarView
              issues={issues}
              month={calendarMonth}
              onMonthChange={(step) => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + step, 1))}
            />
          </TabPanel>
          <TabPanel px={0}><TimelineView issues={issues} /></TabPanel>
          <TabPanel px={0}>
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={3}>
              {workloadRows.map((person) => (
                <Card key={person.assigneeId || "unassigned"} className="p-4">
                  <HStack justify="space-between">
                    <Text fontWeight="700">{memberName(person.assigneeId)}</Text>
                    <Badge colorScheme={person.active > 8 ? "orange" : "purple"}>{person.active} active</Badge>
                  </HStack>
                  <Text mt={3} color="textSecondary" fontSize="sm">{person.total} assigned · {person.overdue} overdue</Text>
                  <Text mt={2} color="textMuted" fontSize="10px">Relative active workload</Text>
                  <Box mt={3} h="6px" borderRadius="full" bg="surfaceRaised">
                    <Box h="full" w={`${(person.active / maxActiveWork) * 100}%`} borderRadius="full" bg={person.active > maxActiveWork * 0.8 ? "warning" : "accent"} />
                  </Box>
                </Card>
              ))}
              {!workloadRows.length && <Card className="p-4"><Text color="textMuted">No workspace members are available.</Text></Card>}
            </SimpleGrid>
          </TabPanel>
          <TabPanel px={0}>
            <VStack align="stretch" spacing={4}>
              <Card className="p-4">
                <Text fontWeight="700" mb={3}>Create a sprint</Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  <Input aria-label="Sprint name" placeholder="Sprint name" value={sprintName} onChange={(event) => setSprintName(event.target.value)} />
                  <Textarea aria-label="Sprint goal" placeholder="Sprint goal" value={sprintGoal} onChange={(event) => setSprintGoal(event.target.value)} />
                  <FormControl><FormLabel fontSize="xs">Start</FormLabel><Input type="date" value={sprintStart} onChange={(event) => setSprintStart(event.target.value)} /></FormControl>
                  <FormControl><FormLabel fontSize="xs">End</FormLabel><Input type="date" value={sprintEnd} onChange={(event) => setSprintEnd(event.target.value)} /></FormControl>
                </SimpleGrid>
                <Button
                  mt={3}
                  leftIcon={<Plus size={14} />}
                  isLoading={createSprintMutation.isPending}
                  isDisabled={!currentProjectId || !sprintName.trim() || !sprintStart || !sprintEnd || sprintEnd < sprintStart}
                  onClick={() => createSprintMutation.mutate()}
                >
                  Create planned sprint
                </Button>
                {(createSprintMutation.error || assignIssuesMutation.error || updateSprintMutation.error) && (
                  <Text mt={2} fontSize="xs" color="danger">{createSprintMutation.error?.message || assignIssuesMutation.error?.message || updateSprintMutation.error?.message}</Text>
                )}
              </Card>
              {(sprintsQuery.data || []).map((sprint) => {
                const sprintIssues = allIssues.filter((issue) => issue.sprintId === sprint.id);
                return (
                  <Card key={sprint.id} className="p-4">
                    <HStack justify="space-between" align="start" flexWrap="wrap">
                      <Box>
                        <Text fontWeight="700">{sprint.name}</Text>
                        <Text mt={1} color="textMuted" fontSize="xs">{sprint.startDate} – {sprint.endDate} · {sprintIssues.length} issues</Text>
                        {sprint.goal && <Text mt={2} color="textSecondary" fontSize="sm">{sprint.goal}</Text>}
                      </Box>
                      <HStack>
                        <Badge textTransform="capitalize">{sprint.status}</Badge>
                        {sprint.status === "planned" && (
                          <Button size="xs" onClick={() => updateSprintMutation.mutate({ sprintId: sprint.id, status: "active" })}>Start</Button>
                        )}
                        {sprint.status === "active" && (
                          <Button size="xs" onClick={() => updateSprintMutation.mutate({ sprintId: sprint.id, status: "completed" })}>Complete</Button>
                        )}
                      </HStack>
                    </HStack>
                  </Card>
                );
              })}
              {sprintsQuery.error && <Alert status="error"><AlertIcon />{sprintsQuery.error.message}</Alert>}
              <Card className="p-4">
                <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
                  <Box>
                    <Text fontWeight="700">Backlog planning</Text>
                    <Text color="textMuted" fontSize="xs">Select issues and assign them to a planned or active sprint.</Text>
                  </Box>
                  <Select aria-label="Choose sprint" maxW="260px" value={targetSprintId} onChange={(event) => setTargetSprintId(event.target.value)}>
                    <option value="">Choose sprint</option>
                    {(sprintsQuery.data || []).filter((sprint) => sprint.status !== "completed").map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}
                  </Select>
                </HStack>
                <VStack align="stretch" mt={3} spacing={2}>
                  {allIssues.filter((issue) =>
                    !issue.sprintId &&
                    (!filters.projectId || issue.projectId === filters.projectId) &&
                    issueMatches(issue, { ...filters, sprintId: "" }),
                  ).slice(0, 80).map((issue) => (
                    <Checkbox
                      key={issue.id}
                      isChecked={selectedIssueIds.includes(issue.id)}
                      onChange={(event) => setSelectedIssueIds((current) =>
                        event.target.checked
                          ? [...new Set([...current, issue.id])]
                          : current.filter((id) => id !== issue.id),
                      )}
                    >
                      <Text fontSize="sm">{issue.title}</Text>
                    </Checkbox>
                  ))}
                  {!allIssues.some((issue) =>
                    !issue.sprintId &&
                    (!filters.projectId || issue.projectId === filters.projectId) &&
                    issueMatches(issue, { ...filters, sprintId: "" }),
                  ) && <Text color="textMuted" fontSize="sm">No unassigned backlog issues match these filters.</Text>}
                </VStack>
                <Button
                  mt={4}
                  isDisabled={!targetSprintId || !selectedIssueIds.length}
                  isLoading={assignIssuesMutation.isPending}
                  onClick={() => assignIssuesMutation.mutate(targetSprintId)}
                >
                  Add {selectedIssueIds.length || ""} selected issues
                </Button>
              </Card>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
}
