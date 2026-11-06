import { Box } from "@chakra-ui/react";
import { Boxes } from "lucide-react";

/**
 * The Emberline brand tile: an orange gradient square with the product glyph.
 * Decorative by default so the adjacent wordmark carries the accessible name.
 */
export function BrandMark({ size = 32, iconSize = 18, className = "" }) {
  return (
    <Box
      className={className}
      display="flex"
      alignItems="center"
      justifyContent="center"
      w={`${size}px`}
      h={`${size}px`}
      flexShrink={0}
      borderRadius="icon"
      bg="var(--gradient-primary)"
      color="textOnAccent"
      boxShadow="var(--shadow-accent-soft)"
      aria-hidden="true"
    >
      <Boxes size={iconSize} strokeWidth={1.5} aria-hidden="true" />
    </Box>
  );
}

export default BrandMark;
