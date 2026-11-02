import {
  Input as ChakraInput,
  InputGroup,
  InputLeftElement,
  InputRightElement,
} from "@chakra-ui/react";

/**
 * Themed input with optional leading and trailing controls.
 *
 * @param {{ leftElement?: import('react').ReactNode, rightElement?: import('react').ReactNode, className?: string }} props
 */
export function Input({
  leftElement,
  rightElement,
  className = "",
  ...props
}) {
  return (
    <InputGroup className="ui-input-group">
      {leftElement && (
        <InputLeftElement
          h="44px"
          w="40px"
          color="textMuted"
          pointerEvents="none"
        >
          {leftElement}
        </InputLeftElement>
      )}
      <ChakraInput
        className={`ui-input ${className}`.trim()}
        pl={leftElement ? "40px" : undefined}
        pr={rightElement ? "40px" : undefined}
        {...props}
      />
      {rightElement && (
        <InputRightElement h="44px" w="40px">
          {rightElement}
        </InputRightElement>
      )}
    </InputGroup>
  );
}

export default Input;
