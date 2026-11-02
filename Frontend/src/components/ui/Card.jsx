import { Box } from "@chakra-ui/react";

const VARIANTS = new Set(["default", "raised", "featured"]);

/**
 * Shared surface primitive for dashboard panels and interactive content.
 *
 * @param {{ variant?: 'default'|'raised'|'featured', className?: string, children?: import('react').ReactNode }} props
 */
export function Card({
  variant = "default",
  className = "",
  children,
  ...props
}) {
  const resolvedVariant = VARIANTS.has(variant) ? variant : "default";
  return (
    <Box
      className={`ui-card ui-card--${resolvedVariant} ${className}`.trim()}
      {...props}
    >
      {children}
    </Box>
  );
}

export default Card;
