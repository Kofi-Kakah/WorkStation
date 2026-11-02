import { Box, HStack, Icon, IconButton, Text } from "@chakra-ui/react";
import { ArrowDownRight, ArrowUpRight, MoreHorizontal } from "lucide-react";
import { Card } from "./Card.jsx";
import { Badge } from "./Badge.jsx";

/**
 * Emberline metric card with semantic trend and optional attention marker.
 *
 * @param {{ label: string, value: number|string, icon: import('lucide-react').LucideIcon, trend?: number, comparison?: string, attention?: boolean, featured?: boolean, [key: string]: any }} props
 */
export function StatCard({
  label,
  value,
  icon: IconComp,
  trend,
  comparison = "vs last month",
  attention = false,
  featured = false,
  ...props
}) {
  const variant = featured ? "featured" : "default";

  return (
    <Card
      variant={variant}
      className="min-w-0 p-4"
      aria-label={`${label}: ${value}`}
      {...props}
    >
      <HStack justify="space-between" align="center">
        <HStack spacing={2.5} minW="0">
          <Box
            display="grid"
            placeItems="center"
            w="32px"
            h="32px"
            flexShrink={0}
            borderRadius="icon"
            bg={featured ? "whiteAlpha.200" : "accentSoft"}
            color={featured ? "white" : "accent"}
          >
            <Icon as={IconComp} boxSize={4} />
          </Box>
          <Text
            fontSize="xs"
            color={featured ? "whiteAlpha.900" : "textSecondary"}
            noOfLines={1}
          >
            {label}
          </Text>
        </HStack>
        {!featured && (
          <IconButton
            aria-label={`More options for ${label}`}
            icon={<MoreHorizontal size={16} />}
            variant="ghost"
            size="xs"
            minW="28px"
            h="28px"
            color="textMuted"
          />
        )}
      </HStack>

      <Text
        mt={4}
        fontSize="3xl"
        lineHeight="1"
        fontWeight="600"
        letterSpacing="-0.04em"
        fontVariantNumeric="tabular-nums"
        color={featured ? "white" : "textPrimary"}
      >
        {value}
      </Text>

      {trend !== undefined && (
        <HStack mt={3} spacing={2}>
          <Badge variant={trend >= 0 ? "success" : "danger"}>
            <Icon as={trend >= 0 ? ArrowUpRight : ArrowDownRight} boxSize={3} />
            {Math.abs(trend)}%
          </Badge>
          <Text
            fontSize="10px"
            color={featured ? "whiteAlpha.800" : "textMuted"}
            noOfLines={1}
          >
            {comparison}
          </Text>
          {attention && (
            <Box
              aria-label="Needs attention"
              role="img"
              title="Needs attention"
              w="6px"
              h="6px"
              borderRadius="full"
              bg="danger"
              ml="auto"
            />
          )}
        </HStack>
      )}
    </Card>
  );
}

export default StatCard;
