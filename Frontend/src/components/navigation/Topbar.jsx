import { Box, HStack, Icon, Text, Tooltip, useColorMode } from '@chakra-ui/react';
import { Moon, Sun, Bell, Search, HelpCircle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth.jsx';
import Avatar from '../shared/Avatar.jsx';

/**
 * Top navigation bar.
 *
 * @param {{ className?: string, onMenu?: () => void, [key: string]: any }} props
 */
export function Topbar({ className = '', onMenu, ...props }) {
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const displayName = profile?.displayName || 'User';

  return (
    <Box
      className={`glass-surface flex items-center justify-between px-4 py-2 ${className}`}
      h="64px"
      flexShrink={0}
      {...props}
    >
      <HStack gap={3}>
        {/* Mobile menu button */}
        <Box display={{ base: 'flex', md: 'none' }} alignItems="center">
          <Box
            p={2} borderRadius="8px" cursor="pointer" _hover={{ bg: 'blackAlpha.50' }}
            onClick={onMenu}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </Box>
        </Box>

        {/* Breadcrumb / page title slot */}
        <Text fontSize="lg" fontWeight="700">Dashboard</Text>
      </HStack>

      <HStack gap={2}>
        <Tooltip label="Search (⌘K)" placement="bottom">
          <Box
            display={{ base: 'none', sm: 'flex' }} alignItems="center" gap={2}
            px={3} py={1.5} borderRadius="8px"
            bg="white" _dark={{ bg: 'whiteAlpha.50' }}
            border="1px solid" borderColor="blackAlpha.200" _dark={{ borderColor: 'whiteAlpha.100' }}
            cursor="pointer" _hover={{ bg: 'amethyst.50' }}
            onClick={() => navigate('/search')}
          >
            <Search size={14} />
            <Text fontSize="xs" color="gray.500" _dark={{ color: 'gray.400' }}>Search…</Text>
          </Box>
        </Tooltip>

        <Tooltip label="Create" placement="bottom">
          <Box
            p={2} borderRadius="8px" cursor="pointer"
            bg="amethyst.100" _hover={{ bg: 'amethyst.200' }}
            color="amethyst.700"
          >
            <Plus size={18} />
          </Box>
        </Tooltip>

        <Tooltip label="Help" placement="bottom">
          <Box p={2} borderRadius="8px" cursor="pointer" _hover={{ bg: 'blackAlpha.50' }}>
            <HelpCircle size={18} />
          </Box>
        </Tooltip>

        <Tooltip label={colorMode === 'dark' ? 'Light mode' : 'Dark mode'} placement="bottom">
          <Box
            p={2} borderRadius="8px" cursor="pointer"
            bg="white" _dark={{ bg: 'whiteAlpha.50' }}
            border="1px solid" borderColor="blackAlpha.200" _dark={{ borderColor: 'whiteAlpha.100' }}
            onClick={toggleColorMode}
          >
            <Icon as={colorMode === 'dark' ? Sun : Moon} boxSize={4} />
          </Box>
        </Tooltip>

        <Tooltip label="Notifications" placement="bottom">
          <Box p={2} borderRadius="8px" cursor="pointer" _hover={{ bg: 'blackAlpha.50' }} position="relative">
            <Bell size={18} />
            <Box
              position="absolute" top={1} right={1}
              w="8px" h="8px" borderRadius="full" bg="red.400"
            />
          </Box>
        </Tooltip>

        <Tooltip label={displayName} placement="bottom">
          <Box cursor="pointer" onClick={() => navigate('/profile')}>
            <Avatar name={displayName} src={undefined} size="md" status="online" />
          </Box>
        </Tooltip>
      </HStack>
    </Box>
  );
}

export default Topbar;