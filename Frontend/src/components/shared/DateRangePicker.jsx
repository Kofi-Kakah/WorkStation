import { useState } from "react";
import {
  Box,
  Button as ChakraButton,
  HStack,
  Icon,
  Input,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Calendar, Check } from "lucide-react";
import { useDateRange } from "../../hooks/useDateRange.js";

/**
 * Emberline Date Range Picker pill dropdown.
 *
 * @param {{ className?: string }} props
 */
export function DateRangePicker({ className = "" }) {
  const {
    preset,
    label,
    presets,
    setPreset,
    setCustomDates,
    start,
    end,
  } = useDateRange();

  const [isOpen, setIsOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(
    start ? start.toISOString().slice(0, 10) : "",
  );
  const [customTo, setCustomTo] = useState(
    end ? end.toISOString().slice(0, 10) : "",
  );

  const handleApplyCustom = () => {
    if (customFrom && customTo) {
      setCustomDates(new Date(customFrom), new Date(customTo));
      setIsOpen(false);
    }
  };

  return (
    <Popover
      isOpen={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      placement="bottom-end"
      closeOnBlur
    >
      <PopoverTrigger>
        <ChakraButton
          variant="unstyled"
          className={`ui-button ui-button--secondary h-[36px] px-3.5 text-xs font-medium ${className}`.trim()}
          leftIcon={<Icon as={Calendar} boxSize={3.5} className="text-muted" />}
          _focusVisible={{
            outline: "2px solid",
            outlineColor: "accent",
            outlineOffset: "2px",
          }}
          aria-label={`Date range: ${label}`}
        >
          {label}
        </ChakraButton>
      </PopoverTrigger>

      <PopoverContent
        w="260px"
        bg="surface"
        borderColor="borderSubtle"
        borderWidth="1px"
        borderRadius="14px"
        boxShadow="0 16px 36px rgba(0, 0, 0, 0.55)"
        p={2}
        _focus={{ outline: "none" }}
      >
        <PopoverBody p={1}>
          <VStack align="stretch" spacing={1}>
            <Text
              fontSize="10px"
              fontWeight="600"
              color="textMuted"
              letterSpacing="0.06em"
              textTransform="uppercase"
              px={2.5}
              py={1}
            >
              Select date range
            </Text>

            {presets.map((item) => {
              const isSelected = preset === item.id;
              return (
                <Box
                  as="button"
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id !== "custom") {
                      setPreset(item.id);
                      setIsOpen(false);
                    } else {
                      setPreset("custom");
                    }
                  }}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  w="100%"
                  px={2.5}
                  py={2}
                  borderRadius="8px"
                  fontSize="xs"
                  fontWeight={isSelected ? "600" : "400"}
                  color={isSelected ? "textPrimary" : "textSecondary"}
                  bg={isSelected ? "surfaceRaised" : "transparent"}
                  _hover={{ bg: "surfaceRaised", color: "textPrimary" }}
                  transition="all 120ms ease"
                >
                  <Text>{item.label}</Text>
                  {isSelected && (
                    <Icon as={Check} boxSize={3.5} color="accent" />
                  )}
                </Box>
              );
            })}

            {preset === "custom" && (
              <Box mt={2} pt={2} borderTop="1px solid" borderColor="borderSubtle">
                <VStack spacing={2} align="stretch" px={1}>
                  <Box>
                    <Text fontSize="10px" color="textMuted" mb={1}>
                      Start date
                    </Text>
                    <Input
                      type="date"
                      size="sm"
                      bg="surfaceRaised"
                      borderColor="borderSubtle"
                      borderRadius="8px"
                      fontSize="xs"
                      color="textPrimary"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="10px" color="textMuted" mb={1}>
                      End date
                    </Text>
                    <Input
                      type="date"
                      size="sm"
                      bg="surfaceRaised"
                      borderColor="borderSubtle"
                      borderRadius="8px"
                      fontSize="xs"
                      color="textPrimary"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                    />
                  </Box>
                  <HStack justify="flex-end" pt={1}>
                    <ChakraButton
                      size="xs"
                      variant="unstyled"
                      className="ui-button ui-button--primary h-[28px] px-3 text-xs"
                      onClick={handleApplyCustom}
                      disabled={!customFrom || !customTo}
                    >
                      Apply range
                    </ChakraButton>
                  </HStack>
                </VStack>
              </Box>
            )}
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}

export default DateRangePicker;

