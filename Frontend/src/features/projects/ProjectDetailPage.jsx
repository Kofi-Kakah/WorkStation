import { useState } from "react";
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
import { Archive, ArrowLeft, Save, Trash2, UserPlus, UserRoundMinus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import { useAuth } from "../../contexts/useAuth.jsx";
import { api } from "../../services/apiClient.js";

const PROJECT_ROLES = ["project_manager", "member"];

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const { activeWorkspace, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState(null);
  const [memberId, setMemberId] = useState("");
  const [memberRole, setMemberRole] = useState("member");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const {
    data: project,
    isPending: projectLoading,
    error: projectError,
  } = useQuery({
    queryKey: ["project", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}`);
      return response.project;
    },
  });
  const {
    data: members = [],
    isPending: membersLoading,
    error: membersError,
  } = useQuery({
    queryKey: ["project", projectId, "members"],
    enabled: Boolean(projectId && project),
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}/members`);
      return response.members || [];
    },
  });
  const {
    data: workspaceMembers = [],
    error: workspaceMembersError,
  } = useQuery({
    queryKey: ["workspace", activeWorkspace?.id, "members"],
    enabled: Boolean(activeWorkspace?.id && project),
    queryFn: async () => {
      const response = await api.get(
        `/workspaces/${activeWorkspace.id}/members`,
      );
      return response.members || [];
    },
  });

  const form =
    formState?.projectId === project?.id
      ? formState
      : {
          projectId: project?.id,
          name: project?.name || "",
          description: project?.description || "",
          visibility: project?.visibility || "workspace",
        };
  const canManage =
    ["owner", "admin"].includes(activeWorkspace?.memberRole) ||
    project?.currentUserProjectRole === "project_manager";
  const canDelete = ["owner", "admin"].includes(activeWorkspace?.memberRole);
  const memberIds = new Set(members.map((member) => member.userId));
  const availableMembers = workspaceMembers.filter(
    (member) => !memberIds.has(member.userId),
  );

  const refreshProject = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
      queryClient.invalidateQueries({
        queryKey: ["project", projectId, "members"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["projects", activeWorkspace?.id],
      }),
    ]);
  };

  const saveChanges = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.patch(`/projects/${projectId}`, {
        name: form.name,
        description: form.description,
        visibility: form.visibility,
      });
      await refreshProject();
      setNotice("Project details saved.");
    } catch (requestError) {
      setError(requestError.message || "Unable to update the project.");
    } finally {
      setBusy(false);
    }
  };

  const addMember = async (event) => {
    event.preventDefault();
    if (!memberId) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.post(`/projects/${projectId}/members`, {
        userId: memberId,
        role: memberRole,
      });
      await refreshProject();
      setMemberId("");
      setNotice("Project member added.");
    } catch (requestError) {
      setError(requestError.message || "Unable to add this project member.");
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (member) => {
    if (
      !window.confirm(
        `Remove ${member.profile?.displayName || "this member"} from the project?`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api.delete(`/projects/${projectId}/members/${member.userId}`);
      await refreshProject();
      setNotice("Project member removed.");
    } catch (requestError) {
      setError(requestError.message || "Unable to remove this project member.");
    } finally {
      setBusy(false);
    }
  };

  const archiveProject = async () => {
    if (!window.confirm("Archive this project? It will disappear from active projects.")) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.patch(`/projects/${projectId}/archive`);
      await queryClient.invalidateQueries({
        queryKey: ["projects", activeWorkspace?.id],
      });
      navigate("/projects");
    } catch (requestError) {
      setError(requestError.message || "Unable to archive the project.");
      setBusy(false);
    }
  };

  const deleteProject = async () => {
    if (
      !window.confirm(
        "Delete this project? It will be retained as a deleted record and hidden from active project views.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.delete(`/projects/${projectId}`);
      await queryClient.invalidateQueries({
        queryKey: ["projects", activeWorkspace?.id],
      });
      navigate("/projects");
    } catch (requestError) {
      setError(requestError.message || "Unable to delete the project.");
      setBusy(false);
    }
  };

  if (projectLoading) {
    return (
      <HStack py={12} justify="center">
        <Spinner color="accent" />
        <Text color="textSecondary">Loading project</Text>
      </HStack>
    );
  }
  if (projectError || !project) {
    return (
      <VStack align="stretch" spacing={4} maxW="700px" mx="auto">
        <Alert status="error" borderRadius="control" bg="surface">
          <AlertIcon />
          {projectError?.message || "Project not found."}
        </Alert>
        <Button
          variant="secondary"
          leftIcon={<ArrowLeft size={15} />}
          alignSelf="flex-start"
          onClick={() => navigate("/projects")}
        >
          Back to projects
        </Button>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" spacing={6} maxW="1100px" mx="auto">
      <Button
        variant="ghost"
        leftIcon={<ArrowLeft size={15} />}
        alignSelf="flex-start"
        onClick={() => navigate("/projects")}
      >
        Projects
      </Button>
      <HStack
        align={{ base: "flex-start", md: "center" }}
        justify="space-between"
        flexWrap="wrap"
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
            {project.key} · {project.visibility}
          </Text>
          <Heading mt={2} fontSize={{ base: "2xl", md: "3xl" }}>
            {project.name}
          </Heading>
          <Text mt={2} color="textSecondary">
            Project overview and team membership.
          </Text>
        </Box>
        {canManage && (
          <HStack>
            <Button
              variant="secondary"
              leftIcon={<Archive size={15} />}
              isDisabled={busy}
              onClick={archiveProject}
            >
              Archive
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                color="danger"
                aria-label="Delete project"
                isDisabled={busy}
                onClick={deleteProject}
              >
                <Trash2 size={16} />
              </Button>
            )}
          </HStack>
        )}
      </HStack>

      {(error || membersError || workspaceMembersError) && (
        <Alert status="error" borderRadius="control" bg="surface">
          <AlertIcon />
          {error || membersError?.message || workspaceMembersError?.message}
        </Alert>
      )}
      {notice && (
        <Alert status="success" borderRadius="control" bg="surface">
          <AlertIcon />
          {notice}
        </Alert>
      )}

      <SimpleGrid columns={{ base: 1, lg: 5 }} spacing={4}>
        <Box gridColumn={{ base: "auto", lg: "span 3" }}>
          <Card className="p-5 sm:p-6">
            <Heading size="sm" mb={5}>
              Project details
            </Heading>
            <form onSubmit={saveChanges}>
              <VStack align="stretch" spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Project name</FormLabel>
                  <Input
                    value={form.name}
                    isDisabled={!canManage}
                    minLength={2}
                    maxLength={100}
                    onChange={(event) =>
                      setFormState({
                        ...form,
                        name: event.target.value,
                      })
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Description</FormLabel>
                  <Textarea
                    value={form.description}
                    isDisabled={!canManage}
                    maxLength={2000}
                    resize="vertical"
                    onChange={(event) =>
                      setFormState({
                        ...form,
                        description: event.target.value,
                      })
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Visibility</FormLabel>
                  <Select
                    value={form.visibility}
                    isDisabled={!canManage}
                    onChange={(event) =>
                      setFormState({
                        ...form,
                        visibility: event.target.value,
                      })
                    }
                  >
                    <option value="workspace">Everyone in workspace</option>
                    <option value="restricted">Project members only</option>
                  </Select>
                </FormControl>
                {canManage && (
                  <Button
                    type="submit"
                    variant="primary"
                    leftIcon={<Save size={15} />}
                    isLoading={busy}
                    alignSelf="flex-start"
                  >
                    Save changes
                  </Button>
                )}
              </VStack>
            </form>
          </Card>
        </Box>

        <Box gridColumn={{ base: "auto", lg: "span 2" }}>
          <Card className="p-5 sm:p-6">
            <HStack justify="space-between" mb={5}>
              <Box>
                <Heading size="sm">Project team</Heading>
                <Text mt={1} color="textMuted" fontSize="xs">
                  {members.length} {members.length === 1 ? "member" : "members"}
                </Text>
              </Box>
            </HStack>
            {canManage && (
              <form onSubmit={addMember} className="mb-5">
                <VStack align="stretch" spacing={3}>
                  <FormControl isRequired>
                    <FormLabel fontSize="xs">Workspace member</FormLabel>
                    <Select
                      size="sm"
                      value={memberId}
                      onChange={(event) => setMemberId(event.target.value)}
                    >
                      <option value="">Choose a member</option>
                      {availableMembers.map((member) => (
                        <option key={member.userId} value={member.userId}>
                          {member.profile?.displayName || member.profile?.email || member.userId}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <HStack>
                    <Select
                      aria-label="Project role"
                      size="sm"
                      value={memberRole}
                      onChange={(event) => setMemberRole(event.target.value)}
                    >
                      {PROJECT_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role.replace("_", " ")}
                        </option>
                      ))}
                    </Select>
                    <Button
                      type="submit"
                      variant="secondary"
                      leftIcon={<UserPlus size={14} />}
                      isLoading={busy}
                      isDisabled={!memberId}
                      flexShrink={0}
                    >
                      Add
                    </Button>
                  </HStack>
                </VStack>
              </form>
            )}

            {membersLoading ? (
              <HStack py={6} justify="center">
                <Spinner size="sm" color="accent" />
                <Text color="textSecondary" fontSize="sm">
                  Loading members
                </Text>
              </HStack>
            ) : (
              <VStack align="stretch" spacing={2}>
                {members.map((member) => (
                  <HStack
                    key={member.userId}
                    justify="space-between"
                    gap={2}
                    p={3}
                    border="1px solid"
                    borderColor="borderSubtle"
                    borderRadius="control"
                  >
                    <Box minW="0">
                      <Text fontSize="sm" fontWeight="600" noOfLines={1}>
                        {member.profile?.displayName || "Project member"}
                        {member.userId === user?.uid ? " (you)" : ""}
                      </Text>
                      <Text color="textMuted" fontSize="xs" noOfLines={1}>
                        {member.role.replace("_", " ")}
                      </Text>
                    </Box>
                    {canManage && (
                      <Button
                        variant="ghost"
                        aria-label={`Remove ${member.profile?.displayName || "member"}`}
                        color="danger"
                        minW="34px"
                        h="34px"
                        isDisabled={busy}
                        onClick={() => removeMember(member)}
                      >
                        <UserRoundMinus size={15} />
                      </Button>
                    )}
                  </HStack>
                ))}
                {!members.length && (
                  <Text color="textMuted" fontSize="sm" py={3}>
                    No project members are available.
                  </Text>
                )}
                {!availableMembers.length && canManage && (
                  <Text color="textMuted" fontSize="xs">
                    All workspace members have been added to this project.
                  </Text>
                )}
              </VStack>
            )}
          </Card>
        </Box>
      </SimpleGrid>
    </VStack>
  );
}
