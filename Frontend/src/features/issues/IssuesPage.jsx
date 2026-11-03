import { useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  CircleDashed,
  Plus,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import { useAuth } from "../../contexts/useAuth.jsx";
import { api } from "../../services/apiClient.js";

const ISSUE_TYPES = [
  { value: "task", label: "Task" },
  { value: "bug", label: "Bug" },
  { value: "story", label: "Story" },
  { value: "epic", label: "Epic" },
  { value: "subtask", label: "Subtask" },
];

const ISSUE_PRIORITIES = [
  { value: "highest", label: "Highest" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "lowest", label: "Lowest" },
];

const ISSUE_STATUS = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "in_review", label: "In review" },
  { value: "done", label: "Done" },
];

function IconForType({ type }) {
  if (type === "bug") return <AlertCircle size={15} />;
  if (type === "story" || type === "epic") return <CheckCircle2 size={15} />;
  if (type === "task") return <CircleDashed size={15} />;
  return <Circle size={15} />;
}

function priorityColor(priority) {
  if (priority === "highest") return "danger";
  if (priority === "high") return "accent";
  if (priority === "medium") return "warning";
  return "textMuted";
}

export default function IssuesPage() {
  const { activeWorkspace } = useAuth();
  const { issueId: routeIssueId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [localSelectedIssueId, setLocalSelectedIssueId] = useState("");
  const selectedIssueId = routeIssueId || localSelectedIssueId;
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    type: "task",
    status: "todo",
    priority: "medium",
  });
  const [editDraftState, setEditDraftState] = useState({
    issueId: "",
    values: null,
  });
  const [commentDraft, setCommentDraft] = useState("");

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", activeWorkspace?.id],
    enabled: Boolean(activeWorkspace?.id),
    queryFn: async () => {
      const response = await api.get(`/projects?workspaceId=${activeWorkspace.id}`);
      return response.projects || [];
    },
  });

  const projectId = selectedProjectId || projects[0]?.id || "";

  const {
    data: issues = [],
    isPending: issuesPending,
    error: issuesError,
  } = useQuery({
    queryKey: ["issues", projectId, statusFilter, searchTerm],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const params = new URLSearchParams({ projectId });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      const response = await api.get(`/issues?${params.toString()}`);
      return response.issues || [];
    },
  });

  const { data: selectedIssue } = useQuery({
    queryKey: ["issue", selectedIssueId],
    enabled: Boolean(selectedIssueId),
    queryFn: async () => {
      const response = await api.get(`/issues/${selectedIssueId}`);
      return response.issue;
    },
  });
  const editDraft =
    selectedIssue && editDraftState.issueId === selectedIssue.id
      ? editDraftState.values
      : {
          title: selectedIssue?.title || "",
          description: selectedIssue?.description || "",
          type: selectedIssue?.type || "task",
          status: selectedIssue?.status || "todo",
          priority: selectedIssue?.priority || "medium",
        };

  const { data: comments = [] } = useQuery({
    queryKey: ["issue-comments", selectedIssueId],
    enabled: Boolean(selectedIssueId),
    queryFn: async () => {
      const response = await api.get(`/issues/${selectedIssueId}/comments`);
      return response.comments || [];
    },
  });

  const createIssueMutation = useMutation({
    mutationFn: async (payload) => api.post("/issues", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["issues"] });
      setFormState({
        title: "",
        description: "",
        type: "task",
        status: "todo",
        priority: "medium",
      });
    },
  });

  const updateIssueMutation = useMutation({
    mutationFn: async ({ issueId, payload }) =>
      api.patch(`/issues/${issueId}`, payload),
    onSuccess: async () => {
      setEditDraftState({ issueId: "", values: null });
      await queryClient.invalidateQueries({ queryKey: ["issues"] });
      if (selectedIssueId) {
        await queryClient.invalidateQueries({ queryKey: ["issue", selectedIssueId] });
        await queryClient.invalidateQueries({
          queryKey: ["issue-comments", selectedIssueId],
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["board"] });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({ issueId, content }) =>
      api.post(`/issues/${issueId}/comments`, { content }),
    onSuccess: async () => {
      if (selectedIssueId) {
        await queryClient.invalidateQueries({
          queryKey: ["issue-comments", selectedIssueId],
        });
      }
      setCommentDraft("");
    },
  });

  const issueStats = useMemo(
    () => ({
      total: issues.length,
      todo: issues.filter((issue) => issue.status === "todo").length,
      inProgress: issues.filter((issue) => issue.status === "in_progress").length,
      done: issues.filter((issue) => issue.status === "done").length,
    }),
    [issues],
  );

  const createIssue = (event) => {
    event.preventDefault();
    if (!projectId || !formState.title.trim()) return;
    createIssueMutation.mutate({
      projectId,
      title: formState.title.trim(),
      description: formState.description.trim(),
      type: formState.type,
      status: formState.status,
      priority: formState.priority,
    });
  };

  const updateSelectedIssue = (event) => {
    event.preventDefault();
    if (!selectedIssueId || !selectedIssue) return;

    const payload = {};
    if (editDraft.title.trim() && editDraft.title !== selectedIssue.title) {
      payload.title = editDraft.title.trim();
    }
    if (editDraft.description !== selectedIssue.description) {
      payload.description = editDraft.description.trim();
    }
    if (editDraft.type && editDraft.type !== selectedIssue.type) {
      payload.type = editDraft.type;
    }
    if (editDraft.status && editDraft.status !== selectedIssue.status) {
      payload.status = editDraft.status;
    }
    if (editDraft.priority && editDraft.priority !== selectedIssue.priority) {
      payload.priority = editDraft.priority;
    }

    if (!Object.keys(payload).length) return;
    updateIssueMutation.mutate({ issueId: selectedIssueId, payload });
  };

  const updateEditDraftField = (field, value) => {
    if (!selectedIssue) return;
    setEditDraftState((current) => {
      const currentValues =
        current.issueId === selectedIssue.id && current.values
          ? current.values
          : {
              title: selectedIssue.title || "",
              description: selectedIssue.description || "",
              type: selectedIssue.type || "task",
              status: selectedIssue.status || "todo",
              priority: selectedIssue.priority || "medium",
            };
      return {
        issueId: selectedIssue.id,
        values: { ...currentValues, [field]: value },
      };
    });
  };

  const selectIssue = (issueId) => {
    if (routeIssueId) {
      navigate(`/issues/${issueId}`, { replace: true });
      return;
    }
    setLocalSelectedIssueId(issueId);
  };

  const submitComment = (event) => {
    event.preventDefault();
    if (!selectedIssueId || !commentDraft.trim()) return;

    createCommentMutation.mutate({
      issueId: selectedIssueId,
      content: commentDraft.trim(),
    });
  };

  if (!activeWorkspace) {
    return (
      <Box p={6}>
        <Alert status="info" borderRadius="16px">
          <AlertIcon />
          Select a workspace to view issues.
        </Alert>
      </Box>
    );
  }

  return (
    <VStack align="stretch" spacing={6} p={{ base: 3, md: 6 }}>
      <HStack justify="space-between" align="center" gap={3} flexWrap="wrap">
        <Box>
          <Text
            color="textMuted"
            fontSize="xs"
            fontWeight="700"
            letterSpacing="0.12em"
            textTransform="uppercase"
          >
            Issue tracker
          </Text>
          <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="700" mt={2}>
            Issues & work items
          </Text>
        </Box>
        <HStack>
          <Select
            value={projectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
            maxW="220px"
            size="sm"
          >
            {!projects.length && <option value="">No projects</option>}
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </HStack>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
        <Card className="p-4">
          <Text color="textMuted" fontSize="xs" textTransform="uppercase">Total</Text>
          <Text fontSize="3xl" fontWeight="700" mt={2}>{issueStats.total}</Text>
        </Card>
        <Card className="p-4">
          <Text color="textMuted" fontSize="xs" textTransform="uppercase">To do</Text>
          <Text fontSize="3xl" fontWeight="700" mt={2}>{issueStats.todo}</Text>
        </Card>
        <Card className="p-4">
          <Text color="textMuted" fontSize="xs" textTransform="uppercase">In progress</Text>
          <Text fontSize="3xl" fontWeight="700" mt={2}>{issueStats.inProgress}</Text>
        </Card>
        <Card className="p-4">
          <Text color="textMuted" fontSize="xs" textTransform="uppercase">Done</Text>
          <Text fontSize="3xl" fontWeight="700" mt={2}>{issueStats.done}</Text>
        </Card>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={4}>
        <Box gridColumn={{ base: "auto", lg: "span 2" }}>
          <Card className="p-4 sm:p-5">
            <HStack justify="space-between" gap={3} flexWrap="wrap">
              <Text fontWeight="700">Issue list</Text>
              <HStack>
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search issues"
                  size="sm"
                  maxW="220px"
                />
                <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} size="sm" maxW="180px">
                  <option value="all">All states</option>
                  {ISSUE_STATUS.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </Select>
              </HStack>
            </HStack>

            {issuesPending && (
              <HStack py={10} justify="center">
                <Spinner color="accent" />
                <Text color="textSecondary">Loading issues</Text>
              </HStack>
            )}

            {issuesError && (
              <Alert status="error" borderRadius="16px" mt={4}>
                <AlertIcon />
                {issuesError.message || "Unable to load issues."}
              </Alert>
            )}

            {!issuesPending && !issuesError && !issues.length && (
              <Box py={8} textAlign="center">
                <Text color="textSecondary">No issues match the current filter.</Text>
              </Box>
            )}

            <VStack align="stretch" spacing={3} mt={4}>
              {issues.map((issue) => (
                <Box
                  key={issue.id}
                  as="button"
                  type="button"
                  onClick={() => selectIssue(issue.id)}
                  textAlign="left"
                  border="1px solid"
                  borderColor={selectedIssueId === issue.id ? "accentBorder" : "borderSubtle"}
                  borderRadius="16px"
                  bg={selectedIssueId === issue.id ? "accentSoft" : "surface"}
                  p={3}
                  transition="150ms ease"
                  _hover={{ bg: "surfaceRaised" }}
                >
                  <HStack justify="space-between" align="start" gap={3}>
                    <HStack spacing={3} align="start" minW={0} flex={1}>
                      <Box
                        display="grid"
                        placeItems="center"
                        w={8}
                        h={8}
                        borderRadius="10px"
                        bg="accentSoft"
                        color="accent"
                      >
                        <IconForType type={issue.type} />
                      </Box>
                      <Box minW={0} flex={1}>
                        <Text fontWeight="700" noOfLines={2}>{issue.title}</Text>
                        <Text mt={1} color="textMuted" fontSize="xs">
                          {issue.issueKey || issue.id} · {issue.type}
                        </Text>
                      </Box>
                    </HStack>
                    <Badge borderRadius="full" bg="surfaceRaised" color={priorityColor(issue.priority)} textTransform="capitalize">
                      {issue.priority}
                    </Badge>
                  </HStack>
                  <HStack mt={3} spacing={2} flexWrap="wrap">
                    <Badge borderRadius="full" bg="surfaceRaised" color="textSecondary">
                      {ISSUE_STATUS.find((item) => item.value === issue.status)?.label || issue.status}
                    </Badge>
                    {issue.labels?.map((label) => (
                      <Badge key={label} borderRadius="full" bg="accentSoft" color="accentHot">
                        {label}
                      </Badge>
                    ))}
                  </HStack>
                </Box>
              ))}
            </VStack>
          </Card>
        </Box>

        <Box>
          <Card className="p-4 sm:p-5">
            <Text fontWeight="700" mb={3}>Create issue</Text>
            <form onSubmit={createIssue}>
              <VStack align="stretch" spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm">Title</FormLabel>
                  <Input
                    value={formState.title}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, title: event.target.value }))
                    }
                    placeholder="Add a clear work item title"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Type</FormLabel>
                  <Select
                    value={formState.type}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, type: event.target.value }))
                    }
                  >
                    {ISSUE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Priority</FormLabel>
                  <Select
                    value={formState.priority}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, priority: event.target.value }))
                    }
                  >
                    {ISSUE_PRIORITIES.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Status</FormLabel>
                  <Select
                    value={formState.status}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, status: event.target.value }))
                    }
                  >
                    {ISSUE_STATUS.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Description</FormLabel>
                  <Textarea
                    value={formState.description}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="Describe the work, acceptance criteria, and context."
                    minH="120px"
                    resize="vertical"
                  />
                </FormControl>
                <Button
                  type="submit"
                  variant="primary"
                  leftIcon={<Plus size={15} />}
                  isLoading={createIssueMutation.isPending}
                  isDisabled={!formState.title.trim() || !projectId}
                >
                  Create issue
                </Button>
              </VStack>
            </form>
          </Card>

          {selectedIssue && (
            <Card className="p-4 sm:p-5 mt-4">
              <HStack justify="space-between" align="start" gap={3}>
                <Box>
                  <Text color="textMuted" fontSize="xs" textTransform="uppercase">
                    {selectedIssue.type}
                  </Text>
                  <Text fontSize="lg" fontWeight="700" mt={1}>{selectedIssue.title}</Text>
                </Box>
                <Badge borderRadius="full" bg="surfaceRaised" color={priorityColor(selectedIssue.priority)} textTransform="capitalize">
                  {selectedIssue.priority}
                </Badge>
              </HStack>

              <Text color="textSecondary" mt={3}>{selectedIssue.description || "No description added yet."}</Text>
              {selectedIssue.sourceChannelId && selectedIssue.sourceMessageId && (
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-4"
                  onClick={() =>
                    navigate(
                      selectedIssue.sourceConversationType === "channel"
                        ? "/channels"
                        : "/dm",
                      {
                        state: {
                          sourceConversation: {
                            channelId: selectedIssue.sourceChannelId,
                            messageId: selectedIssue.sourceMessageId,
                          },
                        },
                      },
                    )
                  }
                >
                  Open source conversation
                </Button>
              )}

              <Box mt={5} as="form" onSubmit={updateSelectedIssue}>
                <Text fontWeight="700" mb={3}>Update issue</Text>
                <VStack align="stretch" spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="sm">Title</FormLabel>
                    <Input
                      value={editDraft.title}
                      onChange={(event) =>
                        updateEditDraftField("title", event.target.value)
                      }
                    />
                  </FormControl>

                  <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3}>
                    <FormControl>
                      <FormLabel fontSize="sm">Type</FormLabel>
                      <Select
                        value={editDraft.type}
                        onChange={(event) =>
                          updateEditDraftField("type", event.target.value)
                        }
                      >
                        {ISSUE_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Status</FormLabel>
                      <Select
                        value={editDraft.status}
                        onChange={(event) =>
                          updateEditDraftField("status", event.target.value)
                        }
                      >
                        {ISSUE_STATUS.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Priority</FormLabel>
                      <Select
                        value={editDraft.priority}
                        onChange={(event) =>
                          updateEditDraftField("priority", event.target.value)
                        }
                      >
                        {ISSUE_PRIORITIES.map((priority) => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </SimpleGrid>

                  <FormControl>
                    <FormLabel fontSize="sm">Description</FormLabel>
                    <Textarea
                      value={editDraft.description}
                      onChange={(event) =>
                        updateEditDraftField("description", event.target.value)
                      }
                      minH="120px"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={updateIssueMutation.isPending}
                    loadingText="Saving"
                    alignSelf="flex-end"
                  >
                    Save changes
                  </Button>
                </VStack>
              </Box>

              <Box mt={5} as="form" onSubmit={submitComment}>
                <Text fontWeight="700" mb={2}>Add comment</Text>
                <VStack align="stretch" spacing={2}>
                  <Textarea
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder="Add a progress update or context..."
                    minH="96px"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={createCommentMutation.isPending}
                    loadingText="Posting"
                    alignSelf="flex-end"
                  >
                    Post comment
                  </Button>
                </VStack>
              </Box>

              {comments.length > 0 && (
                <Box mt={5}>
                  <Text fontWeight="700" mb={2}>Comments</Text>
                  <VStack align="stretch" spacing={2}>
                    {comments.map((comment) => (
                      <Box key={comment.id} border="1px solid" borderColor="borderSubtle" borderRadius="12px" p={3} bg="surfaceRaised">
                        <Text fontSize="xs" color="textMuted">{comment.authorId}</Text>
                        <Text mt={1} color="textSecondary">{comment.content}</Text>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              )}
            </Card>
          )}
        </Box>
      </SimpleGrid>
    </VStack>
  );
}
