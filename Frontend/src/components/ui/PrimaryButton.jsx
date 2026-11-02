import { Button } from '@chakra-ui/react';

/**
 * Primary Amethyst button.
 * Extends Chakra Button with the Amethyst palette defaults.
 *
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 */
export function PrimaryButton({ children, ...props }) {
  return (
    <Button
      bg="amethyst.600"
      color="white"
      _hover={{ bg: 'amethyst.700' }}
      _active={{ bg: 'amethyst.800' }}
      _disabled={{ bg: 'amethyst.300', cursor: 'not-allowed' }}
      borderRadius="10px"
      fontWeight="600"
      {...props}
    >
      {children}
    </Button>
  );
}

export default PrimaryButton;