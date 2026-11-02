import { Button as ChakraButton } from "@chakra-ui/react";

const VARIANTS = new Set(["primary", "secondary", "ghost", "icon"]);

/**
 * Emberline button primitive built on Chakra's accessible button.
 *
 * @param {{ variant?: 'primary'|'secondary'|'ghost'|'icon', className?: string }} props
 */
export function Button({
  variant = "secondary",
  className = "",
  ...props
}) {
  const resolvedVariant = VARIANTS.has(variant) ? variant : "secondary";
  return (
    <ChakraButton
      variant="unstyled"
      className={`ui-button ui-button--${resolvedVariant} ${className}`.trim()}
      _focusVisible={{
        outline: "2px solid",
        outlineColor: "accent",
        outlineOffset: "2px",
      }}
      {...props}
    />
  );
}

export default Button;
