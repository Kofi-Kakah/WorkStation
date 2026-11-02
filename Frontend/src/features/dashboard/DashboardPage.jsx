import {
  Badge,
  Box,
  Button,
  HStack,
  Icon,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bug,
  Check,
  ChevronDown,
  CircleDot,
  Clock3,
  FolderKanban,
  Plus,
  Users,
  Hash,
} from "lucide-react";
import GlassCard from "../../components/ui/GlassCard.jsx";

const HEATMAP = [
  [0, 0, 1, 2, 1, 0, 1, 0],
  [0, 1, 2, 3, 2, 1, 0, 1],
  [1, 2, 3, 2, 2, 1, 2, 0],
  [0, 1, 2, 4, 3, 2, 1, 0],
  [0, 2, 3, 3, 2, 1, 0, 1],
  [0, 1, 2, 1, 3, 2, 1, 0],
  [1, 0, 1, 2, 2, 1, 0, 0],
];

const HEATMAP_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const STATUS_COLORS = {
  done: "green",
  in_progress: "orange",
  in_review: "yellow",
  todo: "gray",
};

function MetricCard({ label, value, caption, icon: MetricIcon, trend, index }) {
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
        <HStack
          spacing={1}
          px={1.5}
          py={0.5}
          borderRadius="full"
          bg={trend >= 0 ? "successSoft" : "danger"}
          color={trend >= 0 ? "success" : "white"}
        >
          <Icon as={trend >= 0 ? ArrowUpRight : ArrowDownRight} boxSize={3} />
          <Text fontSize="10px" fontWeight="700">
            {Math.abs(trend)}%
          </Text>
        </HStack>
        <Text
          fontSize="10px"
          color={index === 3 ? "whiteAlpha.800" : "textMuted"}
          noOfLines={1}
        >
          {caption}
        </Text>
      </HStack>
      <Box
        h="2px"
        mt={4}
        borderRadius="full"
        bg={index === 3 ? "whiteAlpha.300" : "borderSubtle"}
        overflow="hidden"
      >
        <Box
          h="full"
          w={`${[68, 46, 78, 56][index]}%`}
          borderRadius="full"
          bg={index === 3 ? "white" : "accent"}
        />
      </Box>
    </GlassCard>
  );
}

function ActivityChart() {
  const yLabels = ["24", "18", "12", "6", "0"];
  const xLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <GlassCard className="p-4 sm:p-5">
      <HStack justify="space-between" align="start" mb={5}>
        <Box>
          <Text fontSize="sm" fontWeight="600">
            Work completed
          </Text>
          <Text
            mt={1}
            fontSize="xs"
            color="textMuted"
          >
            Issue activity over the last 7 days
          </Text>
        </Box>
        <Button
          rightIcon={<ChevronDown size={13} />}
          variant="outline"
          size="xs"
          h="28px"
          borderColor="borderSubtle"
          color="textSecondary"
          bg="surfaceRaised"
          _hover={{ borderColor: "accentBorder", color: "textPrimary" }}
        >
          This week
        </Button>
      </HStack>

      <Box
        as="figure"
        aria-label="Weekly issue activity trend"
        display="grid"
        gridTemplateColumns="30px minmax(0, 1fr)"
        gap={2}
      >
        <VStack
          h="150px"
          justify="space-between"
          align="flex-end"
          color="textMuted"
          fontSize="10px"
          aria-hidden="true"
        >
          {yLabels.map((label) => (
            <Text key={label}>{label}</Text>
          ))}
        </VStack>
        <Box minW="0">
          <Box h="150px" position="relative">
            <Box
              position="absolute"
              inset="0"
              display="flex"
              flexDirection="column"
              justifyContent="space-between"
              aria-hidden="true"
            >
              {yLabels.map((label) => (
                <Box
                  key={label}
                  borderTop="1px dashed"
                  borderColor="borderSubtle"
                />
              ))}
            </Box>
            <svg
              role="img"
              aria-label="Work completion rises through the week, with a peak on Friday"
              viewBox="0 0 640 150"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
            >
              <defs>
                <linearGradient id="activity-fill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity=".28" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 121 C34 112 52 116 84 108 S126 94 160 102 S211 111 244 92 S289 79 321 85 S366 66 402 74 S450 87 480 61 S530 71 558 50 S608 43 640 28 L640 150 L0 150 Z"
                fill="url(#activity-fill)"
              />
              <path
                d="M0 121 C34 112 52 116 84 108 S126 94 160 102 S211 111 244 92 S289 79 321 85 S366 66 402 74 S450 87 480 61 S530 71 558 50 S608 43 640 28"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx="480" cy="61" r="4" fill="var(--accent-hot)" />
              <circle
                cx="480"
                cy="61"
                r="8"
                fill="var(--accent-hot)"
                fillOpacity=".16"
              />
            </svg>
          </Box>
          <HStack
            justify="space-between"
            mt={2}
            color="textMuted"
            fontSize="10px"
            aria-hidden="true"
          >
            {xLabels.map((label) => (
              <Text key={label}>{label}</Text>
            ))}
          </HStack>
        </Box>
      </Box>
    </GlassCard>
  );
}

