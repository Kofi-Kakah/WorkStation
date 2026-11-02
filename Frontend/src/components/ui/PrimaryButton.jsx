import { Button } from "./Button.jsx";

/**
 * Backwards-compatible primary button backed by the shared Button primitive.
 *
 * @param {{ children: import('react').ReactNode, [key: string]: any }} props
 */
export function PrimaryButton({ children, variant = "primary", ...props }) {
  return (
    <Button variant={variant} {...props}>
      {children}
    </Button>
  );
}

export default PrimaryButton;
