import { Box, Button, Text, Tooltip } from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  FolderKanban,
  Hash,
  Inbox,
  Kanban,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Bug,
  UserRound,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", icon: LayoutDashboard, to: "/dashboard" },
      { label: "Inbox", icon: Inbox, to: "/inbox" },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Channels", icon: Hash, to: "/channels" },
      { label: "Direct messages", icon: MessageSquare, to: "/dm" },
    ],
  },
  {
    label: "Work",
    items: [
      { label: "Projects", icon: FolderKanban, to: "/projects" },
      { label: "Boards", icon: Kanban, to: "/boards" },
      { label: "Issues", icon: Bug, to: "/issues" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Notifications", icon: Bell, to: "/notifications" },
      { label: "Settings", icon: Settings, to: "/settings" },
      { label: "Profile", icon: UserRound, to: "/profile" },
    ],
  },
];

/**
 * Workspace navigation for desktop, tablet, and mobile layouts.
 *
 * @param {{ collapsed?: boolean, onCollapse?: () => void, onNavigate?: () => void }} props
 */
export function Sidebar({
  collapsed = false,
  onCollapse,
  onNavigate,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (to) =>
    (to === "/dashboard" && location.pathname === "/") ||
    location.pathname === to ||
    location.pathname.startsWith(`${to}/`);

  const navigateTo = (to) => {
    navigate(to);
    onNavigate?.();
  };

  return (
    <Box
      className="app-sidebar flex h-full flex-col"
      w="full"
      minW="0"
      py={3}
    >
      <Box
        display="flex"
        alignItems="center"
        justifyContent={collapsed ? "center" : "space-between"}
        px={collapsed ? 2 : 4}
        pb={5}
        minH="54px"
      >
        <Box display="flex" alignItems="center" gap={3} minW="0">
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            w="32px"
            h="32px"
            flexShrink={0}
            borderRadius="10px"
            bg="amethyst.600"
            color="white"
            fontSize="sm"
            fontWeight="800"
          >
            U
          </Box>
          {!collapsed && (
            <Box minW="0">
              <Text fontSize="sm" fontWeight="700" lineHeight="1.25">
                WorkStation
              </Text>
              <Text
                fontSize="xs"
                color="gray.500"
                _dark={{ color: "whiteAlpha.500" }}
              >
                Workspace
              </Text>
            </Box>
          )}
        </Box>
        {!collapsed && (
          <Button
            aria-label="Select workspace"
            variant="ghost"
            size="xs"
            minW="7"
            px={1}
            color="gray.500"
            _dark={{ color: "whiteAlpha.600" }}
          >
            <ChevronDown size={15} />
          </Button>
        )}
      </Box>

      {!collapsed && (
        <Box px={3} pb={3}>
          <Button
            w="full"
            h="36px"
            justifyContent="flex-start"
            gap={2}
            variant="outline"
            borderColor="blackAlpha.200"
            color="gray.600"
            fontSize="xs"
            fontWeight="500"
            _dark={{
              borderColor: "whiteAlpha.200",
              color: "whiteAlpha.700",
              bg: "whiteAlpha.50",
            }}
            _hover={{
              borderColor: "amethyst.400",
              color: "amethyst.700",
              _dark: { color: "amethyst.200" },
            }}
          >
            <Search size={14} />
            <Text flex={1} textAlign="left">
              Quick search
            </Text>
            <Text fontSize="10px" color="gray.400">
              Ctrl K
            </Text>
          </Button>
        </Box>
      )}

      {!collapsed && (
        <Box px={3} pb={2}>
          <Button
            w="full"
            h="36px"
            justifyContent="flex-start"
            gap={2}
            variant="ghost"
            color="amethyst.700"
            fontSize="sm"
            fontWeight="600"
            _dark={{ color: "amethyst.300" }}
            _hover={{ bg: "amethyst.100", _dark: { bg: "whiteAlpha.100" } }}
          >
            <Plus size={15} />
            Create new
          </Button>
        </Box>
      )}

      <Box
        as="nav"
        aria-label="Workspace navigation"
        flex={1}
        minH="0"
        overflowY="auto"
        className="app-scrollbar"
        px={2}
        py={2}
      >
        {NAV_GROUPS.map((group) => (
          <Box key={group.label} mb={4}>
            {!collapsed && (
              <Text
                px={2}
                pb={1.5}
                fontSize="10px"
                fontWeight="700"
                letterSpacing="0.11em"
                textTransform="uppercase"
                color="gray.500"
                _dark={{ color: "whiteAlpha.500" }}
              >
                {group.label}
              </Text>
            )}
            <Box display="flex" flexDirection="column" gap={0.5}>
              {group.items.map((item) => {
                const active = isActive(item.to);
                const ItemIcon = item.icon;
                return (
                  <Tooltip
                    key={item.label}
                    label={item.label}
                    placement="right"
                    isDisabled={!collapsed}
                  >
                    <Button
                      aria-current={active ? "page" : undefined}
                      variant="ghost"
                      size="sm"
                      w="full"
                      h="34px"
                      px={collapsed ? 0 : 2}
                      justifyContent={collapsed ? "center" : "flex-start"}
                      gap={2.5}
                      borderRadius="8px"
                      color={active ? "amethyst.700" : "gray.600"}
                      bg={active ? "amethyst.100" : "transparent"}
                      _dark={{
                        color: active ? "amethyst.200" : "whiteAlpha.700",
                        bg: active ? "amethyst.900" : "transparent",
                      }}
                      _hover={{
                        bg: active ? "amethyst.100" : "blackAlpha.50",
                        color: active ? "amethyst.800" : "gray.900",
                        _dark: {
                          bg: active ? "amethyst.900" : "whiteAlpha.100",
                          color: "white",
                        },
                      }}
                      onClick={() => navigateTo(item.to)}
                    >
                      <ItemIcon size={16} aria-hidden="true" />
                      {!collapsed && (
                        <Text
                          flex={1}
                          textAlign="left"
                          fontSize="xs"
                          fontWeight={active ? "600" : "500"}
                          noOfLines={1}
                        >
                          {item.label}
                        </Text>
                      )}
                    </Button>
                  </Tooltip>
                );
              })}
            </Box>
          </Box>
        ))}
      </Box>

      {onCollapse && (
        <Box
          borderTop="1px solid"
          borderColor="blackAlpha.100"
          _dark={{ borderColor: "whiteAlpha.100" }}
          px={2}
          pt={2}
        >
          <Button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            variant="ghost"
            size="sm"
            w="full"
            h="34px"
            justifyContent={collapsed ? "center" : "flex-start"}
            gap={2.5}
            color="gray.500"
            _dark={{ color: "whiteAlpha.600" }}
            _hover={{ bg: "blackAlpha.50", _dark: { bg: "whiteAlpha.100" } }}
            onClick={onCollapse}
          >
            {collapsed ? (
              <ChevronsRight size={16} />
            ) : (
              <ChevronsLeft size={16} />
            )}
            {!collapsed && (
              <Text fontSize="xs" fontWeight="500">
                Collapse sidebar
              </Text>
            )}
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default Sidebar;
