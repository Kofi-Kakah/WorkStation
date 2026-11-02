import { Box } from "@chakra-ui/react";

/**
 * Reusable glass-surface card.
 *
 * @param {{ children: import('react').ReactNode, variant?: 'lg'|'sm'|'flat', hover?: boolean, className?: string, [key: string]: any }} props
 */
export function GlassCard({
  children,
  variant = "lg",
  hover = false,
  className = "",
  ...props
}) {
  const base = variant === "sm" ? "glass-surface-sm" : "glass-surface";
  const hoverCls = hover
    ? "transition-all duration-200 hover:shadow-glass-hover hover:-translate-y-0.5"
    : "";

  return (
    <Box className={`${base} ${hoverCls} ${className}`} {...props}>
      {children}
    </Box>
  );
}

export default GlassCard;
