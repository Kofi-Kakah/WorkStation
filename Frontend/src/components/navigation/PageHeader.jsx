import { useEffect, useState } from "react";
import {
  Box,
  Button as ChakraButton,
  HStack,
  Icon,
  Text,
} from "@chakra-ui/react";
import { Download, Plus } from "lucide-react";
import { DateRangePicker } from "../shared/DateRangePicker.jsx";
import { ProjectFilterDropdown } from "../shared/ProjectFilterDropdown.jsx";

/**
 * Standard Emberline page header with title, project filter pill,
 * real-time freshness indicator, date range picker, export, and primary action button.
 *
 * @param {{
 *   title: string,
 *   showProjectFilter?: boolean,
 *   lastUpdated?: Date|number,
 *   onExport?: () => void,
 *   exportLabel?: string,
 *   primaryActionLabel?: string,
 *   onPrimaryAction?: () => void,
 *   primaryActionShortcut?: string,
 *   className?: string
 * }} props
 */
export function PageHeader({
  title,
  showProjectFilter = true,
  lastUpdated,
  onExport,
  exportLabel = "Export",
  primaryActionLabel = "New issue",
  onPrimaryAction,
  primaryActionShortcut = "C",
  className = "",
}) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [secondsAgo, setSecondsAgo] = useState(14);

  // Online / offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Update relative time
  useEffect(() => {
    const timer = setInterval(() => {
      if (lastUpdated) {
        const diffSec = Math.max(
          1,
          Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000),
        );
        setSecondsAgo(diffSec);
      } else {
        setSecondsAgo((s) => (s >= 59 ? 12 : s + 3));
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  // Keyboard shortcut listener (e.g. 'C' for create issue when not in input)
  useEffect(() => {
    if (!onPrimaryAction) return;
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
        return;
      }
      if (e.key.toUpperCase() === primaryActionShortcut.toUpperCase() && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onPrimaryAction();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onPrimaryAction, primaryActionShortcut]);

  return (
    <Box
      className={`page-header pb-4 pt-1 ${className}`}
      display="flex"
      flexDirection={{ base: "column", lg: "row" }}
      justifyContent="space-between"
      alignItems={{ base: "flex-start", lg: "center" }}
      gap={4}
    >
      {/* Left: Title, Project Dropdown, and Live Freshness Status */}
      <Box minW="0">
        <HStack spacing={3} align="center" flexWrap="wrap">
          <Text
            fontSize={{ base: "24px", md: "28px" }}
            fontWeight="600"
            color="textPrimary"
            letterSpacing="-0.03em"
            lineHeight="1.2"
          >
            {title}
          </Text>
          {showProjectFilter && <ProjectFilterDropdown />}
        </HStack>

        <HStack mt={1.5} spacing={2} align="center">
          <Box
            w="6px"
            h="6px"
            borderRadius="full"
            bg={isOnline ? "success" : "warning"}
            boxShadow={
              isOnline
                ? "0 0 8px var(--success)"
                : "0 0 8px var(--warning)"
            }
          />
          <Text fontSize="11px" color="textMuted">
            {isOnline
              ? `Live · updated ${secondsAgo} seconds ago`
              : "Reconnecting… offline"}
          </Text>
        </HStack>
      </Box>

      {/* Right: Actions Group (Date Range, Export, Primary Orange Action Button) */}
      <HStack spacing={2.5} flexWrap="wrap" align="center">
        <DateRangePicker />

        {onExport && (
          <ChakraButton
            variant="unstyled"
            className="ui-button ui-button--secondary h-[36px] px-3.5 text-xs font-medium"
            leftIcon={<Icon as={Download} boxSize={3.5} className="text-muted" />}
            onClick={onExport}
            aria-label={exportLabel}
          >
            {exportLabel}
          </ChakraButton>
        )}

        {onPrimaryAction && (
          <ChakraButton
            variant="unstyled"
            className="ui-button ui-button--primary h-[36px] px-4 text-xs font-semibold"
            leftIcon={<Icon as={Plus} boxSize={4} />}
            onClick={onPrimaryAction}
            aria-label={`${primaryActionLabel} (shortcut: ${primaryActionShortcut})`}
          >
            {primaryActionLabel}
          </ChakraButton>
        )}
      </HStack>
    </Box>
  );
}

export default PageHeader;

