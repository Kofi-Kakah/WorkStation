import { useEffect, useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderKanban, Plus, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import { useAuth } from "../../contexts/useAuth.jsx";
import { api } from "../../services/apiClient.js";

function canCreateProject(role) {
  if (!role) return true; // let backend enforce if role unknown
  return ["owner", "admin", "project_manager"].includes(role);
}

export default function ProjectsPage() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("workspace");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const canCreate = canCreateProject(activeWorkspace?.memberRole);

  useEffect(() => {
    if (location.state?.create && canCreate) {
      setDialogOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, canCreate, navigate, location.pathname]);

  const {
    data: projects = [],
    isPending,
    error: queryError,
  } = useQuery({
    queryKey: ["projects", activeWorkspace?.id],
    enabled: Boolean(activeWorkspace?.id),
    queryFn: async () => {
      const response = await api.get(
        `/projects?workspaceId=${encodeURIComponent(activeWorkspace.id)}`,
      );
      return response.projects || [];
    },
  });

  const createProject = async (event) => {
    event?.preventDefault?.();
    if (saving) return;
    if (!activeWorkspace?.id) {
      setError("Select a workspace before creating a project.");
      return;
    }
    if (name.trim().length < 2) {
      setError("Project name must be at least 2 characters.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await api.post("/projects", {
        workspaceId: activeWorkspace.id,
        name: name.trim(),
        description: description.trim(),
        visibility,
      });
      await queryClient.invalidateQueries({
        queryKey: ["projects", activeWorkspace.id],
      });
      setName("");
      setDescription("");
      setVisibility("workspace");
      setDialogOpen(false);
      setNotice("Project created.");
      navigate(`/projects/${response.project.id}`);
    } catch (requestError) {
      setError(requestError?.message || "Unable to create the project.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <VStack align="stretch" spacing={6} maxW="1200px" mx="auto">
      <HStack
        align={{ base: "flex-start", sm: "center" }}
        justify="space-between"
        flexDirection={{ base: "column", sm: "row" }}
        gap={4}
      >
        <Box>
          <Text
            color="textMuted"
            fontSize="xs"
            fontWeight="700"
            letterSpacing="0.12em"
            textTransform="uppercase"
          >
            {activeWorkspace?.name || "Workspace"}
          </Text>
          <Heading mt={2} fontSize={{ base: "2xl", md: "3xl" }}>
            Projects
          </Heading>
          <Text mt={2} color="textSecondary">
            Organize work and bring the right teammates together.
          </Text>
        </Box>
        {canCreate && (
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            minH="42px"
            px={5}
            onClick={() => setDialogOpen(true)}
          >
            Create project
          </Button>
        )}
      </HStack>

      {(error || queryError) && (
        <Alert status="error" borderRadius="control" bg="surface">
          <AlertIcon />
          {error || queryError?.message}
        </Alert>
      )}
      {notice && (
        <Alert status="success" borderRadius="control" bg="surface">
          <AlertIcon />
          {notice}
        </Alert>
      )}

      {!activeWorkspace ? (
        <Card className="p-6">
          <Text color="textSecondary">
            Select or create a workspace before managing projects.
          </Text>
        </Card>
      ) : isPending ? (
        <HStack py={12} justify="center">
          <Spinner color="accent" />
          <Text color="textSecondary">Loading projects</Text>
        </HStack>
      ) : projects.length ? (
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
          {projects.map((project) => (
            <Card
              key={project.id}
              as="article"
              role="link"
              tabIndex={0}
              aria-label={`Open ${project.name} project`}
              textAlign="left"
              className="p-5 transition-colors hover:border-accent/40"
              onClick={() => navigate(`/projects/${project.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  navigate(`/projects/${project.id}`);
                }
              }}
            >
              <HStack justify="space-between" align="start">
                <Box
                  display="grid"
                  placeItems="center"
                  w="38px"
                  h="38px"
                  borderRadius="control"
                  bg="accentSoft"
                  color="accent"
                >
                  <FolderKanban size={18} />
                </Box>
                <Text
                  px={2}
                  py={1}
                  borderRadius="full"
                  bg="surfaceRaised"
                  color="textMuted"
                  fontSize="10px"
                  fontWeight="700"
                  letterSpacing="0.05em"
                >
                  {project.key}
                </Text>
              </HStack>
              <Heading mt={4} size="sm" noOfLines={1}>
                {project.name}
              </Heading>
              <Text mt={2} minH="40px" color="textSecondary" fontSize="sm" noOfLines={2}>
                {project.description || "No description yet."}
              </Text>
              <HStack mt={4} justify="space-between">
                <HStack spacing={1.5} color="textMuted">
                  <Users size={14} />
                  <Text fontSize="xs">
                    {project.currentUserProjectRole?.replace("_", " ") ||
                      "Workspace member"}
                  </Text>
                </HStack>
                <Text
                  color="textMuted"
                  fontSize="10px"
                  textTransform="capitalize"
                >
                  {project.visibility}
                </Text>
              </HStack>
            </Card>
          ))}
        </SimpleGrid>
      ) : (
        <Card className="p-8 text-center">
          <Box
            mx="auto"
            display="grid"
            placeItems="center"
            w="44px"
            h="44px"
            borderRadius="control"
            bg="accentSoft"
            color="accent"
          >
            <FolderKanban size={20} />
          </Box>
          <Heading mt={4} size="sm">
            No projects yet
          </Heading>
          <Text mt={2} color="textSecondary" fontSize="sm">
            Start a project to give your team a shared place to plan work.
          </Text>
          {canCreate && (
            <Button
              variant="primary"
              leftIcon={<Plus size={15} />}
              mt={5}
              onClick={() => setDialogOpen(true)}
            >
              Create project
            </Button>
          )}
        </Card>
      )}

      {dialogOpen && (
        <Box
          position="fixed"
          inset={0}
          zIndex="modal"
          display="grid"
          placeItems="center"
          px={4}
          bg="blackAlpha.700"
          backdropFilter="blur(8px)"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDialogOpen(false);
          }}
        >
          <Card
            as="section"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-project-title"
            className="w-full max-w-lg p-5 sm:p-6"
          >
            <Heading id="create-project-title" size="md">
              Create a project
            </Heading>
            <Text mt={2} mb={5} color="textSecondary" fontSize="sm">
              Projects are scoped to {activeWorkspace?.name}.
            </Text>
            <form onSubmit={createProject}>
              <VStack align="stretch" spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Project name</FormLabel>
                  <Input
                    autoFocus
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    minLength={2}
                    maxLength={100}
                    placeholder="e.g. Mobile app"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Description</FormLabel>
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    maxLength={2000}
                    resize="vertical"
                    placeholder="What are you building?"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Visibility</FormLabel>
                  <Select
                    value={visibility}
                    onChange={(event) => setVisibility(event.target.value)}
                  >
                    <option value="workspace">Everyone in workspace</option>
                    <option value="restricted">Project members only</option>
                  </Select>
                </FormControl>
                {error && (
                  <Text role="alert" color="danger" fontSize="sm">
                    {error}
                  </Text>
                )}
                <HStack justify="flex-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={saving}
                    loadingText="Creating..."
                    onClick={createProject}
                    isDisabled={saving || name.trim().length < 2}
                  >
                    Create project
                  </Button>
                </HStack>
              </VStack>
            </form>
          </Card>
        </Box>
      )}
    </VStack>
  );
}
