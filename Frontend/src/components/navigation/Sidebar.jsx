import { Box, Text, HStack, Icon, Tooltip } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Inbox, MessageSquare, FolderKanban, Kanban,
  Bug, Bell, Settings, User, Hash, ChevronDown, Plus, Search,
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
      { label: 'Inbox', icon: Inbox, to: '/inbox' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { label: 'Channels', icon: Hash, to: '/channels' },
      { label: 'Direct messages', icon: MessageSquare, to: '/dm' },
    ],
  },
  {
    label: 'Work',
    items: [
      { label: 'Projects', icon: FolderKanban, to: '/projects' },
      { label: 'Boards', icon: Kanban, to: '/boards' },
      { label: 'Issues', icon: Bug, to: '/issues' },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Notifications', icon: Bell, to: '/notifications' },
      { label: 'Settings', icon: Settings, to: '/settings' },
      { label: 'Profile', icon: User, to: '/profile' },
    ],
  },
];

/**
 * Left sidebar navigation.
 *
 * @param {{ collapsed?: boolean, onCollapse?: () => void, className?: string, [key: string]: any }} props
 */
export function Sidebar({ collapsed = false, onCollapse, className = '', ...props }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <Box
      className={`glass-surface h-full flex flex-col ${className}`}
      w={collapsed ? '64px' : '240px'}
      flexShrink={0}
      borderRightWidth="1px"
      borderColor="blackAlpha.200"
      _dark={{ borderColor: 'whiteAlpha.100' }}
      {...props}
    >
      {/* Logo + workspace selector */}
      <Box p={3} display="flex" alignItems="center" gap={2}>
        <Box
          w="32px" h="32px"
          borderRadius="8px"
          bgGradient="linear(135deg, amethyst.500, amethyst.700)"
          display="flex" alignItems="center" justifyContent="center"
          color="white" fontWeight="800"
        >
          U
        </Box>
        {!collapsed && (
          <Box flex={1} minWidth={0}>
            <Text fontSize="sm" fontWeight="700" truncate>Acme Corp</Text>
            <HStack gap={1} cursor="pointer" _hover={{ color: 'amethyst.600' }}>
              <ChevronDown size={12} />
              <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }} truncate>Workspace</Text>
            </HStack>
          </Box>
        )}
      </Box>

      {/* New button */}
      {!collapsed && (
        <Box px={3} pb={2}>
          <Box
            display="flex" alignItems="center" gap={2}
            p={2} borderRadius="8px" cursor="pointer"
            bg="amethyst.100" _hover={{ bg: 'amethyst.200' }}
            color="amethyst.700" fontSize="sm" fontWeight="600"
          >
            <Plus size={16} />
            <span>New</span>
          </Box>
        </Box>
      )}

      {/* Search */}
      {!collapsed && (
        <Box px={3} pb={2}>
          <Box
            display="flex" alignItems="center" gap={2}
            p={2} borderRadius="8px"
            bg="white" _dark={{ bg: 'whiteAlpha.50' }}
            border="1px solid"
            borderColor="blackAlpha.200" _dark={{ borderColor: 'whiteAlpha.100' }}
            cursor="pointer" _hover={{ bg: 'amethyst.50' }}
          >
            <Search size={14} />
            <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }}>Search…</Text>
          </Box>
        </Box>
      )}

      {/* Navigation */}
      <Box flex={1} overflowY="auto" py={2}>
        {NAV_GROUPS.map((group) => (
          <Box key={group.label} mb={2}>
            {!collapsed && (
              <Text px={3} py={1} fontSize="xs" fontWeight="700" color="gray.500" _dark={{ color: 'gray.400' }} textTransform="uppercase" letterSpacing="wider">
                {group.label}
              </Text>
            )}
            {group.items.map((item) => {
              const active = isActive(item.to);
              return (
                <Tooltip key={item.label} label={item.label} isDisabled={!collapsed} placement="right">
                  <Box
                    display="flex" alignItems="center" gap={2}
                    px={collapsed ? 2 : 3} py={1.5}
                    cursor="pointer"
                    bg={active ? 'amethyst.100' : 'transparent'}
                    color={active ? 'amethyst.700' : 'gray.700'}
                    _dark={{ color: active ? 'amethyst.300' : 'gray.200' }}
                    _hover={{ bg: active ? 'amethyst.200' : 'blackAlpha.50' }}
                    _dark={{ _hover: { bg: active ? 'amethyst.800' : 'whiteAlpha.50' } }}
                    onClick={() => navigate(item.to)}
                  >
                    <Icon as={item.icon} boxSize={collapsed ? 5 : 4} />
                    {!collapsed && <Text fontSize="sm" fontWeight={active ? '600' : '500'}>{item.label}</Text>}
                  </Box>
                </Tooltip>
              );
            })}
          </Box>
        ))}
      </Box>

      {/* Collapse toggle */}
      <Box p={2} borderTopWidth="1px" borderColor="blackAlpha.200" _dark={{ borderColor: 'whiteAlpha.100' }}>
        <Box
          display="flex" alignItems="center" gap={2} p={2}
          cursor="pointer" borderRadius="8px" _hover={{ bg: 'blackAlpha.50' }}
          _dark={{ _hover: { bg: 'whiteAlpha.50' } }}
          onClick={onCollapse}
        >
          <Icon as={ChevronDown} boxSize={4} transform={collapsed ? '' : 'rotate(180deg)'} transition="transform 0.2s" />
          {!collapsed && <Text fontSize="sm">Collapse</Text>}
        </Box>
      </Box>
    </Box>
  );
}

export default Sidebar;