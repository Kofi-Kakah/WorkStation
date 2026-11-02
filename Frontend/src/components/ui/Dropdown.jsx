import {
  Button as ChakraButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
} from "@chakra-ui/react";
import { ChevronDown } from "lucide-react";

/**
 * Accessible dropdown menu with tokenized dark surfaces.
 *
 * @param {{ label: string, items: Array<{label: string, onSelect?: () => void, icon?: import('react').ReactNode, disabled?: boolean, divider?: boolean}>, className?: string }} props
 */
export function Dropdown({ label, items, className = "" }) {
  return (
    <Menu>
      <MenuButton
        as={ChakraButton}
        variant="unstyled"
        className={`ui-button ui-button--secondary ${className}`.trim()}
        rightIcon={<ChevronDown size={14} />}
        _focusVisible={{
          outline: "2px solid",
          outlineColor: "accent",
          outlineOffset: "2px",
        }}
      >
        {label}
      </MenuButton>
      <MenuList
        minW="180px"
        p={1}
        bg="surface"
        color="textPrimary"
        borderColor="borderSubtle"
        borderRadius="control"
        boxShadow="0 12px 32px rgba(0, 0, 0, 0.35)"
        zIndex="dropdown"
      >
        {items.map((item, index) =>
          item.divider ? (
            <MenuDivider key={`divider-${index}`} borderColor="borderSubtle" />
          ) : (
            <MenuItem
              key={item.label}
              icon={item.icon}
              isDisabled={item.disabled}
              onClick={item.onSelect}
              bg="transparent"
              color="textSecondary"
              fontSize="sm"
              borderRadius="8px"
              _hover={{ bg: "surfaceRaised", color: "textPrimary" }}
              _focus={{ bg: "surfaceRaised", color: "textPrimary" }}
            >
              {item.label}
            </MenuItem>
          ),
        )}
      </MenuList>
    </Menu>
  );
}

export default Dropdown;
