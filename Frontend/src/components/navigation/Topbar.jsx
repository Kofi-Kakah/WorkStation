import {
  Box,
  Button,
  HStack,
  IconButton,
  Text,
  Tooltip,
  useBreakpointValue,
} from "@chakra-ui/react";
import {
  Home,
  Bell,
  ChevronRight,
  Command,
  LogOut,
  Menu,
  PanelRight,
  Search,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/useAuth.jsx";
import { api } from "../../services/apiClient.js";
import Avatar from "../shared/Avatar.jsx";

const PAGE_TITLES = [
  ["/dashboard", "Overview"],
  ["/health", "System health"],
  ["/inbox", "Inbox"],
  ["/channels", "Channels"],
  ["/dm", "Direct messages"],
  ["/projects", "Projects"],
  ["/boards", "Boards"],
  ["/issues", "Issues"],
  ["/productivity", "Productivity"],
  ["/search", "Search"],
  ["/notifications", "Notifications"],
  ["/workspace", "Workspace settings"],
  ["/profile", "Profile"],
  ["/settings", "Settings"],
];

/**
 * Compact workspace toolbar with route context and global controls.
 *
 * @param {{ className?: string, onMenu?: () => void, onToggleContext?: () => void }} props
 */
export function Topbar({ className = "", onMenu, onToggleContext }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user, logout } = useAuth();
  const unreadNotificationsQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    enabled: Boolean(user?.uid),
    refetchInterval: 60_000,
    queryFn: async () => {
      const response = await api.get("/notifications?limit=1");
      return response.unreadCount || 0;
    },
  });
  const unreadCount = unreadNotificationsQuery.data || 0;
  const showBreadcrumbParent =
    useBreakpointValue({ base: false, sm: true }) ?? false;
  const displayName = profile?.displayName || "Account";
  const matchedTitle = PAGE_TITLES.find(([path]) =>
    location.pathname.startsWith(path),
  )?.[1];
  const lastSegment = location.pathname.split("/").filter(Boolean).pop();
  const fallbackTitle = lastSegment
    ? lastSegment
        .replace(/-/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase())
    : "Overview";
  const pageTitle =
    location.pathname === "/" ? "Overview" : matchedTitle || fallbackTitle;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <Box
      as="header"
      className={`app-topbar border-b ${className}`}
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      gap={4}
      h="56px"
      px={{ base: 3, md: 5, xl: 6 }}
      flexShrink={0}
    >
      <HStack minW="0" spacing={1.5}>
        <IconButton
          aria-label="Open workspace navigation"
          icon={<Menu size={18} strokeWidth={1.5} />}
          variant="ghost"
          size="sm"
          display={{ base: "inline-flex", md: "none" }}
          onClick={onMenu}
        />
        <IconButton
          aria-label="Go to overview"
          icon={<Home size={15} strokeWidth={1.5} />}
          variant="ghost"
          size="xs"
          minW="28px"
          h="28px"
          flexShrink={0}
          color="textMuted"
          _hover={{ color: "textPrimary", bg: "surfaceRaised" }}
          onClick={() => navigate("/dashboard")}
        />
        {showBreadcrumbParent && (
          <HStack spacing={1.5} minW="0">
            <Box
              as="button"
              type="button"
              flexShrink={0}
              px={1}
              py={0.5}
              borderRadius="6px"
              fontSize="xs"
              color="textMuted"
              transition="color 150ms ease"
              _hover={{ color: "textPrimary" }}
              onClick={() => navigate("/dashboard")}
            >
              Workspace
            </Box>
            <ChevronRight
              size={13}
              color="var(--text-muted)"
              aria-hidden="true"
              style={{ flexShrink: 0 }}
            />
          </HStack>
        )}
        <Text
          fontSize="sm"
          fontWeight="600"
          color="textPrimary"
          noOfLines={1}
        >
          {pageTitle}
        </Text>
      </HStack>

      <HStack spacing={{ base: 1, md: 2 }} flexShrink={0}>
        <Button
          aria-label="Search workspace"
          variant="outline"
          size="sm"
          h="34px"
          minW={{ base: "34px", sm: "200px", lg: "260px" }}
          px={{ base: 2, sm: 3 }}
          justifyContent="flex-start"
          gap={2}
          color="textSecondary"
          borderColor="borderSubtle"
          bg="surface"
          fontWeight="400"
          _hover={{
            borderColor: "accentBorder",
            bg: "surfaceRaised",
            color: "textPrimary",
          }}
          onClick={() => navigate("/search")}
        >
          <Search size={14} strokeWidth={1.5} />
          <Text display={{ base: "none", sm: "block" }} flex={1} textAlign="left">
            Search workspace...
          </Text>
          <HStack
            display={{ base: "none", lg: "flex" }}
            spacing={0.5}
            color="textMuted"
            fontSize="10px"
          >
            <Command size={11} />
            <span>K</span>
          </HStack>
        </Button>

        <Tooltip
          label={
            unreadNotificationsQuery.error
              ? "Unread notifications are unavailable"
              : unreadCount
                ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                : "Notifications"
          }
        >
          <Box position="relative">
            <IconButton
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
              icon={<Bell size={16} strokeWidth={1.5} />}
              variant="ghost"
              size="sm"
              onClick={() => navigate("/notifications")}
            />
            {unreadCount > 0 && (
              <Box
                data-testid="notification-dot"
                aria-hidden="true"
                pointerEvents="none"
                position="absolute"
                top="6px"
                right="6px"
                w="8px"
                h="8px"
                borderRadius="full"
                bg="danger"
                border="2px solid"
                borderColor="base"
              />
            )}
          </Box>
        </Tooltip>

        <Tooltip label="Open workspace context">
          <IconButton
            aria-label="Toggle workspace context"
            icon={<PanelRight size={16} strokeWidth={1.5} />}
            variant="ghost"
            size="sm"
            display="inline-flex"
            onClick={onToggleContext}
          />
        </Tooltip>

        <Box
          as="button"
          type="button"
          aria-label={`Account: ${displayName}`}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="2px"
          borderRadius="full"
          border="1px solid"
          borderColor="borderSubtle"
          cursor="pointer"
          transition="border-color 150ms ease"
          _hover={{ borderColor: "accentBorder" }}
          onClick={() => navigate("/profile")}
        >
          <Avatar
            name={displayName}
            src={profile?.photoURL}
            size="sm"
            status="online"
          />
        </Box>

        <Tooltip label="Log out">
          <IconButton
            aria-label="Log out"
            icon={<LogOut size={16} strokeWidth={1.5} />}
            variant="ghost"
            size="sm"
            onClick={handleLogout}
          />
        </Tooltip>
      </HStack>
    </Box>
  );
}

export default Topbar;
