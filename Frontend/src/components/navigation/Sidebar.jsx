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
import { BrandMark } from "../shared/BrandMark.jsx";
import {
  Bell,
  Bug,
  Building2,
  CalendarDays,
  ChevronDown,
  FolderKanban,
  Hash,
  Inbox,
  Kanban,
  LayoutDashboard,
  MessageSquare,
  PanelLeftClose,
  Settings,
  UserRound,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Main",
    items: [
      { label: "Overview", icon: LayoutDashboard, to: "/dashboard" },
      { label: "Inbox", icon: Inbox, to: "/inbox" },
      { label: "Channels", icon: Hash, to: "/channels" },
      { label: "Direct messages", icon: MessageSquare, to: "/dm" },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Projects", icon: FolderKanban, to: "/projects" },
      { label: "Boards", icon: Kanban, to: "/boards" },
      { label: "Issues", icon: Bug, to: "/issues" },
      { label: "Productivity", icon: CalendarDays, to: "/productivity" },
    ],
  },
  {
    label: "Tools",
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

  const logoMark = <BrandMark size={32} iconSize={18} />;

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
        px={collapsed ? 0 : 4}
        pb={5}
        minH="56px"
      >
        {collapsed && onCollapse ? (
          <Tooltip label="Expand sidebar" placement="right">
            <Box
              as="button"
              type="button"
              aria-label="Expand sidebar"
              display="flex"
              alignItems="center"
              justifyContent="center"
              p={0}
              border="none"
              bg="transparent"
              cursor="pointer"
              borderRadius="icon"
              transition="filter 150ms ease"
              _hover={{ filter: "brightness(1.08)" }}
              onClick={onCollapse}
            >
              {logoMark}
            </Box>
          </Tooltip>
        ) : (
          <Box display="flex" alignItems="center" gap={3} minW="0">
            {logoMark}
            {!collapsed && (
              <Box minW="0">
                <Text
                  fontSize="sm"
                  fontWeight="600"
                  lineHeight="1.25"
                  letterSpacing="-0.01em"
                >
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
        )}
        {!collapsed && onCollapse && (
          <IconButton
            aria-label="Collapse sidebar"
            icon={<PanelLeftClose size={16} strokeWidth={1.5} />}
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
                fontSize="11px"
                fontWeight="600"
                letterSpacing="0.14em"
                textTransform="uppercase"
              >
                {group.label}
              </Text>
              <ChevronDown
                size={13}
                strokeWidth={1.5}
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
                      data-nav-active={active ? "true" : undefined}
                      className="ui-nav-item"
                      variant="ghost"
                      size="sm"
                      w="full"
                      h="40px"
                      px={collapsed ? 0 : 2.5}
                      justifyContent={collapsed ? "center" : "flex-start"}
                      gap={2.5}
                      borderRadius="control"
                      color={active ? "textPrimary" : "textSecondary"}
                      bg={active ? "accentSoft" : "transparent"}
                      border="1px solid"
                      borderColor={active ? "accentBorder" : "transparent"}
                      position="relative"
                      transition="background 150ms ease, border-color 150ms ease, color 150ms ease"
                      _hover={{
                        bg: active ? "accentSoft" : "surfaceRaised",
                        color: "textPrimary",
                      }}
                      onClick={() => navigateTo(item.to)}
                    >
                      <ItemIcon
                        size={17}
                        strokeWidth={1.5}
                        color={active ? "var(--accent)" : "var(--text-muted)"}
                        aria-hidden="true"
                      />
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
