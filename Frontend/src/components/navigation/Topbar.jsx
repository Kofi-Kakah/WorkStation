import {
  Box,
  Button,
  HStack,
  IconButton,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import {
  Home,
  Bell,
  ChevronRight,
  Command,
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
  const { profile, user } = useAuth();
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
  const displayName = profile?.displayName || "Account";
  const pageTitle =
    (location.pathname === "/"
      ? "Overview"
      : PAGE_TITLES.find(([path]) => location.pathname.startsWith(path))?.[1]) ||
    "Workspace";

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
      <HStack minW="0" spacing={2.5}>
        <IconButton
          aria-label="Open workspace navigation"
          icon={<Menu size={18} />}
          variant="ghost"
          display={{ base: "inline-flex", md: "none" }}
          onClick={onMenu}
        />
        <Box display="flex" alignItems="center" gap={2} minW="0">
          <Home
            size={15}
            className="shrink-0 text-muted"
            aria-hidden="true"
          />
          <Text
            display={{ base: "none", sm: "block" }}
            fontSize="xs"
            color="textMuted"
            noOfLines={1}
          >
            Workspace
          </Text>
          <ChevronRight
            size={13}
            className="hidden shrink-0 text-gray-400 sm:block"
            aria-hidden="true"
          />
          <Text
            fontSize="sm"
            fontWeight="600"
            color="textPrimary"
            noOfLines={1}
          >
            {pageTitle}
          </Text>
        </Box>
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
          <Search size={14} />
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
              icon={<Bell size={16} />}
              variant="ghost"
              size="sm"
              onClick={() => navigate("/notifications")}
            />
            {unreadCount > 0 && (
              <Box
                aria-hidden="true"
                pointerEvents="none"
                position="absolute"
                top="1px"
                right="1px"
                minW="15px"
                h="15px"
                px="3px"
                borderRadius="full"
                bg="danger"
                color="white"
                border="1px solid"
                borderColor="base"
                fontSize="9px"
                lineHeight="13px"
                textAlign="center"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Box>
            )}
          </Box>
        </Tooltip>

        <Tooltip label="Open workspace context">
          <IconButton
            aria-label="Toggle workspace context"
            icon={<PanelRight size={16} />}
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
          borderColor="accentBorder"
          cursor="pointer"
          onClick={() => navigate("/profile")}
        >
          <Avatar
            name={displayName}
            src={profile?.photoURL}
            size="sm"
            status="online"
          />
        </Box>
      </HStack>
    </Box>
  );
}

export default Topbar;
