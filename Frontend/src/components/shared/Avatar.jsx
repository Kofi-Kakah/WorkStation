import { Avatar as ChakraAvatar, Box } from "@chakra-ui/react";

const STATUS_COLORS = {
  online: "success",
  busy: "danger",
  away: "warning",
  offline: "textMuted",
};

/**
 * User avatar using the Emberline accent and semantic presence colors.
 *
 * @param {{ name?: string, src?: string, size?: 'sm'|'md'|'lg'|'xl', status?: 'online'|'offline'|'away'|'busy', className?: string }} props
 */
export function Avatar({ name, src, size = "md", status, className = "" }) {
  return (
    <Box position="relative" display="inline-flex" className={className}>
      <ChakraAvatar
        size={size}
        name={name}
        src={src}
        className="ui-avatar"
        bg="accent"
        color="white"
        fontWeight="600"
        border="1px solid"
        borderColor="borderSubtle"
      />
      {status && (
        <Box
          position="absolute"
          bottom={0}
          right={0}
          w={size === "sm" ? "9px" : "11px"}
          h={size === "sm" ? "9px" : "11px"}
          borderRadius="full"
          bg={STATUS_COLORS[status] || "textMuted"}
          border="2px solid"
          borderColor="surface"
          aria-label={`Status: ${status}`}
        />
      )}
    </Box>
  );
}

export default Avatar;
