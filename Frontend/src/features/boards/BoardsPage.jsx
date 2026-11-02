import { useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Avatar,
  Badge,
  Box,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Text,
  Textarea,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  CircleDashed,
  ClipboardList,
  FolderKanban,
  Kanban,
  ListPlus,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import { useAuth } from "../../contexts/useAuth.jsx";
import { api } from "../../services/apiClient.js";

const EMPTY_BOARD_FORM = { name: "", description: "" };

function isIssueManager(workspaceRole, projectRole) {
  return ["owner", "admin"].includes(workspaceRole) ||
    projectRole === "project_manager";
}

function issueTypeIcon(type) {
  if (type === "bug") return <AlertCircle size={15} />;
  if (type === "story" || type === "epic") return <CheckCircle2 size={15} />;
  if (type === "task") return <CircleDashed size={15} />;
  return <Circle size={15} />;
}

function issuePriorityColor(priority) {
  if (priority === "highest" || priority === "urgent") return "danger";
  if (priority === "high") return "accentHot";
  if (priority === "medium") return "warning";
  if (priority === "low" || priority === "lowest") return "textMuted";
  return "textSecondary";
}

function SortableIssueCard({ boardId, card, projectMembers, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `card:${card.id}`,
    data: { kind: "card", cardId: card.id, listId: card.listId },
  });
  const issue = card.issue;
  const typeIcon = issueTypeIcon(issue?.type);
  const assignee = projectMembers.find(
    (member) => member.userId === issue?.assigneeId,
  );
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      variant="raised"
      className={`board-issue-card ${isDragging ? "board-issue-card--dragging" : ""}`}
      {...attributes}
      {...listeners}
      role="group"
      tabIndex={0}
      aria-label={issue?.title || "Unavailable issue"}
    >
      <HStack align="start" justify="space-between" spacing={2}>
        <HStack minW={0} align="start" spacing={2}>
          <Box
            display="grid"
            placeItems="center"
            w={7}
            h={7}
            flexShrink={0}
            borderRadius="icon"
            bg="accentSoft"
            color={issue?.type === "bug" ? "danger" : "accent"}
          >
            {typeIcon}
          </Box>
          <Box minW={0}>
            <Text fontSize="xs" color="textMuted" noOfLines={1}>
              {issue?.key || issue?.issueKey || "Linked issue"}
            </Text>
            <Text mt={1} fontSize="sm" fontWeight="600" color="textPrimary" noOfLines={3}>
              {issue?.title || issue?.summary || "Issue unavailable"}
            </Text>
          </Box>
        </HStack>
        <Tooltip label="Remove from board">
          <IconButton
            aria-label="Remove issue from board"
            icon={<X size={14} />}
            size="xs"
            variant="ghost"
            color="textMuted"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onRemove(boardId, card.id);
            }}
          />
        </Tooltip>
      </HStack>
      {issue?.description && (
        <Text mt={3} color="textSecondary" fontSize="xs" noOfLines={2}>
          {issue.description}
        </Text>
      )}
      <HStack mt={3} justify="space-between" flexWrap="wrap" spacing={2}>
        {issue?.priority && (
          <Badge
            borderRadius="full"
            bg="surfaceRaised"
            color={issuePriorityColor(issue.priority)}
            fontSize="10px"
            textTransform="capitalize"
          >
            {issue.priority}
          </Badge>
        )}
        {issue?.status && (
          <Text color="textMuted" fontSize="10px" noOfLines={1}>
            {issue.status}
          </Text>
        )}
        {assignee && (
          <Tooltip label={assignee.profile?.displayName || "Assignee"}>
            <Avatar
              size="xs"
              name={assignee.profile?.displayName || assignee.userId}
              src={assignee.profile?.avatarUrl || undefined}
              ml="auto"
            />
          </Tooltip>
        )}
      </HStack>
      {issue?.labels?.length > 0 && (
        <HStack mt={2} spacing={1} flexWrap="wrap">
          {issue.labels.slice(0, 3).map((label) => (
            <Badge
              key={label}
              borderRadius="full"
              bg="accentSoft"
              color="accentHot"
              fontSize="9px"
            >
              {label}
            </Badge>
          ))}
        </HStack>
      )}
    </Card>
  );
}

