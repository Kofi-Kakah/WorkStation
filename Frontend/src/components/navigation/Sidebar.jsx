import {
  Box,
  Button,
  IconButton,
  Select,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth.jsx";
import {
  Bell,
  Building2,
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
  CalendarDays,
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
    label: "Channels",
    items: [
      { label: "Channels", icon: Hash, to: "/channels" },
      { label: "Direct messages", icon: MessageSquare, to: "/dm" },
    ],
  },
  {
    label: "Projects",
    items: [
      { label: "Projects", icon: FolderKanban, to: "/projects" },
    ],
  },
  {
    label: "Boards",
    items: [{ label: "Boards", icon: Kanban, to: "/boards" }],
  },
  {
    label: "Issues",
    items: [
      { label: "Issues", icon: Bug, to: "/issues" },
      { label: "Productivity", icon: CalendarDays, to: "/productivity" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Notifications", icon: Bell, to: "/notifications" },
      { label: "Workspace settings", icon: Settings, to: "/workspace" },
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
  const { workspaces, activeWorkspace, selectWorkspace } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState({});

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
        justifyContent="space-between"
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
            bg="linear-gradient(135deg, #d8b7ff 0%, #bd79ff 38%, #9660ce 100%)"
            color="white"
            fontSize="sm"
            fontWeight="800"
            boxShadow="0 10px 20px rgba(150, 96, 206, 0.35)"
          >
            U
          </Box>
          {!collapsed && (
            <Box minW="0">
              <Text fontSize="sm" fontWeight="700" lineHeight="1.25">
                WorkStation
              </Text>
              <Select
                aria-label="Select workspace"
                value={activeWorkspace?.id || ""}
                onChange={(event) => selectWorkspace(event.target.value)}
                size="xs"
                variant="unstyled"
                mt={1}
                maxW="150px"
                color="textMuted"
                fontSize="xs"
                icon={<Building2 size={12} />}
                _focusVisible={{ boxShadow: "0 0 0 2px var(--accent)" }}
              >
                {!workspaces.length && (
                  <option value="" disabled>
                    No workspace yet
                  </option>
                )}
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </Select>
            </Box>
          )}
        </Box>
        {onCollapse && (
          <IconButton
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            icon={collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            variant="ghost"
            size="xs"
            minW="28px"
            h="28px"
            color="textMuted"
            onClick={onCollapse}
            className="sidebar-collapse-button"
          />
        )}
      </Box>

      {!collapsed && (
        <Box px={3} pb={3}>
          <Button
            type="button"
            w="full"
            h="36px"
            justifyContent="flex-start"
            gap={2}
            variant="outline"
            borderColor="borderSubtle"
            color="textSecondary"
            bg="surface"
            fontSize="xs"
            fontWeight="500"
            _hover={{
              borderColor: "accentBorder",
              color: "textPrimary",
              bg: "surfaceRaised",
            }}
            onClick={() => navigateTo("/search")}
          >
            <Search size={14} />
            <Text flex={1} textAlign="left">
              Quick search
            </Text>
            <Text fontSize="10px" color="textMuted">
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
            color="accent"
            fontSize="sm"
            fontWeight="600"
            _hover={{ bg: "accentSoft", color: "accentHot" }}
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
              <Button
              type="button"
              variant="ghost"
              w="full"
              h="26px"
              justifyContent="space-between"
              px={2}
              mb={1}
              color="textMuted"
              _hover={{ color: "textSecondary", bg: "transparent" }}
              aria-expanded={expandedGroups[group.label] !== false}
              onClick={() =>
                setExpandedGroups((groups) => ({
                  ...groups,
                  [group.label]: groups[group.label] === false,
                }))
              }
              >
              <Text
                fontSize="10px"
                fontWeight="700"
                letterSpacing="0.12em"
                textTransform="uppercase"
              >
                {group.label}
              </Text>
              <ChevronDown
                size={13}
                className={`transition-transform duration-150 ${
                  expandedGroups[group.label] === false ? "-rotate-90" : ""
                }`}
              />
              </Button>
            )}
            {(!collapsed && expandedGroups[group.label] === false) ? null : (
            <Box display="flex" flexDirection="column" gap={1}>
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
                      data-active={active}
                      className="ui-nav-item"
                      variant="ghost"
                      size="sm"
                      w="full"
                      h="40px"
                      px={collapsed ? 0 : 2.5}
                      justifyContent={collapsed ? "center" : "flex-start"}
                      gap={2.5}
                      borderRadius="control"
                      color={active ? "primary" : "secondary"}
                      bg={active ? "accentSoft" : "transparent"}
                      border={active ? "1px solid" : "1px solid transparent"}
                      borderColor={active ? "accentBorder" : "transparent"}
                      position="relative"
                      _hover={{
                        bg: active ? "accentSoft" : "surfaceRaised",
                        color: "primary",
                      }}
                      onClick={() => navigateTo(item.to)}
                    >
                      <ItemIcon size={16} aria-hidden="true" />
                      {!collapsed && (
                        <Text
                          flex={1}
                          textAlign="left"
                          fontSize="13px"
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
            )}
          </Box>
        ))}
      </Box>

    </Box>
  );
}

export default Sidebar;
