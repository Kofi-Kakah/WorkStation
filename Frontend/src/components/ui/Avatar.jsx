import { Avatar as ChakraAvatar, Box } from "@chakra-ui/react";

/**
 * Emberline avatar primitive with warm orange gradient and initials fallback.
 *
 * @param {{ name?: string, src?: string, size?: '2xs'|'xs'|'sm'|'md'|'lg'|'xl', className?: string, [key: string]: any }} props
 */
export function Avatar({
  name,
  src,
  size = "md",
  className = "",
  ...props
}) {
  return (
    <Box position="relative" display="inline-flex" borderRadius="full">
      <ChakraAvatar
        name={name}
        src={src}
        size={size}
        className={`ui-avatar ${className}`.trim()}
        bg="transparent"
        color="white"
        border="1px solid"
        borderColor="borderSubtle"
        sx={{
          "& .chakra-avatar__initials": {
            background: "var(--gradient-primary)",
            color: "#ffffff",
            fontWeight: "600",
            fontSize: "xs",
          },
        }}
        {...props}
      />
    </Box>
  );
}

export default Avatar;

