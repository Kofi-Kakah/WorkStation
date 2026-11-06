import { Box, Text, Icon } from "@chakra-ui/react";
import { Inbox } from "lucide-react";
import { Button } from "../ui/Button.jsx";

/**
 * Generic empty state.
 *
 * @param {{ icon?: import('lucide-react').LucideIcon, title?: string, description?: string, action?: { label: string, onClick: () => void }, [key: string]: any }} props
 */
export function EmptyState({
  icon: IconComp = Inbox,
  title = "Nothing here yet",
  description,
  action,
  ...props
}) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={16}
      px={4}
      textAlign="center"
      {...props}
    >
      <Box p={4} borderRadius="50%" bg="accentSoft" mb={4}>
        <Icon as={IconComp} boxSize={8} color="accent" />
      </Box>
      <Text fontSize="lg" fontWeight="700" mb={1} color="textPrimary">
        {title}
      </Text>
      {description && (
        <Text color="textSecondary" fontSize="sm" maxW="md" mb={4}>
          {description}
        </Text>
      )}
      {action && (
        <Button variant="primary" borderRadius="control" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Box>
  );
}

export default EmptyState;
