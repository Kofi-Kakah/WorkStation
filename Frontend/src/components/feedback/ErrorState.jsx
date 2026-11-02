import { Box, Text, Icon, Button } from "@chakra-ui/react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Generic error state.
 *
 * @param {{ title?: string, description?: string, onRetry?: () => void, [key: string]: any }} props
 */
export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
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
        bg="red.100"
        _dark={{ bg: "red.900" }}
        mb={4}
      >
        <Icon as={AlertTriangle} boxSize={8} color="red.500" />
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
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="ghost"
          leftIcon={<RefreshCw size={16} />}
        >
          Try again
        </Button>
      )}
    </Box>
  );
}

export default ErrorState;
