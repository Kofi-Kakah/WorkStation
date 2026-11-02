import { Box, Text, Grid, GridItem, SimpleGrid, Badge, HStack, Icon } from '@chakra-ui/react';
import { FolderKanban, Kanban, Bug, Bell, TrendingUp, Clock } from 'lucide-react';
import GlassCard from '../../components/ui/GlassCard.jsx';
import PrimaryButton from '../../components/ui/PrimaryButton.jsx';
import StatCard from '../../components/ui/StatCard.jsx';

/**
 * Dashboard overview page.
 *
 * @param {{ projects: Array, boards: Array, issues: Array, notifications: Array, [key: string]: any }} props
 */
export function DashboardPage({ projects, boards, issues, notifications, ...props }) {
  const openIssues = issues.filter((i) => i.status !== 'done');
  const unreadNotifications = notifications.filter((n) => !n.read);

  return (
    <Box className="flex flex-col gap-6" {...props}>
      <Box>
        <Text fontSize="2xl" fontWeight="800">Dashboard</Text>
        <Text color="gray.500" _dark={{ color: 'gray.400' }} fontSize="sm">
          Welcome back. Here's what's happening across your workspaces.
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
        <StatCard label="Projects" value={projects.length} icon={FolderKanban} color="amethyst" />
        <StatCard label="Boards" value={boards.length} icon={Kanban} color="blue" />
        <StatCard label="Open issues" value={openIssues.length} icon={Bug} color="orange" />
        <StatCard label="Notifications" value={unreadNotifications.length} icon={Bell} color="red" />
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
        <GridItem colSpan={1}>
          <GlassCard hover>
            <HStack justify="space-between" mb={4}>
              <Text fontSize="lg" fontWeight="700">Projects</Text>
              <PrimaryButton size="sm" variant="ghost">View all</PrimaryButton>
            </HStack>
            <Box display="flex" flexDirection="column" gap={3}>
              {projects.map((project) => (
                <Box key={project.id} p={3} borderRadius="10px" bg="white" _dark={{ bg: 'whiteAlpha.50' }} border="1px solid" borderColor="blackAlpha.100" _dark={{ borderColor: 'whiteAlpha.100' }}>
                  <HStack justify="space-between" mb={2}>
                    <HStack gap={2}>
                      <Text fontWeight="700" fontSize="sm">{project.name}</Text>
                      <Badge size="sm" colorScheme="purple">{project.key}</Badge>
                    </HStack>
                    <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }}>{project.issueCount} issues</Text>
                  </HStack>
                  <Box h="6px" borderRadius="full" bg="blackAlpha.100" _dark={{ bg: 'whiteAlpha.100' }} overflow="hidden">
                    <Box h="100%" w={`${project.progress}%`} bgGradient="linear(90deg, amethyst.400, amethyst.600)" borderRadius="full" />
                  </Box>
                  <HStack justify="space-between" mt={2}>
                    <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }}>{project.memberCount} members</Text>
                    <Text fontSize="xs" color="amethyst.600" fontWeight="600">{project.progress}% complete</Text>
                  </HStack>
                </Box>
              ))}
            </Box>
          </GlassCard>
        </GridItem>

        <GridItem colSpan={1} display="flex" flexDirection="column" gap={6}>
          <GlassCard hover>
            <HStack justify="space-between" mb={4}>
              <Text fontSize="lg" fontWeight="700">Recent activity</Text>
              <Icon as={TrendingUp} boxSize={4} color="gray.400" />
            </HStack>
            <Box display="flex" flexDirection="column" gap={2}>
              {issues.slice(0, 4).map((issue) => (
                <HStack key={issue.id} justify="space-between" py={1}>
                  <Box minWidth={0}>
                    <Text fontSize="sm" fontWeight="600" truncate>{issue.key} {issue.title}</Text>
                    <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }}>{issue.assignee || 'Unassigned'}</Text>
                  </Box>
                  <Badge size="sm" variant="subtle" colorScheme={issue.status === 'done' ? 'green' : issue.status === 'in_progress' ? 'blue' : 'gray'}>
                    {issue.status.replace('_', ' ')}
                  </Badge>
                </HStack>
              ))}
            </Box>
          </GlassCard>

          <GlassCard hover>
            <HStack justify="space-between" mb={4}>
              <Text fontSize="lg" fontWeight="700">Upcoming deadlines</Text>
              <Icon as={Clock} boxSize={4} color="gray.400" />
            </HStack>
            <Box display="flex" flexDirection="column" gap={2}>
              {issues.filter((i) => i.priority === 'high' || i.priority === 'highest').slice(0, 3).map((issue) => (
                <HStack key={issue.id} justify="space-between" py={1}>
                  <Text fontSize="sm" truncate>{issue.key} {issue.title}</Text>
                  <Badge size="sm" colorScheme="red">{issue.priority}</Badge>
                </HStack>
              ))}
            </Box>
          </GlassCard>
        </GridItem>
      </Grid>
    </Box>
  );
}

export default DashboardPage;