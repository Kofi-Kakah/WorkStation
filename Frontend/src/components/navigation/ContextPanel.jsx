import { useState } from "react";
import { Box, Text, HStack, Icon, Divider } from "@chakra-ui/react";
import { X, ChevronUp, ChevronDown, Users, Activity } from "lucide-react";

/**
 * Reusable contextual right panel.
 *
 * @param {{ title?: string, subtitle?: string, sections?: Array, onClose?: () => void, onToggle?: () => void, [key: string]: any }} props
 */
export function ContextPanel({
  title = "Context",
  subtitle,
  sections,
  onClose,
  ...props
}) {
  const [expanded, setExpanded] = useState(true);

  const defaultSections = [
    {
      label: "People",
      icon: Users,
      items: [
        { label: "Alice Chen", detail: "Project manager", status: "online" },
        { label: "Marcus Lee", detail: "Developer", status: "online" },
        { label: "Priya Patel", detail: "Designer", status: "away" },
      ],
    },
    {
      label: "Activity",
      icon: Activity,
      items: [
        { label: "Issue updated", detail: "2 minutes ago" },
        { label: "Comment added", detail: "1 hour ago" },
        { label: "Card moved", detail: "3 hours ago" },
      ],
    },
  ];

  const activeSections = sections || defaultSections;

  return (
    <Box className="flex flex-col h-full" {...props}>
      <HStack justify="space-between" align="center" p={3}>
        <HStack gap={2}>
          <Text fontSize="sm" fontWeight="700">
            {title}
          </Text>
          {subtitle && (
            <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>
              {subtitle}
            </Text>
          )}
        </HStack>
        <HStack gap={1}>
          <Box
            p={1}
            borderRadius="6px"
            cursor="pointer"
            _hover={{ bg: "blackAlpha.50" }}
            onClick={() => setExpanded((e) => !e)}
          >
            <Icon as={expanded ? ChevronUp : ChevronDown} boxSize={4} />
          </Box>
          <Box
            p={1}
            borderRadius="6px"
            cursor="pointer"
            _hover={{ bg: "blackAlpha.50" }}
            onClick={onClose}
          >
            <X size={14} />
          </Box>
        </HStack>
      </HStack>

      <Divider />

      <Box flex={1} overflowY="auto" py={2}>
        {expanded ? (
          <Box display="flex" flexDirection="column" gap={3}>
            {activeSections.map((section) => (
              <Box key={section.label} px={3}>
                <HStack gap={2} mb={2}>
                  <Icon as={section.icon} boxSize={4} color="amethyst.600" />
                  <Text
                    fontSize="xs"
                    fontWeight="700"
                    color="gray.500"
                    _dark={{ color: "gray.400" }}
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    {section.label}
                  </Text>
                </HStack>
                {section.items.map((item, i) => (
                  <HStack
                    key={i}
                    justify="space-between"
                    py={1}
                    px={2}
                    borderRadius="6px"
                    _hover={{ bg: "blackAlpha.50" }}
                  >
                    <Box minWidth={0}>
                      <Text fontSize="sm" truncate>
                        {item.label}
                      </Text>
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        _dark={{ color: "gray.400" }}
                        truncate
                      >
                        {item.detail}
                      </Text>
                    </Box>
                    {item.status && (
                      <Box
                        w="8px"
                        h="8px"
                        borderRadius="full"
                        bg={
                          item.status === "online"
                            ? "green.400"
                            : item.status === "away"
                              ? "yellow.400"
                              : "gray.300"
                        }
                        flexShrink={0}
                      />
                    )}
                  </HStack>
                ))}
              </Box>
            ))}
          </Box>
        ) : (
          <Box p={3} textAlign="center">
            <Text fontSize="xs" color="gray.500" _dark={{ color: "gray.400" }}>
              Panel collapsed
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default ContextPanel;
