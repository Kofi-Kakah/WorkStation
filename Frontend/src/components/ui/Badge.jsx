import { Badge as ChakraBadge } from "@chakra-ui/react";

const VARIANTS = new Set(["neutral", "accent", "success", "danger", "warning"]);

/**
 * Compact status and metadata badge.
 *
 * @param {{ variant?: 'neutral'|'accent'|'success'|'danger'|'warning', className?: string }} props
 */
export function Badge({
  variant = "neutral",
  className = "",
  ...props
}) {
  const resolvedVariant = VARIANTS.has(variant) ? variant : "neutral";
  return (
    <ChakraBadge
      className={`ui-badge ui-badge--${resolvedVariant} ${className}`.trim()}
      textTransform="none"
      {...props}
    />
  );
}

export default Badge;
