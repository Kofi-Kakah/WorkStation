import { Tooltip as ChakraTooltip } from "@chakra-ui/react";

/**
 * Shared compact tooltip surface.
 *
 * @param {{ children: import('react').ReactNode, label: import('react').ReactNode, [key: string]: any }} props
 */
export function Tooltip({ children, label, ...props }) {
  return (
    <ChakraTooltip
      label={label}
      hasArrow
      bg="surface-raised"
      color="textPrimary"
      border="1px solid"
      borderColor="borderSubtle"
      borderRadius="8px"
      fontSize="xs"
      px={2}
      py={1}
      {...props}
    >
      {children}
    </ChakraTooltip>
  );
}

export default Tooltip;
