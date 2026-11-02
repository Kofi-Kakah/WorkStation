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
  Kanban,
  Plus,
  Users,
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
  in_progress: "purple",
  in_review: "blue",
  todo: "gray",
};

function MetricCard({ label, value, caption, icon: MetricIcon, trend, index }) {
  return (
    <GlassCard className="min-w-0 p-4 sm:p-5">
      <HStack justify="space-between" align="start">
        <Box minW="0">
          <Text
            fontSize="xs"
            color="gray.500"
            _dark={{ color: "whiteAlpha.600" }}
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
          bg="amethyst.100"
          color="amethyst.700"
          _dark={{ bg: "amethyst.900", color: "amethyst.300" }}
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
          bg={trend >= 0 ? "green.50" : "red.50"}
          color={trend >= 0 ? "green.700" : "red.700"}
          _dark={{
            bg: trend >= 0 ? "green.900" : "red.900",
            color: trend >= 0 ? "green.200" : "red.200",
          }}
        >
          <Icon as={trend >= 0 ? ArrowUpRight : ArrowDownRight} boxSize={3} />
          <Text fontSize="10px" fontWeight="700">
            {Math.abs(trend)}%
          </Text>
        </HStack>
        <Text
          fontSize="10px"
          color="gray.500"
          _dark={{ color: "whiteAlpha.500" }}
          noOfLines={1}
        >
          {caption}
        </Text>
      </HStack>
      <Box
        h="2px"
        mt={4}
        borderRadius="full"
        bg="blackAlpha.100"
        _dark={{ bg: "whiteAlpha.100" }}
        overflow="hidden"
      >
        <Box
          h="full"
          w={`${[68, 46, 78, 56][index]}%`}
          borderRadius="full"
          bg="amethyst.500"
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
            color="gray.500"
            _dark={{ color: "whiteAlpha.500" }}
          >
            Issue activity over the last 7 days
          </Text>
        </Box>
        <Button
          rightIcon={<ChevronDown size={13} />}
          variant="outline"
          size="xs"
          h="28px"
          borderColor="blackAlpha.200"
          color="gray.600"
          _dark={{ borderColor: "whiteAlpha.200", color: "whiteAlpha.700" }}
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
          color="gray.500"
          _dark={{ color: "whiteAlpha.500" }}
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
                  borderColor="blackAlpha.100"
                  _dark={{ borderColor: "whiteAlpha.100" }}
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
                  <stop offset="0%" stopColor="#bd79ff" stopOpacity=".28" />
                  <stop offset="100%" stopColor="#bd79ff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 121 C34 112 52 116 84 108 S126 94 160 102 S211 111 244 92 S289 79 321 85 S366 66 402 74 S450 87 480 61 S530 71 558 50 S608 43 640 28 L640 150 L0 150 Z"
                fill="url(#activity-fill)"
              />
              <path
                d="M0 121 C34 112 52 116 84 108 S126 94 160 102 S211 111 244 92 S289 79 321 85 S366 66 402 74 S450 87 480 61 S530 71 558 50 S608 43 640 28"
                fill="none"
                stroke="#bd79ff"
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx="480" cy="61" r="4" fill="#ce97ff" />
              <circle
                cx="480"
                cy="61"
                r="8"
                fill="#ce97ff"
                fillOpacity=".16"
              />
            </svg>
          </Box>
          <HStack
            justify="space-between"
            mt={2}
            color="gray.500"
            _dark={{ color: "whiteAlpha.500" }}
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
  const intensityClasses = [
    "bg-black/5 dark:bg-white/[0.06]",
    "bg-amethyst-200 dark:bg-amethyst-900",
    "bg-amethyst-300 dark:bg-amethyst-800",
    "bg-amethyst-500 dark:bg-amethyst-700",
    "bg-amethyst-700 dark:bg-amethyst-500",
  ];

  return (
    <GlassCard className="p-4 sm:p-5">
      <HStack justify="space-between" mb={1}>
        <Text fontSize="sm" fontWeight="600">
          Team activity
        </Text>
        <Text
          fontSize="10px"
          color="gray.500"
          _dark={{ color: "whiteAlpha.500" }}
        >
          Last 7 days
        </Text>
      </HStack>
      <Text
        fontSize="xs"
        color="gray.500"
        _dark={{ color: "whiteAlpha.500" }}
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
              color="gray.500"
              _dark={{ color: "whiteAlpha.500" }}
            >
              {HEATMAP_DAYS[row]}
            </Text>
            {week.map((level, column) => (
              <Box
                key={`${row}-${column}`}
                title={`${HEATMAP_DAYS[row]}: activity level ${level}`}
                h="13px"
                borderRadius="3px"
                className={intensityClasses[level]}
              />
            ))}
          </Box>
        ))}
      </Box>
      <HStack justify="flex-end" spacing={1.5} mt={4}>
        <Text
          fontSize="9px"
          color="gray.500"
          _dark={{ color: "whiteAlpha.500" }}
        >
          Less
        </Text>
        {intensityClasses.map((className, index) => (
          <Box
            key={className}
            title={`Activity level ${index}`}
            w="10px"
            h="10px"
            borderRadius="2px"
            className={className}
          />
        ))}
        <Text
          fontSize="9px"
          color="gray.500"
          _dark={{ color: "whiteAlpha.500" }}
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
            color="gray.500"
            _dark={{ color: "whiteAlpha.500" }}
          >
            Progress across your workspace
          </Text>
        </Box>
        <Button
          leftIcon={<Plus size={13} />}
          variant="ghost"
          size="xs"
          color="amethyst.700"
          _dark={{ color: "amethyst.300" }}
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
            color="gray.500"
            _dark={{ color: "whiteAlpha.500" }}
          >
            No projects yet. Create a project to start organizing work.
          </Text>
        )}
        {projects.map((project, index) => (
          <Box
            key={project.id}
            py={3}
            borderTop={index === 0 ? "none" : "1px solid"}
            borderColor="blackAlpha.100"
            _dark={{ borderColor: "whiteAlpha.100" }}
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
                  bg="amethyst.100"
                  color="amethyst.700"
                  _dark={{ bg: "amethyst.900", color: "amethyst.300" }}
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
                    color="gray.500"
                    _dark={{ color: "whiteAlpha.500" }}
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
                color="amethyst.700"
                _dark={{ color: "amethyst.300" }}
              >
                {project.progress}%
              </Text>
            </HStack>
            <Box
              h="4px"
              mt={3}
              ml="46px"
              borderRadius="full"
              bg="blackAlpha.100"
              _dark={{ bg: "whiteAlpha.100" }}
              overflow="hidden"
            >
              <Box
                h="full"
                w={`${project.progress}%`}
                borderRadius="full"
                bg="amethyst.500"
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
            color="gray.500"
            _dark={{ color: "whiteAlpha.500" }}
          >
            Latest work from your teams
          </Text>
        </Box>
        <Button
          variant="ghost"
          size="xs"
          color="amethyst.700"
          _dark={{ color: "amethyst.300" }}
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
            color="gray.500"
            _dark={{ color: "whiteAlpha.500" }}
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
            borderColor="blackAlpha.100"
            _dark={{ borderColor: "whiteAlpha.100" }}
          >
            <HStack minW="0" spacing={2.5}>
              <Icon
                as={issue.status === "done" ? Check : CircleDot}
                boxSize={4}
                flexShrink={0}
                color={issue.status === "done" ? "green.400" : "amethyst.400"}
              />
              <Box minW="0">
                <Text fontSize="xs" fontWeight="600" noOfLines={1}>
                  {issue.title}
                </Text>
                <Text
                  mt={0.5}
                  fontSize="10px"
                  color="gray.500"
                  _dark={{ color: "whiteAlpha.500" }}
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
 * @param {{ projects?: Array, boards?: Array, issues?: Array, notifications?: Array }} props
 */
export function DashboardPage({
  projects = [],
  boards = [],
  issues = [],
  notifications = [],
}) {
  const openIssues = issues.filter((issue) => issue.status !== "done");
  const boardCards = boards.reduce(
    (total, board) => total + (board.cardCount || 0),
    0,
  );
  const activeMembers = Math.max(
    0,
    ...projects.map((project) => project.memberCount || 0),
  );
  const unreadNotifications = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const metrics = [
    {
      label: "Active projects",
      value: projects.length,
      caption: "Across this workspace",
      icon: FolderKanban,
      trend: 12,
    },
    {
      label: "Open issues",
      value: openIssues.length,
      caption: "Need team attention",
      icon: Bug,
      trend: -4,
    },
    {
      label: "Board items",
      value: boardCards,
      caption: "Across all boards",
      icon: Kanban,
      trend: 8,
    },
    {
      label: "Team members",
      value: activeMembers,
      caption: `${unreadNotifications} unread updates`,
      icon: Users,
      trend: 6,
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
            fontSize={{ base: "xl", md: "2xl" }}
            fontWeight="700"
            letterSpacing="-0.035em"
          >
            Workspace overview
          </Text>
          <Text
            mt={1}
            fontSize="sm"
            color="gray.500"
            _dark={{ color: "whiteAlpha.500" }}
          >
            A live look at projects, issues, and team activity.
          </Text>
        </Box>
        <Button
          leftIcon={<Plus size={15} />}
          size="sm"
          h="36px"
          bg="amethyst.600"
          color="white"
          _hover={{ bg: "amethyst.700" }}
          _active={{ bg: "amethyst.800" }}
          borderRadius="9px"
          flexShrink={0}
        >
          Create project
        </Button>
      </HStack>

      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={3}>
        {metrics.map((metric, index) => (
          <MetricCard key={metric.label} {...metric} index={index} />
        ))}
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={3}>
        <Box gridColumn={{ base: "auto", lg: "span 2" }}>
          <ActivityChart />
        </Box>
        <ActivityHeatmap />
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={3}>
        <ProjectList projects={projects} />
        <IssueActivity issues={issues} />
      </SimpleGrid>

      <HStack
        spacing={2}
        color="gray.500"
        _dark={{ color: "whiteAlpha.500" }}
        fontSize="xs"
      >
        <Clock3 size={13} />
        <Text>Workspace data refreshed recently</Text>
      </HStack>
    </Box>
  );
}

export default DashboardPage;
