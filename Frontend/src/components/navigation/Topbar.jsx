import {
  Box,
  Button,
  HStack,
  IconButton,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import {
  Bell,
  ChevronRight,
  Command,
  Menu,
  PanelRight,
  Search,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/useAuth.jsx";
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
  const { profile } = useAuth();
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
      h="58px"
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
          <Text
            display={{ base: "none", sm: "block" }}
            fontSize="xs"
            color="gray.500"
            _dark={{ color: "whiteAlpha.500" }}
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
            color="gray.800"
            _dark={{ color: "whiteAlpha.900" }}
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
          color="gray.500"
          borderColor="blackAlpha.200"
          fontWeight="400"
          _dark={{
            color: "whiteAlpha.600",
            borderColor: "whiteAlpha.200",
            bg: "whiteAlpha.50",
          }}
          _hover={{
            borderColor: "amethyst.400",
            bg: "amethyst.50",
            _dark: { bg: "whiteAlpha.100" },
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
            color="gray.400"
            fontSize="10px"
          >
            <Command size={11} />
            <span>K</span>
          </HStack>
        </Button>

        <Tooltip label="Notifications">
          <Box position="relative">
            <IconButton
              aria-label="Notifications"
              icon={<Bell size={16} />}
              variant="ghost"
              size="sm"
              onClick={() => navigate("/notifications")}
            />
            <Box
              aria-hidden="true"
              pointerEvents="none"
              position="absolute"
              top="7px"
              right="7px"
              w="6px"
              h="6px"
              borderRadius="full"
              bg="amethyst.500"
              border="1px solid"
              borderColor="white"
              _dark={{ borderColor: "#101012" }}
            />
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
          borderColor="amethyst.300"
          _dark={{ borderColor: "amethyst.700" }}
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
