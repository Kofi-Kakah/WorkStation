import { useMemo } from "react";
import {
  Button as ChakraButton,
  Icon,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react";
import { Check, ChevronDown, FolderKanban } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/useAuth.jsx";
import { useDateRange } from "../../hooks/useDateRange.js";
import { api } from "../../services/apiClient.js";

/**
 * Pill dropdown beside page title matching the "All regions" dropdown in Emberline.
 *
 * @param {{ className?: string }} props
 */
export function ProjectFilterDropdown({ className = "" }) {
  const { activeWorkspace } = useAuth();
  const { selectedProjectId, setSelectedProjectId } = useDateRange();

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", activeWorkspace?.id],
    enabled: Boolean(activeWorkspace?.id),
    queryFn: async () => {
      const response = await api.get(`/projects?workspaceId=${activeWorkspace.id}`);
      return response.projects || [];
    },
  });

  const selectedProject = useMemo(() => {
    if (!selectedProjectId || selectedProjectId === "all") return null;
    return projects.find((p) => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const displayLabel = selectedProject ? selectedProject.name : "All projects";

  return (
    <Menu placement="bottom-start">
      <MenuButton
        as={ChakraButton}
        variant="unstyled"
        className={`ui-button ui-button--secondary h-[30px] px-3 text-xs font-medium rounded-full ${className}`.trim()}
        rightIcon={<Icon as={ChevronDown} boxSize={3.5} className="text-muted" />}
        _focusVisible={{
          outline: "2px solid",
          outlineColor: "accent",
          outlineOffset: "2px",
        }}
        aria-label={`Filter by project: ${displayLabel}`}
      >
        {displayLabel}
      </MenuButton>

      <MenuList
        minW="200px"
        p={1}
        bg="surface"
        borderColor="borderSubtle"
        borderWidth="1px"
        borderRadius="12px"
        boxShadow="0 16px 36px rgba(0, 0, 0, 0.55)"
        zIndex="dropdown"
      >
        <MenuItem
          bg={selectedProjectId === "all" ? "surfaceRaised" : "transparent"}
          color={selectedProjectId === "all" ? "textPrimary" : "textSecondary"}
          fontSize="xs"
          fontWeight={selectedProjectId === "all" ? "600" : "400"}
          borderRadius="8px"
          onClick={() => setSelectedProjectId("all")}
          _hover={{ bg: "surfaceRaised", color: "textPrimary" }}
        >
          <Text flex="1">All projects</Text>
          {selectedProjectId === "all" && (
            <Icon as={Check} boxSize={3.5} color="accent" />
          )}
        </MenuItem>

        {projects.map((project) => {
          const isSelected = selectedProjectId === project.id;
          return (
            <MenuItem
              key={project.id}
              icon={<Icon as={FolderKanban} boxSize={3.5} className="text-muted" />}
              bg={isSelected ? "surfaceRaised" : "transparent"}
              color={isSelected ? "textPrimary" : "textSecondary"}
              fontSize="xs"
              fontWeight={isSelected ? "600" : "400"}
              borderRadius="8px"
              onClick={() => setSelectedProjectId(project.id)}
              _hover={{ bg: "surfaceRaised", color: "textPrimary" }}
            >
              <Text flex="1" noOfLines={1}>
                {project.name}
              </Text>
              {isSelected && <Icon as={Check} boxSize={3.5} color="accent" />}
            </MenuItem>
          );
        })}
      </MenuList>
    </Menu>
  );
}

export default ProjectFilterDropdown;

