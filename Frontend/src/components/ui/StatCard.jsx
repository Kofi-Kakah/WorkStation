import { Box, Text, Icon, HStack } from "@chakra-ui/react";
import GlassCard from "./GlassCard.jsx";

/**
 * Stat card for dashboards.
 *
 * @param {{ label: string, value: number|string, icon: import('lucide-react').LucideIcon, color?: string, trend?: number, [key: string]: any }} props
 */
export function StatCard({
  label,
  value,
  icon: IconComp,
  color = "amethyst",
  trend,
  ...props
}) {
  return (
    <GlassCard hover className="p-4" {...props}>
      <HStack justify="space-between" align="start">
        <Box>
          <Text fontSize="sm" color="gray.500" _dark={{ color: "gray.400" }}>
            {label}
          </Text>
          <Text fontSize="2xl" fontWeight="800" mt={1}>
            {value}
          </Text>
          {trend !== undefined && (
            <Text
              fontSize="xs"
              color={trend >= 0 ? "green.500" : "red.500"}
              mt={1}
            >
              {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </Text>
          )}
        </Box>
        <Box
          p={2}
          borderRadius="10px"
          bg={`${color}.100`}
          _dark={{ bg: `${color}.900` }}
          color={`${color}.600`}
        >
          <Icon as={IconComp} boxSize={5} />
        </Box>
      </HStack>
    </GlassCard>
  );
}

export default StatCard;