function BoardColumn({
  boardId,
  list,
  projectMembers,
  canManage,
  onAddCard,
  onEditList,
  onDeleteList,
  onRemoveCard,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `list:${list.id}`,
    data: { kind: "list", listId: list.id },
    disabled: !canManage,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop:${list.id}`,
    data: { kind: "list-drop", listId: list.id },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const cards = list.cards || [];

  return (
    <Card
      ref={setNodeRef}
      style={style}
      variant="default"
      className={`board-column ${isDragging ? "board-column--dragging" : ""}`}
      minW={{ base: "min(300px, 84vw)", md: "304px" }}
      maxW={{ base: "min(300px, 84vw)", md: "304px" }}
      minH="300px"
      p={3}
    >
      <HStack mb={3} justify="space-between" {...attributes}>
        <HStack minW={0} {...(canManage ? listeners : {})}>
          {canManage && (
            <Box color="textMuted" cursor="grab" aria-label="Drag to reorder list">
              <Kanban size={14} />
            </Box>
          )}
          <Text
            color="textSecondary"
            fontSize="11px"
            fontWeight="700"
            letterSpacing="0.08em"
            textTransform="uppercase"
            noOfLines={1}
          >
            {list.name}
          </Text>
          <Badge borderRadius="full" bg="surfaceRaised" color="textMuted">
            {cards.length}
          </Badge>
        </HStack>
        <HStack spacing={0}>
          {canManage && (
            <>
              <Tooltip label="Rename list">
                <IconButton
                  aria-label={`Rename ${list.name}`}
                  icon={<Pencil size={13} />}
                  size="xs"
                  variant="ghost"
                  onClick={() => onEditList(list)}
                />
              </Tooltip>
              <Tooltip label="Delete empty list">
                <IconButton
                  aria-label={`Delete ${list.name}`}
                  icon={<Trash2 size={13} />}
                  size="xs"
                  variant="ghost"
                  isDisabled={cards.length > 0}
                  onClick={() => onDeleteList(list)}
                />
              </Tooltip>
            </>
          )}
          <Tooltip label="Add issue card">
            <IconButton
              aria-label={`Add issue to ${list.name}`}
              icon={<Plus size={15} />}
              size="xs"
              variant="ghost"
              color="accent"
              onClick={() => onAddCard(list)}
            />
          </Tooltip>
        </HStack>
      </HStack>
      <Box
        ref={setDropRef}
        className={`board-column__dropzone ${isOver ? "board-column__dropzone--over" : ""}`}
        minH="245px"
        borderRadius="control"
        p={1}
      >
        <SortableContext
          items={cards.map((card) => `card:${card.id}`)}
          strategy={verticalListSortingStrategy}
        >
          <VStack align="stretch" spacing={2}>
            {cards.map((card) => (
              <SortableIssueCard
                key={card.id}
                boardId={boardId}
                card={card}
                projectMembers={projectMembers}
                onRemove={onRemoveCard}
              />
            ))}
          </VStack>
        </SortableContext>
        {cards.length === 0 && (
          <Text py={8} textAlign="center" color="textMuted" fontSize="xs">
            Drop an issue here or add one by ID.
          </Text>
        )}
      </Box>
    </Card>
  );
}

export default function BoardsPage() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  const [projectSelection, setProjectSelection] = useState({
    workspaceId: "",
    projectId: "",
  });
  const [boardSelection, setBoardSelection] = useState({
    projectId: "",
    boardId: "",
  });
  const [boardDialog, setBoardDialog] = useState(null);
  const [boardForm, setBoardForm] = useState(EMPTY_BOARD_FORM);
  const [listDialog, setListDialog] = useState(null);
  const [listName, setListName] = useState("");
  const [cardDialog, setCardDialog] = useState(null);
  const [issueId, setIssueId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const projectsQuery = useQuery({
    queryKey: ["projects", activeWorkspace?.id],
    enabled: Boolean(activeWorkspace?.id),
    queryFn: async () => {
      const response = await api.get(
        `/projects?workspaceId=${encodeURIComponent(activeWorkspace.id)}`,
      );
      return response.projects || [];
    },
  });
  const projects = projectsQuery.data || [];
  const projectId =
    projectSelection.workspaceId === activeWorkspace?.id &&
    projects.some((project) => project.id === projectSelection.projectId)
      ? projectSelection.projectId
      : projects[0]?.id || "";
  const selectedProject = projects.find((project) => project.id === projectId);

  const boardsQuery = useQuery({
    queryKey: ["boards", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const response = await api.get(
        `/boards?projectId=${encodeURIComponent(projectId)}`,
      );
      return response.boards || [];
    },
  });
  const boards = boardsQuery.data || [];
  const boardId =
    boardSelection.projectId === projectId &&
    boards.some((board) => board.id === boardSelection.boardId)
      ? boardSelection.boardId
      : boards[0]?.id || "";
  const canManage = isIssueManager(
    activeWorkspace?.memberRole,
    selectedProject?.currentUserProjectRole,
  );

  const boardQuery = useQuery({
    queryKey: ["board", boardId],
    enabled: Boolean(boardId),
    queryFn: async () => {
      const response = await api.get(`/boards/${boardId}`);
      return response.board;
    },
  });
  const projectMembersQuery = useQuery({
    queryKey: ["project", projectId, "members"],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}/members`);
      return response.members || [];
    },
  });

  const refreshBoard = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["boards", projectId] }),
      queryClient.invalidateQueries({ queryKey: ["board", boardId] }),
    ]);
  };
  const runMutation = useMutation({
    mutationFn: async ({ method, path, body }) => api[method](path, body),
    onSuccess: async () => {
      setError("");
      setNotice("Board updated.");
      await refreshBoard();
    },
    onError: (requestError) => {
      setError(requestError.message || "The board could not be updated.");
    },
  });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const board = boardQuery.data;
  const lists = useMemo(() => board?.lists || [], [board?.lists]);
  const isPending =
    projectsQuery.isPending || (Boolean(projectId) && boardsQuery.isPending);
  const loadError = projectsQuery.error || boardsQuery.error || boardQuery.error;

  const openBoardDialog = (existingBoard = null) => {
    setBoardForm({
      name: existingBoard?.name || "",
      description: existingBoard?.description || "",
    });
    setBoardDialog(existingBoard);
  };

  const saveBoard = async (event) => {
    event.preventDefault();
    if (!boardForm.name.trim()) return;
    setError("");
    try {
      if (boardDialog?.id) {
        await runMutation.mutateAsync({
          method: "patch",
          path: `/boards/${boardDialog.id}`,
          body: boardForm,
        });
      } else {
        const response = await runMutation.mutateAsync({
          method: "post",
          path: "/boards",
          body: { projectId, ...boardForm },
        });
        setBoardSelection({ projectId, boardId: response.board.id });
      }
      setBoardDialog(null);
    } catch {
      // Mutation error is rendered in the page alert.
    }
  };

  const saveList = async (event) => {
    event.preventDefault();
    if (!listName.trim() || !boardId) return;
    try {
      await runMutation.mutateAsync({
        method: listDialog?.id ? "patch" : "post",
        path: listDialog?.id
          ? `/boards/${boardId}/lists/${listDialog.id}`
          : `/boards/${boardId}/lists`,
        body: { name: listName },
      });
      setListDialog(null);
      setListName("");
    } catch {
      // Mutation error is rendered in the page alert.
    }
  };

  const addIssueCard = async (event) => {
    event.preventDefault();
    if (!issueId.trim() || !cardDialog || !boardId) return;
    try {
      await runMutation.mutateAsync({
        method: "post",
        path: `/boards/${boardId}/cards`,
        body: { issueId: issueId.trim(), listId: cardDialog.id },
      });
      setCardDialog(null);
      setIssueId("");
    } catch {
      // Mutation error is rendered in the page alert.
    }
  };

  const removeCard = (targetBoardId, cardId) => {
    if (!window.confirm("Remove this issue from the board? The issue will remain in its project.")) {
      return;
    }
    runMutation.mutate({
      method: "delete",
      path: `/boards/${targetBoardId}/cards/${cardId}`,
    });
  };

  const deleteList = (list) => {
    if (!window.confirm(`Delete the empty "${list.name}" list?`)) return;
    runMutation.mutate({
      method: "delete",
      path: `/boards/${boardId}/lists/${list.id}`,
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (active.data.current?.kind === "list") {
      const from = lists.findIndex(
        (list) => `list:${list.id}` === active.id,
      );
      const overListId =
        over.data.current?.listId ||
        String(over.id).replace(/^list:/, "").replace(/^drop:/, "");
      const to = lists.findIndex((list) => list.id === overListId);
      if (from < 0 || to < 0) return;
      const next = arrayMove(lists, from, to);
      runMutation.mutate({
        method: "post",
        path: `/boards/${boardId}/lists/reorder`,
        body: { listIds: next.map((list) => list.id) },
      });
      return;
    }
    if (active.data.current?.kind !== "card") return;
    const draggedCardId = active.data.current.cardId;
    const sourceListId = active.data.current.listId;
    const targetData = over.data.current || {};
    const targetListId =
      targetData.listId ||
      lists.find((list) => list.cards.some((card) => card.id === over.id.slice(5)))?.id;
    const targetList = lists.find((list) => list.id === targetListId);
    if (!targetList) return;
    const sourceList = lists.find((list) => list.id === sourceListId);
    const sourceIndex =
      sourceList?.cards.findIndex((card) => card.id === draggedCardId) ?? -1;
    const targetCards = targetList.cards.filter((card) => card.id !== draggedCardId);
    const overCardId = targetData.cardId || String(over.id).replace(/^card:/, "");
    const overIndex = targetCards.findIndex((card) => card.id === overCardId);
    let position = overIndex < 0 ? targetCards.length : overIndex;
    if (
      sourceListId === targetListId &&
      sourceIndex >= 0 &&
      overIndex >= 0 &&
      sourceIndex < targetList.cards.findIndex((card) => card.id === overCardId)
    ) {
      position += 1;
    }
    if (sourceListId === targetListId && overIndex < 0) return;
    runMutation.mutate({
      method: "patch",
      path: `/boards/${boardId}/cards/${draggedCardId}/move`,
      body: { listId: targetListId, position },
    });
  };

  return (
    <VStack align="stretch" spacing={5} maxW="1600px" mx="auto" minW={0}>
      <HStack
        align={{ base: "stretch", md: "center" }}
        justify="space-between"
        flexDirection={{ base: "column", md: "row" }}
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
            Project work
          </Text>
          <HStack mt={1.5} spacing={3} flexWrap="wrap">
            <Text as="h1" color="textPrimary" fontSize="2xl" fontWeight="700">
              Boards
            </Text>
            {selectedProject && (
              <Badge bg="surfaceRaised" color="textSecondary" borderRadius="full">
                {selectedProject.name}
              </Badge>
            )}
          </HStack>
          <Text mt={1} color="textMuted" fontSize="sm">
            Organize project issues into collaborative Kanban lists.
          </Text>
        </Box>
        <HStack spacing={2} flexWrap="wrap">
          <Select
            aria-label="Select project"
            value={projectId}
            onChange={(event) =>
              setProjectSelection({
                workspaceId: activeWorkspace?.id || "",
                projectId: event.target.value,
              })
            }
            maxW={{ base: "full", sm: "230px" }}
            bg="surfaceRaised"
            borderColor="borderSubtle"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
          {canManage && (
            <Button
              variant="primary"
              minH="40px"
              onClick={() => openBoardDialog()}
              isDisabled={!projectId}
            >
              <Plus size={16} />
              <Text ml={2}>New board</Text>
            </Button>
          )}
        </HStack>
      </HStack>

      {error && (
        <Alert status="error" borderRadius="control">
          <AlertIcon />
          {error}
        </Alert>
      )}
      {notice && (
        <Alert status="success" borderRadius="control">
          <AlertIcon />
          {notice}
        </Alert>
      )}
      {loadError && (
        <Alert status="error" borderRadius="control">
          <AlertIcon />
          {loadError.message || "Could not load boards."}
        </Alert>
      )}

      {!isPending && projects.length === 0 && (
        <Card p={8} textAlign="center">
          <FolderKanban size={24} className="mx-auto text-[var(--text-muted)]" />
          <Text mt={3} color="textPrimary" fontWeight="600">
            Create a project first
          </Text>
          <Text mt={1} color="textMuted" fontSize="sm">
            Boards are scoped to a project, so project issues stay organized.
          </Text>
        </Card>
      )}
      {isPending && (
        <HStack justify="center" py={16} color="textSecondary">
          <Spinner size="sm" color="accent" />
          <Text fontSize="sm">Loading project boards</Text>
        </HStack>
      )}
      {!isPending && projects.length > 0 && (
        <>
          <HStack justify="space-between" flexWrap="wrap" spacing={3}>
            <Select
              aria-label="Select board"
              value={boardId}
              onChange={(event) =>
                setBoardSelection({ projectId, boardId: event.target.value })
              }
              maxW={{ base: "full", sm: "320px" }}
              bg="surfaceRaised"
              borderColor="borderSubtle"
              isDisabled={boards.length === 0}
            >
              {boards.length === 0 && <option value="">No boards yet</option>}
              {boards.map((boardOption) => (
                <option key={boardOption.id} value={boardOption.id}>
                  {boardOption.name}
                </option>
              ))}
            </Select>
            {board && (
              <HStack spacing={2}>
                {canManage && (
                  <>
                    <Button
                      variant="secondary"
                      minH="38px"
                      onClick={() => {
                        setListName("");
                        setListDialog({ id: "" });
                      }}
                    >
                      <ListPlus size={15} />
                      <Text ml={2}>Add list</Text>
                    </Button>
                    <Button
                      variant="secondary"
                      minH="38px"
                      onClick={() => openBoardDialog(board)}
                    >
                      <Pencil size={14} />
                      <Text ml={2}>Edit board</Text>
                    </Button>
                    <Tooltip label="Archive board">
                      <IconButton
                        aria-label="Archive board"
                        icon={<Trash2 size={15} />}
                        variant="secondary"
                        onClick={() => {
                          if (!window.confirm("Archive this board?")) return;
                          runMutation.mutate({
                            method: "delete",
                            path: `/boards/${board.id}`,
                          });
                          setBoardSelection({ projectId, boardId: "" });
                        }}
                      />
                    </Tooltip>
                  </>
                )}
              </HStack>
            )}
          </HStack>

          {boards.length === 0 ? (
            <Card p={8} textAlign="center">
              <Kanban size={25} className="mx-auto text-[var(--accent)]" />
              <Text mt={3} color="textPrimary" fontWeight="600">
                No boards in this project yet
              </Text>
              <Text mt={1} color="textMuted" fontSize="sm">
                Create a board to start organizing project work.
              </Text>
            </Card>
          ) : boardQuery.isPending ? (
            <HStack justify="center" py={14} color="textSecondary">
              <Spinner size="sm" color="accent" />
              <Text fontSize="sm">Loading board</Text>
            </HStack>
          ) : boardQuery.error ? (
            <Alert status="error" borderRadius="control">
              <AlertIcon />
              {boardQuery.error.message}
            </Alert>
          ) : (
            <Box minW={0}>
              {board?.description && (
                <Text mb={3} color="textSecondary" fontSize="sm">
                  {board.description}
                </Text>
              )}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={lists.map((list) => `list:${list.id}`)}
                  strategy={horizontalListSortingStrategy}
                >
                  <HStack
                    align="stretch"
                    spacing={4}
                    overflowX="auto"
                    overflowY="hidden"
                    pb={4}
                    className="app-scrollbar"
                  >
                    {lists.map((list) => (
                      <BoardColumn
                        key={list.id}
                        boardId={board.id}
                        list={list}
                        projectMembers={projectMembersQuery.data || []}
                        canManage={canManage}
                        onAddCard={(targetList) => {
                          setIssueId("");
                          setCardDialog(targetList);
                        }}
                        onEditList={(targetList) => {
                          setListName(targetList.name);
                          setListDialog(targetList);
                        }}
                        onDeleteList={deleteList}
                        onRemoveCard={removeCard}
                      />
                    ))}
                    {canManage && (
                      <Button
                        variant="secondary"
                        minW={{ base: "min(260px, 76vw)", md: "260px" }}
                        h="48px"
                        onClick={() => {
                          setListName("");
                          setListDialog({ id: "" });
                        }}
                      >
                        <Plus size={15} />
                        <Text ml={2}>Add another list</Text>
                      </Button>
                    )}
                  </HStack>
                </SortableContext>
              </DndContext>
              {lists.length === 0 && (
                <Card p={8} textAlign="center">
                  <ClipboardList size={24} className="mx-auto text-[var(--text-muted)]" />
                  <Text mt={3} color="textPrimary" fontWeight="600">
                    This board has no lists
                  </Text>
                </Card>
              )}
            </Box>
          )}
        </>
      )}

      <Modal
        isOpen={Boolean(boardDialog)}
        onClose={() => setBoardDialog(null)}
        isCentered
      >
        <ModalOverlay backdropFilter="blur(8px)" />
        <ModalContent bg="surface" border="1px solid" borderColor="borderSubtle">
          <ModalHeader>{boardDialog?.id ? "Edit board" : "Create board"}</ModalHeader>
          <ModalCloseButton />
          <Box as="form" onSubmit={saveBoard}>
            <ModalBody>
              <VStack align="stretch" spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Board name</FormLabel>
                  <Input
                    value={boardForm.name}
                    maxLength={80}
                    autoFocus
                    onChange={(event) =>
                      setBoardForm((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={boardForm.description}
                    maxLength={1000}
                    onChange={(event) =>
                      setBoardForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter gap={2}>
              <Button variant="ghost" onClick={() => setBoardDialog(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={runMutation.isPending}>
                {boardDialog?.id ? "Save changes" : "Create board"}
              </Button>
            </ModalFooter>
          </Box>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={Boolean(listDialog)}
        onClose={() => setListDialog(null)}
        isCentered
      >
        <ModalOverlay backdropFilter="blur(8px)" />
        <ModalContent bg="surface" border="1px solid" borderColor="borderSubtle">
          <ModalHeader>{listDialog?.id ? "Rename list" : "Add a list"}</ModalHeader>
          <ModalCloseButton />
          <Box as="form" onSubmit={saveList}>
            <ModalBody>
              <FormControl isRequired>
                <FormLabel>List name</FormLabel>
                <Input
                  value={listName}
                  maxLength={80}
                  autoFocus
                  onChange={(event) => setListName(event.target.value)}
                />
              </FormControl>
            </ModalBody>
            <ModalFooter gap={2}>
              <Button variant="ghost" onClick={() => setListDialog(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={runMutation.isPending}>
                Save list
              </Button>
            </ModalFooter>
          </Box>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={Boolean(cardDialog)}
        onClose={() => setCardDialog(null)}
        isCentered
      >
        <ModalOverlay backdropFilter="blur(8px)" />
        <ModalContent bg="surface" border="1px solid" borderColor="borderSubtle">
          <ModalHeader>Add an issue card</ModalHeader>
          <ModalCloseButton />
          <Box as="form" onSubmit={addIssueCard}>
            <ModalBody>
              <FormControl isRequired>
                <FormLabel>Issue ID</FormLabel>
                <Input
                  value={issueId}
                  maxLength={128}
                  autoFocus
                  placeholder="Paste an issue ID from this project"
                  onChange={(event) => setIssueId(event.target.value)}
                />
                <Text mt={2} color="textMuted" fontSize="xs">
                  A card is only a board placement; its title, status, and other details stay on the canonical issue.
                  Issue creation and search arrive in Section 9.
                </Text>
              </FormControl>
            </ModalBody>
            <ModalFooter gap={2}>
              <Button variant="ghost" onClick={() => setCardDialog(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" isLoading={runMutation.isPending}>
                Add to board
              </Button>
            </ModalFooter>
          </Box>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
