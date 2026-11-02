import { Box, Spinner, Text } from "@chakra-ui/react";

/**
 * Full-page or inline loading state.
 *
 * @param {{ label?: string, size?: 'sm'|'md'|'lg', className?: string, [key: string]: any }} props
 */
export function LoadingState({
  label = "Loading…",
  size = "md",
  className = "",
  ...props
}) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={12}
      className={className}
      {...props}
    >
      <Spinner size={size} color="amethyst.500" thickness="3px" />
      {label && (
        <Text mt={3} color="textSecondary" fontSize="sm">
          {label}
        </Text>
      )}
    </Box>
  );
}

export default LoadingState;
