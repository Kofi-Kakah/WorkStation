import { useState } from "react";
import { Box, Text, HStack, Icon, IconButton, Divider } from "@chakra-ui/react";
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
            <Text fontSize="xs" color="textMuted">
              {subtitle}
            </Text>
          )}
        </HStack>
        <HStack gap={1}>
          <IconButton
            aria-label={expanded ? "Collapse context panel" : "Expand context panel"}
            icon={<Icon as={expanded ? ChevronUp : ChevronDown} boxSize={4} />}
            variant="ghost"
            size="xs"
            color="textMuted"
            _hover={{ bg: "surfaceRaised", color: "textPrimary" }}
            onClick={() => setExpanded((e) => !e)}
          />
          <IconButton
            aria-label="Close context panel"
            icon={<Icon as={X} boxSize={4} />}
            variant="ghost"
            size="xs"
            color="textMuted"
            _hover={{ bg: "surfaceRaised", color: "textPrimary" }}
            onClick={onClose}
          />
        </HStack>
      </HStack>

      <Divider />

      <Box flex={1} overflowY="auto" py={2}>
        {expanded ? (
          <Box display="flex" flexDirection="column" gap={3}>
            {activeSections.map((section) => (
              <Box key={section.label} px={3}>
                <HStack gap={2} mb={2}>
                  <Icon as={section.icon} boxSize={4} color="accent" />
                  <Text
                    fontSize="xs"
                    fontWeight="700"
                    color="textMuted"
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
                    _hover={{ bg: "surfaceRaised" }}
                  >
                    <Box minWidth={0}>
                      <Text fontSize="sm" truncate>
                        {item.label}
                      </Text>
                      <Text
                        fontSize="xs"
                        color="textMuted"
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
                            ? "success"
                            : item.status === "away"
                              ? "warning"
                              : "textMuted"
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
            <Text fontSize="xs" color="textMuted">
              Panel collapsed
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default ContextPanel;
