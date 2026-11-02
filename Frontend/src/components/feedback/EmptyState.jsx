import { Box, Text, Icon, Button } from "@chakra-ui/react";
import { Inbox } from "lucide-react";

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
      <Box
        p={4}
        borderRadius="50%"
        bg="amethyst.100"
        _dark={{ bg: "amethyst.900" }}
        mb={4}
      >
        <Icon as={IconComp} boxSize={8} color="amethyst.500" />
      </Box>
      <Text fontSize="lg" fontWeight="700" mb={1}>
        {title}
      </Text>
      {description && (
        <Text
          color="gray.500"
          _dark={{ color: "gray.400" }}
          fontSize="sm"
          maxW="md"
          mb={4}
        >
          {description}
        </Text>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          bg="amethyst.600"
          color="white"
          _hover={{ bg: "amethyst.700" }}
          borderRadius="10px"
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
}

export default EmptyState;