function ActivityHeatmap() {
  const intensityClasses = Array.from({ length: 5 }, () => "activity-heatmap__cell");

  return (
    <GlassCard className="p-4 sm:p-5">
      <HStack justify="space-between" mb={1}>
        <Text fontSize="sm" fontWeight="600">
          Team activity
        </Text>
        <Text
          fontSize="10px"
          color="textMuted"
        >
          Last 7 days
        </Text>
      </HStack>
      <Text
        fontSize="xs"
        color="textMuted"
        mb={4}
      >
        Activity across projects and conversations
      </Text>
      <Box display="grid" gridTemplateColumns="28px repeat(8, 1fr)" gap="5px">
        {HEATMAP.map((week, row) => (
          <Box key={HEATMAP_DAYS[row]} display="contents">
            <Text
              fontSize="9px"
              alignSelf="center"
              color="textMuted"
            >
              {HEATMAP_DAYS[row]}
            </Text>
            {week.map((level, column) => (
              <Box
                key={`${row}-${column}`}
                title={`${HEATMAP_DAYS[row]}: activity level ${level}`}
                h="13px"
                data-level={level}
                className={intensityClasses[level]}
              />
            ))}
          </Box>
        ))}
      </Box>
      <HStack justify="flex-end" spacing={1.5} mt={4}>
        <Text
          fontSize="9px"
          color="textMuted"
        >
          Less
        </Text>
        {intensityClasses.map((className, index) => (
          <Box
            key={index}
            title={`Activity level ${index}`}
            w="10px"
            h="10px"
            data-level={index}
            className={className}
          />
        ))}
        <Text
          fontSize="9px"
          color="textMuted"
        >
          More
        </Text>
      </HStack>
    </GlassCard>
  );
}

function ProjectList({ projects }) {
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
                    {project.key} · {project.issueCount} issues ·{" "}
                    {project.memberCount} members
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

function IssueActivity({ issues }) {
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
                  {issue.key} · {issue.assignee || "Unassigned"}
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

/**
 * Workspace overview built with mock data for the approved design-system stage.
 *
 * @param {{ projects?: Array, issues?: Array, channels?: Array, notifications?: Array }} props
 */
export function DashboardPage({
  projects = [],
  issues = [],
  channels = [],
  notifications = [],
}) {
  const openIssues = issues.filter((issue) => issue.status !== "done");
  const assignedIssues = issues.filter((issue) => issue.assignee).length;
  const projectProgress = projects.length
    ? Math.round(
        projects.reduce((total, project) => total + (project.progress || 0), 0) /
          projects.length,
      )
    : 0;
  const unreadNotifications = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const metrics = [
    {
      label: "Open issues",
      value: openIssues.length,
      caption: "Need team attention",
      icon: Bug,
      trend: -4,
    },
    {
      label: "Active channels",
      value: channels.length,
      caption: "Workspace conversations",
      icon: Hash,
      trend: 8,
    },
    {
      label: "Assigned issues",
      value: assignedIssues,
      caption: `${unreadNotifications} unread updates`,
      icon: Users,
      trend: 6,
    },
    {
      label: "Project progress",
      value: `${projectProgress}%`,
      caption: "Average across active projects",
      icon: FolderKanban,
      trend: 12,
    },
  ];

  return (
    <Box display="flex" flexDirection="column" gap={{ base: 5, lg: 6 }}>
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
            Workspace overview
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
            <Text fontSize="xs">Live · updated just now</Text>
          </HStack>
        </Box>
        <Button
          leftIcon={<Plus size={15} />}
          variant="unstyled"
          className="ui-button ui-button--primary"
          h="40px"
          flexShrink={0}
        >
          Create project
        </Button>
      </HStack>

      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4}>
        {metrics.map((metric, index) => (
          <MetricCard key={metric.label} {...metric} index={index} />
        ))}
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={4}>
        <Box gridColumn={{ base: "auto", lg: "span 2" }}>
          <ActivityChart />
        </Box>
        <ActivityHeatmap />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
        <ProjectList projects={projects} />
        <IssueActivity issues={issues} />
      </SimpleGrid>

      <HStack
        spacing={2}
        color="textMuted"
        fontSize="xs"
      >
        <Clock3 size={13} />
        <Text>Workspace data refreshed recently</Text>
      </HStack>
    </Box>
  );
}

export default DashboardPage;
