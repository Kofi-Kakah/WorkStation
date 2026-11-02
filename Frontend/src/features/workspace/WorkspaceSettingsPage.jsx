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
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Copy,
  Plus,
  Save,
  UserMinus,
  Users,
  UserPlus,
} from "lucide-react";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import { api } from "../../services/apiClient.js";
import { useAuth } from "../../contexts/useAuth.jsx";

const ROLES = ["admin", "project_manager", "member", "guest"];

function canManageMember(actorRole, targetRole) {
  if (actorRole === "owner") return targetRole !== "owner";
  return actorRole === "admin" && !["owner", "admin"].includes(targetRole);
}

export default function WorkspaceSettingsPage() {
  const {
    user,
    activeWorkspace,
    workspaces,
    workspaceError,
    workspaceLoading,
    refreshWorkspaces,
    createWorkspace,
  } = useAuth();
  const queryClient = useQueryClient();
  const [formState, setFormState] = useState(null);
  const form =
    formState?.workspaceId === activeWorkspace?.id
      ? formState
      : {
          workspaceId: activeWorkspace?.id,
          name: activeWorkspace?.name || "",
          description: activeWorkspace?.description || "",
        };
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteLink, setInviteLink] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const canEdit = ["owner", "admin"].includes(activeWorkspace?.memberRole);
  const assignableRoles =
    activeWorkspace?.memberRole === "owner"
      ? ROLES
      : ROLES.filter((role) => role !== "admin");

  const {
    data: members = [],
    isPending: membersLoading,
    error: membersError,
  } = useQuery({
    queryKey: ["workspace", activeWorkspace?.id, "members"],
    enabled: Boolean(activeWorkspace?.id),
    queryFn: async () => {
      const response = await api.get(
        `/workspaces/${activeWorkspace.id}/members`,
      );
      return response.members || [];
    },
  });
  const {
    data: invitations = [],
    error: invitationsError,
    refetch: refetchInvitations,
  } = useQuery({
    queryKey: ["workspace", activeWorkspace?.id, "invitations"],
    enabled: Boolean(activeWorkspace?.id && canEdit),
    queryFn: async () => {
      const response = await api.get(
        `/workspaces/${activeWorkspace.id}/invitations`,
      );
      return response.invitations || [];
    },
  });

  const handleCreate = async (event) => {
    event.preventDefault();
    setCreating(true);
    setPageError("");
    setNotice("");
    try {
      await createWorkspace(createForm);
      setNotice("Workspace created.");
      setCreateForm({ name: "", description: "" });
      setCreateOpen(false);
    } catch (error) {
      setPageError(error.message || "Unable to create the workspace.");
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!activeWorkspace) return;
    setSaving(true);
    setPageError("");
    setNotice("");
    try {
      await api.patch(`/workspaces/${activeWorkspace.id}`, {
        name: form.name,
        description: form.description,
      });
      await refreshWorkspaces(activeWorkspace.id);
      setNotice("Workspace settings saved.");
    } catch (error) {
      setPageError(error.message || "Unable to save workspace settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    setPageError("");
    try {
      await api.patch(
        `/workspaces/${activeWorkspace.id}/members/${userId}`,
        { role },
      );
      await queryClient.invalidateQueries({
        queryKey: ["workspace", activeWorkspace.id, "members"],
      });
      setNotice("Member role updated.");
    } catch (error) {
      setPageError(error.message || "Unable to update the member role.");
    }
  };

  const handleInvite = async (event) => {
    event.preventDefault();
    setInviteBusy(true);
    setPageError("");
    setNotice("");
    setInviteLink("");
    try {
      const response = await api.post(
        `/workspaces/${activeWorkspace.id}/invitations`,
        { email: inviteEmail, role: inviteRole },
      );
      setInviteLink(
        `${window.location.origin}/invitations/${response.invitation.token}`,
      );
      setInviteEmail("");
      await refetchInvitations();
      setNotice("Invitation created. Share the link with your teammate.");
    } catch (requestError) {
      setPageError(requestError.message || "Unable to create the invitation.");
    } finally {
      setInviteBusy(false);
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setNotice("Invitation link copied.");
    } catch (copyError) {
      setPageError(copyError.message || "Unable to copy the invitation link.");
    }
  };

  const handleRemove = async (member) => {
    const isSelf = member.userId === user?.uid;
    const label = isSelf ? "leave this workspace" : "remove this member";
    if (!window.confirm(`Are you sure you want to ${label}?`)) return;
    setPageError("");
    try {
      await api.delete(
        `/workspaces/${activeWorkspace.id}/members/${member.userId}`,
      );
      if (isSelf) {
        await refreshWorkspaces();
      } else {
        await queryClient.invalidateQueries({
          queryKey: ["workspace", activeWorkspace.id, "members"],
        });
      }
      setNotice(isSelf ? "You left the workspace." : "Member removed.");
    } catch (error) {
      setPageError(error.message || "Unable to remove the workspace member.");
    }
  };

  return (
    <VStack align="stretch" spacing={6} maxW="1000px" mx="auto">
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
            Workspace
          </Text>
          <Heading mt={2} fontSize={{ base: "2xl", md: "3xl" }}>
            Workspace settings
          </Heading>
          <Text mt={2} color="textSecondary">
            Manage your workspace details and the people who belong to it.
          </Text>
        </Box>
        {activeWorkspace && (
          <Button
            variant="secondary"
            leftIcon={<Plus size={15} />}
            onClick={() => {
              setCreateForm({ name: "", description: "" });
              setCreateOpen((open) => !open);
            }}
            minH="40px"
            px={4}
          >
            Create workspace
          </Button>
        )}
      </HStack>

      {(workspaceError || pageError || membersError || invitationsError) && (
        <Alert status="error" borderRadius="control" bg="surface">
          <AlertIcon />
          {pageError ||
            workspaceError ||
            membersError?.message ||
            invitationsError?.message}
        </Alert>
      )}
      {notice && (
        <Alert status="success" borderRadius="control" bg="surface">
          <AlertIcon />
          {notice}
        </Alert>
      )}

      {(!activeWorkspace || createOpen) && (
        <Card className="p-5 sm:p-6">
          <HStack mb={5} spacing={3}>
            <Building2 size={18} />
            <Heading size="sm">
              {activeWorkspace
                ? "Create another workspace"
                : "Create your first workspace"}
            </Heading>
          </HStack>
          <Text mb={5} color="textSecondary" fontSize="sm">
            A workspace is the shared home for your team, projects, and
            collaboration.
          </Text>
          <form onSubmit={handleCreate}>
            <VStack align="stretch" spacing={4}>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Workspace name</FormLabel>
                <Input
                  value={createForm.name}
                  onChange={(event) =>
                    setCreateForm((value) => ({
                      ...value,
                      name: event.target.value,
                    }))
                  }
                  minLength={2}
                  maxLength={80}
                  placeholder="e.g. Product team"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Description</FormLabel>
                <Textarea
                  value={createForm.description}
                  onChange={(event) =>
                    setCreateForm((value) => ({
                      ...value,
                      description: event.target.value,
                    }))
                  }
                  maxLength={500}
                  placeholder="What does this workspace bring together?"
                  resize="vertical"
                />
              </FormControl>
              <Button
                type="submit"
                variant="primary"
                leftIcon={<Plus size={16} />}
                isLoading={creating}
                isDisabled={workspaceLoading}
                alignSelf="flex-start"
                px={5}
                minH="42px"
              >
                Create workspace
              </Button>
            </VStack>
          </form>
        </Card>
      )}

      {activeWorkspace && (
        <>
          <Card className="p-5 sm:p-6">
            <HStack mb={5} spacing={3}>
              <Building2 size={18} color="var(--accent)" />
              <Box>
                <Heading size="sm">Workspace details</Heading>
                <Text mt={1} color="textMuted" fontSize="xs">
                  Your role: {activeWorkspace.memberRole}
                </Text>
              </Box>
            </HStack>
            <form onSubmit={handleSave}>
              <VStack align="stretch" spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Workspace name</FormLabel>
                  <Input
                    value={form.name}
                    onChange={(event) =>
                      setFormState({
                        ...form,
                        name: event.target.value,
                      })
                    }
                    minLength={2}
                    maxLength={80}
                    isDisabled={!canEdit}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Description</FormLabel>
                  <Textarea
                    value={form.description}
                    onChange={(event) =>
                      setFormState({
                        ...form,
                        description: event.target.value,
                      })
                    }
                    maxLength={500}
                    resize="vertical"
                    isDisabled={!canEdit}
                  />
                </FormControl>
                {canEdit && (
                  <Button
                    type="submit"
                    variant="primary"
                    leftIcon={<Save size={15} />}
                    isLoading={saving}
                    alignSelf="flex-start"
                    px={5}
                    minH="40px"
                  >
                    Save changes
                  </Button>
                )}
              </VStack>
            </form>
          </Card>

          {canEdit && (
            <Card className="p-5 sm:p-6">
              <HStack mb={5} spacing={3}>
                <UserPlus size={18} color="var(--accent)" />
                <Box>
                  <Heading size="sm">Invite teammates</Heading>
                  <Text mt={1} color="textMuted" fontSize="xs">
                    Create a seven-day invitation link for a verified email.
                  </Text>
                </Box>
              </HStack>
              <form onSubmit={handleInvite}>
                <VStack align="stretch" spacing={4}>
                  <HStack align="flex-end" flexWrap="wrap" spacing={3}>
                    <FormControl isRequired flex={1} minW="220px">
                      <FormLabel fontSize="sm">Email address</FormLabel>
                      <Input
                        type="email"
                        autoComplete="email"
                        value={inviteEmail}
                        onChange={(event) => setInviteEmail(event.target.value)}
                        maxLength={254}
                        placeholder="teammate@example.com"
                      />
                    </FormControl>
                    <FormControl w={{ base: "full", sm: "200px" }}>
                      <FormLabel fontSize="sm">Workspace role</FormLabel>
                      <Select
                        value={inviteRole}
                        onChange={(event) => setInviteRole(event.target.value)}
                      >
                        <option value="project_manager">Project manager</option>
                        <option value="member">Member</option>
                        <option value="guest">Guest</option>
                      </Select>
                    </FormControl>
                    <Button
                      type="submit"
                      variant="primary"
                      leftIcon={<UserPlus size={15} />}
                      isLoading={inviteBusy}
                      minH="40px"
                    >
                      Create invitation
                    </Button>
                  </HStack>
                  {inviteLink && (
                    <HStack align="stretch" flexWrap="wrap" spacing={2}>
                      <Input
                        aria-label="Invitation link"
                        value={inviteLink}
                        isReadOnly
                        flex={1}
                        minW="220px"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        leftIcon={<Copy size={14} />}
                        onClick={copyInviteLink}
                      >
                        Copy link
                      </Button>
                    </HStack>
                  )}
                </VStack>
              </form>

              {invitations.length > 0 && (
                <VStack align="stretch" spacing={2} mt={6}>
                  <Text
                    color="textMuted"
                    fontSize="xs"
                    fontWeight="700"
                    letterSpacing="0.1em"
                    textTransform="uppercase"
                  >
                    Pending invitations
                  </Text>
                  {invitations.map((invitation) => (
                    <HStack
                      key={invitation.id}
                      justify="space-between"
                      p={3}
                      border="1px solid"
                      borderColor="borderSubtle"
                      borderRadius="control"
                    >
                      <Box minW="0">
                        <Text fontSize="sm" fontWeight="600" noOfLines={1}>
                          {invitation.email}
                        </Text>
                        <Text color="textMuted" fontSize="xs" textTransform="capitalize">
                          {invitation.role.replace("_", " ")}
                        </Text>
                      </Box>
                      <Text
                        flexShrink={0}
                        px={2}
                        py={1}
                        bg="accentSoft"
                        color="accent"
                        borderRadius="full"
                        fontSize="10px"
                      >
                        Pending
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              )}
            </Card>
          )}

          <Card className="p-5 sm:p-6">
            <HStack justify="space-between" mb={5}>
              <HStack spacing={3}>
                <Users size={18} color="var(--accent)" />
                <Box>
                  <Heading size="sm">Members</Heading>
                  <Text mt={1} color="textMuted" fontSize="xs">
                    {members.length} {members.length === 1 ? "person" : "people"}
                  </Text>
                </Box>
              </HStack>
              {workspaces.length > 1 && (
                <Text color="textMuted" fontSize="xs">
                  {activeWorkspace.name}
                </Text>
              )}
            </HStack>
            {membersLoading ? (
              <HStack py={6} justify="center">
                <Spinner size="sm" color="accent" />
                <Text color="textSecondary" fontSize="sm">
                  Loading members
                </Text>
              </HStack>
            ) : members.length ? (
              <VStack align="stretch" spacing={2}>
                {members.map((member) => {
                  const canManage = canManageMember(
                    activeWorkspace.memberRole,
                    member.role,
                  );
                  const isSelf = member.userId === user?.uid;
                  const canLeave = isSelf && member.role !== "owner";
                  return (
                    <HStack
                      key={member.userId}
                      justify="space-between"
                      align={{ base: "flex-start", sm: "center" }}
                      flexWrap="wrap"
                      gap={3}
                      p={3}
                      border="1px solid"
                      borderColor="borderSubtle"
                      borderRadius="control"
                    >
                      <Box minW="0" flex={1}>
                        <Text fontSize="sm" fontWeight="600" noOfLines={1}>
                          {member.profile?.displayName || "Workspace member"}
                          {isSelf ? " (you)" : ""}
                        </Text>
                        <Text color="textMuted" fontSize="xs" noOfLines={1}>
                          {member.profile?.email || member.userId}
                        </Text>
                      </Box>
                      <HStack spacing={2}>
                        <Select
                          aria-label={`Role for ${member.profile?.displayName || member.userId}`}
                          value={member.role}
                          size="sm"
                          w="150px"
                          isDisabled={!canEdit || !canManage || isSelf}
                          onChange={(event) =>
                            handleRoleChange(member.userId, event.target.value)
                          }
                        >
                          {[...new Set([...assignableRoles, member.role])].map((role) => (
                            <option key={role} value={role}>
                              {role.replace("_", " ")}
                            </option>
                          ))}
                        </Select>
                        {(canManage || canLeave) && (
                          <Button
                            aria-label={
                              canLeave ? "Leave workspace" : "Remove member"
                            }
                            variant="ghost"
                            color="danger"
                            minW="36px"
                            h="36px"
                            onClick={() => handleRemove(member)}
                          >
                            <UserMinus size={15} />
                          </Button>
                        )}
                      </HStack>
                    </HStack>
                  );
                })}
              </VStack>
            ) : (
              <Text color="textMuted" fontSize="sm" py={4}>
                No workspace members are available.
              </Text>
            )}
          </Card>
        </>
      )}
    </VStack>
  );
}
