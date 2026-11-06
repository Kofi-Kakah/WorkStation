import {
  Box,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Skeleton,
  Text,
} from "@chakra-ui/react";
import { ArrowDownRight, ArrowUpRight, MoreHorizontal } from "lucide-react";
import { Card } from "./Card.jsx";
import { Badge } from "./Badge.jsx";
import { Toggle } from "./Toggle.jsx";

/**
 * Emberline metric card with semantic trend, optional attention marker,
 * actions menu, skeleton/error/empty states, and featured variant.
 *
 * @param {{
 *   label: string,
 *   value: number|string,
 *   icon?: import('lucide-react').LucideIcon,
 *   trend?: number,
 *   invertTrend?: boolean,
 *   comparison?: string,
 *   caption?: string,
 *   attention?: boolean,
 *   featured?: boolean,
 *   loading?: boolean,
 *   error?: string,
 *   empty?: boolean,
 *   onViewDetails?: () => void,
 *   onExportCsv?: () => void,
 *   onHide?: () => void,
 *   toggleChecked?: boolean,
 *   onToggle?: (checked: boolean) => void,
 *   toggleLabel?: string,
 *   [key: string]: any
 * }} props
 */
export function StatCard({
  label,
  value,
  icon: IconComp,
  trend,
  invertTrend = false,
  comparison = "vs last month",
  caption,
  attention = false,
  featured = false,
  loading = false,
  error = null,
  empty = false,
  onViewDetails,
  onExportCsv,
  onHide,
  toggleChecked,
  onToggle,
  toggleLabel = "Toggle metric mode",
  ...props
}) {
  const variant = featured ? "featured" : "default";

  if (loading) {
    return (
      <Card variant={variant} className="min-w-0 p-4" {...props}>
        <HStack justify="space-between" align="center">
          <Skeleton h="32px" w="32px" borderRadius="10px" />
          <Skeleton h="16px" w="40%" />
        </HStack>
        <Skeleton mt={4} h="36px" w="60%" />
        <Skeleton mt={3} h="18px" w="80%" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant={variant} className="min-w-0 p-4" {...props}>
        <Text fontSize="xs" color="danger" fontWeight="600">
          Failed to load {label}
        </Text>
        <Text mt={2} fontSize="xs" color="textMuted">
          {error}
        </Text>
      </Card>
    );
  }

  const hasMenu = Boolean(onViewDetails || onExportCsv || onHide);
  const showMenu = hasMenu && !onToggle;
  const hasMeta = !empty && (trend !== undefined || Boolean(caption));
  const trendIsPositive = invertTrend ? trend < 0 : trend >= 0;

  return (
    <Card
      variant={variant}
      className="min-w-0 p-4"
      aria-label={`${label}: ${value}`}
      {...props}
    >
      <HStack justify="space-between" align="center">
        <HStack spacing={2.5} minW="0">
          {IconComp && (
            <Box
              display="grid"
              placeItems="center"
              w="32px"
              h="32px"
              flexShrink={0}
              borderRadius="10px"
              bg={featured ? "whiteAlpha.200" : "accentSoft"}
              color={featured ? "textOnAccent" : "accent"}
            >
              <Icon as={IconComp} boxSize={4} />
            </Box>
          )}
          <Text
            fontSize="xs"
            color={featured ? "textOnAccent" : "textSecondary"}
            noOfLines={1}
            fontWeight="500"
          >
            {label}
          </Text>
        </HStack>

        {featured && onToggle && (
          <Toggle
            checked={Boolean(toggleChecked)}
            onChange={onToggle}
            label={toggleLabel}
            onAccent
          />
        )}

        {showMenu && (
          <Menu placement="bottom-end">
            <MenuButton
              as={IconButton}
              aria-label={`Options for ${label}`}
              icon={<MoreHorizontal size={16} />}
              variant="ghost"
              size="xs"
              minW="28px"
              h="28px"
              color={featured ? "textOnAccent" : "textMuted"}
              opacity={featured ? 0.9 : 1}
              _hover={{
                color: featured ? "textOnAccent" : "textPrimary",
                bg: featured ? "whiteAlpha.200" : "surfaceRaised",
              }}
            />
            <MenuList
              minW="140px"
              p={1}
              bg="surface"
              borderColor="borderSubtle"
              borderRadius="12px"
              boxShadow="0 12px 32px rgba(0, 0, 0, 0.45)"
              zIndex="dropdown"
            >
              {onViewDetails && (
                <MenuItem
                  bg="transparent"
                  fontSize="xs"
                  borderRadius="8px"
                  color="textSecondary"
                  _hover={{ bg: "surfaceRaised", color: "textPrimary" }}
                  onClick={onViewDetails}
                >
                  View details
                </MenuItem>
              )}
              {onExportCsv && (
                <MenuItem
                  bg="transparent"
                  fontSize="xs"
                  borderRadius="8px"
                  color="textSecondary"
                  _hover={{ bg: "surfaceRaised", color: "textPrimary" }}
                  onClick={onExportCsv}
                >
                  Export CSV
                </MenuItem>
              )}
              {onHide && (
                <MenuItem
                  bg="transparent"
                  fontSize="xs"
                  borderRadius="8px"
                  color="textSecondary"
                  _hover={{ bg: "surfaceRaised", color: "danger" }}
                  onClick={onHide}
                >
                  Hide card
                </MenuItem>
              )}
            </MenuList>
          </Menu>
        )}

      </HStack>

      <Text
        mt={4}
        fontSize="3xl"
        lineHeight="1"
        fontWeight="600"
        letterSpacing="-0.04em"
        sx={{ fontVariantNumeric: "tabular-nums" }}
        color={featured ? "textOnAccent" : "textPrimary"}
      >
        {empty ? "—" : value}
      </Text>

      {empty ? (
        <Text mt={3} fontSize="11px" color="textMuted">
          No data in this range
        </Text>
      ) : (
        hasMeta && (
          <HStack mt={3} spacing={2}>
            {trend !== undefined && (
              <Badge variant={trendIsPositive ? "success" : "danger"}>
                <Icon
                  as={trend >= 0 ? ArrowUpRight : ArrowDownRight}
                  boxSize={3}
                />
                {Math.abs(trend)}%
              </Badge>
            )}
            <Text
              fontSize="11px"
              color={featured ? "textOnAccent" : "textMuted"}
              opacity={featured ? 0.82 : 1}
              noOfLines={1}
            >
              {trend !== undefined ? comparison : caption}
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
        )
      )}
    </Card>
  );
}

export default StatCard;
