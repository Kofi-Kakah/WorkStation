import { Card } from "./Card.jsx";

/**
 * Backwards-compatible card name, now rendered as a layered Emberline surface.
 *
 * @param {{ children: import('react').ReactNode, variant?: 'lg'|'sm'|'flat'|'raised'|'featured', hover?: boolean, className?: string, [key: string]: any }} props
 */
export function GlassCard({
  children,
  variant = "lg",
  hover = false,
  className = "",
  ...props
}) {
  const resolvedVariant =
    variant === "featured"
      ? "featured"
      : variant === "raised"
        ? "raised"
        : "default";
  const hoverClass = hover
    ? "transition-colors duration-150 hover:border-accent/40"
    : "";

  return (
    <Card
      variant={resolvedVariant}
      className={`p-4 ${hoverClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </Card>
  );
}

export default GlassCard;
