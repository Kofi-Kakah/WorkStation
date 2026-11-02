import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AlertIcon,
  Avatar,
  Badge,
  Box,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
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
  useBreakpointValue,
  useDisclosure,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Hash,
  LockKeyhole,
  MessageCircle,
  Paperclip,
  Plus,
  Search,
  Send,
  Smile,
  Users,
  X,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Card from "../../components/ui/Card.jsx";
import { useAuth } from "../../contexts/useAuth.jsx";
import { api } from "../../services/apiClient.js";
import { useChannelEvents } from "./useChannelEvents.js";

const REACTIONS = ["👍", "❤️", "😂", "🎉", "👀", "🙏"];

function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function timestampValue(value) {
  if (typeof value === "number") return value;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?._seconds === "number") {
    return value._seconds * 1000 + Math.floor((value._nanoseconds || 0) / 1e6);
  }
  return null;
}

function conversationTitle(conversation, uid) {
  if (!conversation) return "";
  if (conversation.type === "channel") return conversation.name;
  if (conversation.name) return conversation.name;
  return (
    conversation.members
      ?.filter((member) => member.userId !== uid)
      .map((member) => member.displayName)
      .join(", ") || "Direct message"
  );
}

function MessageItem({
  message,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onReact,
  readByCount = 0,
}) {
  const [reactionMenu, setReactionMenu] = useState(false);
  const isMine = message.senderId === currentUserId;
  return (
    <Box
      role="group"
      px={{ base: 3, md: 4 }}
      py={3}
      borderRadius="control"
      _hover={{ bg: "surfaceRaised" }}
      transition="background 150ms ease"
    >
      <HStack align="start" spacing={3}>
        <Avatar
          size="sm"
          name={message.senderName}
          src={message.senderAvatarUrl || undefined}
          bg="accentSoft"
          color="accent"
        />
        <Box flex={1} minW={0}>
          <HStack spacing={2} flexWrap="wrap">
            <Text fontSize="sm" fontWeight="700" color="textPrimary">
              {message.senderName || "Workspace member"}
            </Text>
            <Text fontSize="xs" color="textMuted">
              {formatTime(message.createdAtMs)}
            </Text>
            {message.isEdited && (
              <Text fontSize="xs" color="textMuted">
                edited
              </Text>
            )}
          </HStack>
          <Text
            mt={1}
            whiteSpace="pre-wrap"
            overflowWrap="anywhere"
            color={message.isDeleted ? "textMuted" : "textSecondary"}
            fontSize="sm"
          >
            {message.isDeleted ? "This message was deleted." : message.content}
          </Text>
          {isMine && readByCount > 0 && (
            <Text mt={1} color="textMuted" fontSize="10px">
              Seen by {readByCount}
            </Text>
          )}
          {message.attachments?.length > 0 && (
            <VStack align="start" mt={2} spacing={2}>
              {message.attachments.map((attachment) =>
                attachment.mimeType.startsWith("image/") ? (
                  <Box
                    key={attachment.id}
                    as="a"
                    href={attachment.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    display="block"
                    maxW="min(360px, 100%)"
                    border="1px solid"
                    borderColor="borderSubtle"
                    borderRadius="control"
                    overflow="hidden"
                  >
                    <Box
                      as="img"
                      src={attachment.downloadUrl}
                      alt={attachment.name}
                      loading="lazy"
                      maxH="280px"
                      objectFit="contain"
                    />
                  </Box>
                ) : (
                  <Box
                    key={attachment.id}
                    as="a"
                    href={attachment.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    download={attachment.name}
                    px={3}
                    py={2}
                    border="1px solid"
                    borderColor="borderSubtle"
                    borderRadius="control"
                    bg="surfaceRaised"
                    color="textSecondary"
                    fontSize="xs"
                    _hover={{ borderColor: "accentBorder", color: "textPrimary" }}
                  >
                    {attachment.name} ·{" "}
                    {Math.max(1, Math.round(attachment.size / 1024))} KB
                  </Box>
                ),
              )}
            </VStack>
          )}
          {message.mentions?.length > 0 && (
            <HStack mt={2} spacing={1} flexWrap="wrap">
              {message.mentions.map((userId) => (
                <Badge
                  key={userId}
                  color="accentHot"
                  bg="accentSoft"
                  borderRadius="full"
                  px={2}
                  fontSize="10px"
                >
                  Mentioned
                </Badge>
              ))}
            </HStack>
          )}
          {message.reactionSummary?.length > 0 && (
            <HStack mt={2} spacing={1} flexWrap="wrap">
              {message.reactionSummary.map((reaction) => (
                <Button
                  key={reaction.emoji}
                  variant="secondary"
                  minH="26px"
                  px={2}
                  fontSize="xs"
                  onClick={() => onReact(message.id, reaction.emoji)}
                  aria-label={`React with ${reaction.emoji}; ${reaction.count} reactions`}
                >
                  {reaction.emoji} {reaction.count}
                </Button>
              ))}
            </HStack>
          )}
        </Box>
        {!message.isDeleted && (
          <HStack
            spacing={0.5}
            opacity={{ base: 1, md: 0 }}
            _groupHover={{ opacity: 1 }}
            transition="opacity 150ms ease"
          >
            <Tooltip label="Reply in thread">
              <IconButton
                aria-label="Reply in thread"
                icon={<MessageCircle size={15} />}
                size="xs"
                variant="ghost"
                color="textMuted"
                onClick={() => onReply(message)}
              />
            </Tooltip>
            <Tooltip label="Add reaction">
              <IconButton
                aria-label="Add reaction"
                icon={<Smile size={15} />}
                size="xs"
                variant="ghost"
                color="textMuted"
                onClick={() => setReactionMenu((open) => !open)}
              />
            </Tooltip>
            {isMine && (
              <>
                <Tooltip label="Edit message">
                  <IconButton
                    aria-label="Edit message"
                    icon={<Check size={14} />}
                    size="xs"
                    variant="ghost"
                    color="textMuted"
                    onClick={() => onEdit(message)}
                  />
                </Tooltip>
                <Tooltip label="Delete message">
                  <IconButton
                    aria-label="Delete message"
                    icon={<X size={14} />}
                    size="xs"
                    variant="ghost"
                    color="textMuted"
                    onClick={() => onDelete(message)}
                  />
                </Tooltip>
              </>
            )}
          </HStack>
        )}
      </HStack>
      {reactionMenu && (
        <HStack mt={2} ml={{ base: 10, md: 11 }} spacing={1}>
          {REACTIONS.map((emoji) => (
            <IconButton
              key={emoji}
              aria-label={`React ${emoji}`}
              icon={<Text fontSize="sm">{emoji}</Text>}
              size="xs"
              variant="ghost"
              onClick={() => {
                onReact(message.id, emoji);
                setReactionMenu(false);
              }}
            />
          ))}
        </HStack>
      )}
    </Box>
  );
}

function MessageComposer({
  channelId,
  members,
  parentMessageId = null,
  onSent,
}) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [mentions, setMentions] = useState([]);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeout = useRef(null);

  const sendMessage = useMutation({
    mutationFn: async (body) => {
      const attachmentIds = [];
      for (const file of files) {
        const uploadId = window.crypto.randomUUID();
        await api.putBinary(
          `/channels/${channelId}/uploads/${uploadId}`,
          file,
          {
            "Content-Type": "application/octet-stream",
            "X-File-Name": encodeURIComponent(file.name),
            "X-File-Type": file.type,
          },
        );
        attachmentIds.push(uploadId);
      }
      return api.post(`/channels/${channelId}/messages`, {
        ...body,
        attachmentIds,
      });
    },
    onSuccess: async () => {
      setContent("");
      setMentions([]);
      setFiles([]);
      setError("");
      await queryClient.invalidateQueries({
        queryKey: ["messages", channelId],
      });
      if (parentMessageId) {
        await queryClient.invalidateQueries({
          queryKey: ["messages", channelId, "thread", parentMessageId],
        });
      }
      onSent?.();
      api.post(`/channels/${channelId}/presence`, { isTyping: false }).catch(
        (requestError) => console.warn("Could not clear typing state", requestError),
      );
    },
    onError: (requestError) => {
      setError(requestError.message || "Message could not be sent.");
    },
  });

  const submit = (event) => {
    event.preventDefault();
    const trimmed = content.trim();
    if ((!trimmed && files.length === 0) || sendMessage.isPending) return;
    sendMessage.mutate({
      content: trimmed,
      parentMessageId,
      mentions,
    });
  };

  const addMention = (event) => {
    const userId = event.target.value;
    if (!userId) return;
    const member = members.find((item) => item.userId === userId);
    if (member) {
      setContent((current) => `${current}${current && !current.endsWith(" ") ? " " : ""}@${member.displayName} `);
      setMentions((current) =>
        current.includes(userId) ? current : [...current, userId],
      );
    }
    event.target.value = "";
    textareaRef.current?.focus();
  };

  const handleChange = (event) => {
    setContent(event.target.value);
    if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
    typingTimeout.current = window.setTimeout(() => {
      api.post(`/channels/${channelId}/presence`, { isTyping: true }).catch(
        (requestError) => console.warn("Could not update typing state", requestError),
      );
    }, 500);
  };

  const selectFiles = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const unsupported = selectedFiles.find(
      (file) =>
        ![
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "application/pdf",
          "text/plain",
        ].includes(file.type) ||
        file.size === 0 ||
        file.size > 10 * 1024 * 1024,
    );
    if (unsupported) {
      setError(
        `${unsupported.name} is not supported. Choose an image, PDF, or text file up to 10 MB.`,
      );
    } else if (files.length + selectedFiles.length > 10) {
      setError("Attach up to 10 files to a message.");
    } else {
      setError("");
      setFiles((current) => [...current, ...selectedFiles]);
    }
    event.target.value = "";
  };

  useEffect(
    () => () => {
      if (typingTimeout.current) window.clearTimeout(typingTimeout.current);
    },
    [],
  );

  return (
    <Box as="form" onSubmit={submit} px={{ base: 3, md: 5 }} pb={4}>
      {error && (
        <Alert status="error" mb={2} borderRadius="control">
          <AlertIcon />
          {error}
        </Alert>
      )}
      {files.length > 0 && (
        <HStack mb={2} spacing={2} flexWrap="wrap">
          {files.map((file, index) => (
            <Badge
              key={`${file.name}-${file.lastModified}-${index}`}
              display="inline-flex"
              alignItems="center"
              gap={1}
              px={2}
              py={1}
              bg="surfaceRaised"
              color="textSecondary"
              borderRadius="full"
            >
              {file.name}
              <IconButton
                aria-label={`Remove ${file.name}`}
                icon={<X size={11} />}
                size="xs"
                minW="16px"
                h="16px"
                variant="ghost"
                onClick={() =>
                  setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))
                }
              />
            </Badge>
          ))}
        </HStack>
      )}
      <HStack
        align="end"
        spacing={2}
        p={2}
        border="1px solid"
        borderColor="borderSubtle"
        borderRadius="control"
        bg="surfaceRaised"
        _focusWithin={{ borderColor: "accent", boxShadow: "0 0 0 1px var(--accent)" }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain"
          hidden
          onChange={selectFiles}
        />
        <Tooltip label="Attach files">
          <IconButton
            type="button"
            aria-label="Attach files"
            icon={<Paperclip size={16} />}
            size="sm"
            variant="ghost"
            color="textMuted"
            onClick={() => fileInputRef.current?.click()}
          />
        </Tooltip>
        {members.length > 1 && (
          <Select
            aria-label="Mention a conversation member"
            placeholder="@"
            value=""
            onChange={addMention}
            w="54px"
            minW="54px"
            size="sm"
            variant="unstyled"
            color="textMuted"
            title="Mention someone"
          >
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.displayName}
              </option>
            ))}
          </Select>
        )}
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          aria-label="Write a message"
          placeholder="Write a message..."
          minH="42px"
          maxH="140px"
          resize="none"
          border="0"
          bg="transparent"
          color="textPrimary"
          _focusVisible={{ boxShadow: "none" }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <Button
          type="submit"
          variant="primary"
          minW="42px"
          h="42px"
          borderRadius="control"
          isDisabled={(!content.trim() && files.length === 0) || sendMessage.isPending}
          isLoading={sendMessage.isPending}
          aria-label="Send message"
        >
          <Send size={16} />
        </Button>
      </HStack>
      <Text mt={1.5} px={1} color="textMuted" fontSize="xs">
        Enter to send · Shift + Enter for a new line
      </Text>
    </Box>
  );
}

export default function ChatPage() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const isDirectRoute = location.pathname.startsWith("/dm");
  const isMobile = useBreakpointValue({ base: true, lg: false }) ?? false;
  const scopeKey = `${activeWorkspace?.id || ""}:${isDirectRoute ? "dm" : "channel"}`;
  const [activeSelection, setActiveSelection] = useState({
    scopeKey: "",
    id: "",
  });
  const activeId =
    activeSelection.scopeKey === scopeKey ? activeSelection.id : "";
  const setActiveId = useCallback(
    (id) => setActiveSelection({ scopeKey, id }),
    [scopeKey],
  );
  const [searchSelection, setSearchSelection] = useState({
    scopeKey: "",
    value: "",
  });
  const searchText =
    searchSelection.scopeKey === scopeKey ? searchSelection.value : "";
  const setSearchText = useCallback(
    (value) => setSearchSelection({ scopeKey, value }),
    [scopeKey],
  );
  const [editingMessage, setEditingMessage] = useState(null);
  const [listSearch, setListSearch] = useState("");
  const [editText, setEditText] = useState("");
  const [formError, setFormError] = useState("");
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [jumpTargetId, setJumpTargetId] = useState("");
  const channelDialog = useDisclosure();
  const conversationDialog = useDisclosure();
  const [channelForm, setChannelForm] = useState({
    name: "",
    topic: "",
    visibility: "public",
    memberIds: [],
  });
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [threadSelection, setThreadSelection] = useState({
    scopeKey: "",
    parent: null,
  });
  const threadParent =
    threadSelection.scopeKey === scopeKey ? threadSelection.parent : null;
  const setThreadParent = useCallback(
    (parent) => setThreadSelection({ scopeKey, parent }),
    [scopeKey],
  );
  const messagesEndRef = useRef(null);
  const readMessageRef = useRef("");

  const channelsQuery = useQuery({
    queryKey: ["channels", activeWorkspace?.id],
    enabled: Boolean(activeWorkspace?.id),
    queryFn: async () => {
      const response = await api.get(
        `/channels?workspaceId=${encodeURIComponent(activeWorkspace.id)}`,
      );
      return response.channels || [];
    },
  });
  const conversationsQuery = useQuery({
    queryKey: ["conversations", activeWorkspace?.id],
    enabled: Boolean(activeWorkspace?.id),
    queryFn: async () => {
      const response = await api.get(
        `/channels/conversations?workspaceId=${encodeURIComponent(activeWorkspace.id)}`,
      );
      return response.conversations || [];
    },
  });
  const membersQuery = useQuery({
    queryKey: ["workspace", activeWorkspace?.id, "members"],
    enabled: Boolean(activeWorkspace?.id),
    queryFn: async () => {
      const response = await api.get(`/workspaces/${activeWorkspace.id}/members`);
      return response.members || [];
    },
  });

  const list = useMemo(
    () =>
      isDirectRoute
        ? conversationsQuery.data || []
        : channelsQuery.data || [],
    [isDirectRoute, conversationsQuery.data, channelsQuery.data],
  );
  const filteredList = useMemo(() => {
    const query = listSearch.trim().toLocaleLowerCase();
    if (!query) return list;
    return list.filter((item) =>
      conversationTitle(item, user?.uid).toLocaleLowerCase().includes(query),
    );
  }, [list, listSearch, user?.uid]);
  const selected =
    list.find((item) => item.id === activeId) ||
    (!activeId && !isMobile ? list[0] : null) ||
    null;
  const selectedTitle = conversationTitle(selected, user?.uid);
  const queryKey = useMemo(
    () => ["messages", selected?.id],
    [selected?.id],
  );
  const messagesQuery = useQuery({
    queryKey,
    enabled: Boolean(selected?.id),
    queryFn: async () => {
      const response = await api.get(
        `/channels/${selected.id}/messages?limit=50`,
      );
      return {
        messages: response.messages || [],
        nextBefore: response.nextBefore || null,
      };
    },
  });
  const membersQueryForConversation = useQuery({
    queryKey: ["channel", selected?.id, "members"],
    enabled: Boolean(selected?.id),
    refetchInterval: 5000,
    queryFn: async () => {
      const response = await api.get(`/channels/${selected.id}/members`);
      return response.members || [];
    },
  });
  const activeMembers = membersQueryForConversation.data || [];
  const onMessagesUpdated = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: ["messages", selected?.id],
      }),
    [queryClient, selected?.id],
  );
  const liveStatus = useChannelEvents(selected?.id, onMessagesUpdated);

  const searchQuery = useQuery({
    queryKey: ["messages", selected?.id, "search", searchText],
    enabled: Boolean(selected?.id && searchText.trim().length >= 2),
    queryFn: async () => {
      const response = await api.get(
        `/messages/search?channelId=${encodeURIComponent(selected.id)}&query=${encodeURIComponent(searchText.trim())}&limit=20`,
      );
      return response.messages || [];
    },
  });

  const threadQuery = useQuery({
    queryKey: ["messages", selected?.id, "thread", threadParent?.id],
    enabled: Boolean(selected?.id && threadParent?.id),
    queryFn: async () => {
      const response = await api.get(
        `/channels/${selected.id}/messages?limit=50&parentMessageId=${encodeURIComponent(threadParent.id)}`,
      );
      return response.messages || [];
    },
  });

  useEffect(() => {
    if (!selected?.id || !selected.currentUserIsMember) return undefined;
    const sendHeartbeat = () =>
      api.post(`/channels/${selected.id}/presence`, {}).catch((error) =>
        console.warn("Could not update presence", error),
      );
    sendHeartbeat();
    const timer = window.setInterval(sendHeartbeat, 30_000);
    return () => window.clearInterval(timer);
  }, [selected?.id, selected?.currentUserIsMember]);

  useEffect(() => {
    const messages = messagesQuery.data?.messages || [];
    const latest = messages[messages.length - 1];
    if (
      !selected?.id ||
      !latest?.id ||
      !selected.currentUserIsMember ||
      readMessageRef.current === `${selected.id}:${latest.id}`
    ) {
      return;
    }
    readMessageRef.current = `${selected.id}:${latest.id}`;
    api
      .post(`/channels/${selected.id}/read`, { messageId: latest.id })
      .catch((error) => console.warn("Could not update read receipt", error));
  }, [messagesQuery.data, selected?.id, selected?.currentUserIsMember]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [
    messagesQuery.data?.messages?.length,
    threadQuery.data?.length,
  ]);

  useEffect(() => {
    if (!jumpTargetId) return;
    const target = document.getElementById(`message-${jumpTargetId}`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [
    jumpTargetId,
    messagesQuery.data?.messages?.length,
    threadQuery.data?.length,
  ]);

  const loadEarlierMessages = async () => {
    const before = messagesQuery.data?.nextBefore;
    if (!selected?.id || !before || loadingEarlier) return;
    setLoadingEarlier(true);
    try {
      const response = await api.get(
        `/channels/${selected.id}/messages?limit=50&before=${before}`,
      );
      queryClient.setQueryData(queryKey, (current) => ({
        messages: [
          ...(response.messages || []),
          ...(current?.messages || []),
        ],
        nextBefore: response.nextBefore || null,
      }));
    } catch (error) {
      setFormError(error.message || "Earlier messages could not be loaded.");
    } finally {
      setLoadingEarlier(false);
    }
  };

  const jumpToMessage = async (target) => {
    setSearchText("");
    if (target.parentMessageId) {
      try {
        const response = await api.get(
          `/channels/${selected.id}/messages/${target.parentMessageId}`,
        );
        setThreadParent(response.message);
        setJumpTargetId(target.id);
      } catch (error) {
        setFormError(error.message || "Could not open this thread.");
      }
      return;
    }
    const loadedMessages = messagesQuery.data?.messages || [];
    if (loadedMessages.some((message) => message.id === target.id)) {
      setJumpTargetId(target.id);
      return;
    }

    let cursor = messagesQuery.data?.nextBefore;
    let olderMessages = [];
    let found = false;
    let attempts = 0;
    try {
      while (cursor && !found && attempts < 10) {
        const response = await api.get(
          `/channels/${selected.id}/messages?limit=50&before=${cursor}`,
        );
        const page = response.messages || [];
        olderMessages = [...page, ...olderMessages];
        found = page.some((message) => message.id === target.id);
        cursor = response.nextBefore || null;
        attempts += 1;
      }
      if (!found) {
        setFormError("This message is outside the available history window.");
        return;
      }
      if (olderMessages.length) {
        queryClient.setQueryData(queryKey, (current) => ({
          messages: [...olderMessages, ...(current?.messages || [])],
          nextBefore: cursor,
        }));
      }
      setJumpTargetId(target.id);
    } catch (error) {
      setFormError(error.message || "Could not open this search result.");
    }
  };

  const createChannelMutation = useMutation({
    mutationFn: (input) => api.post("/channels", input),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: ["channels", activeWorkspace?.id],
      });
      setActiveId(response.channel.id);
      setChannelForm({
        name: "",
        topic: "",
        visibility: "public",
        memberIds: [],
      });
      channelDialog.onClose();
      setFormError("");
    },
    onError: (error) => setFormError(error.message || "Channel could not be created."),
  });

  const createConversationMutation = useMutation({
    mutationFn: (memberIds) =>
      api.post("/channels/conversations", {
        workspaceId: activeWorkspace.id,
        memberIds,
      }),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: ["conversations", activeWorkspace?.id],
      });
      setActiveId(response.conversation.id);
      conversationDialog.onClose();
      setSelectedMemberIds([]);
      setFormError("");
    },
    onError: (error) =>
      setFormError(error.message || "Conversation could not be created."),
  });

  const joinChannelMutation = useMutation({
    mutationFn: (channelId) => api.post(`/channels/${channelId}/join`),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["channels", activeWorkspace?.id],
        }),
        queryClient.invalidateQueries({ queryKey: ["channel", activeId, "members"] }),
      ]);
    },
    onError: (error) => setFormError(error.message || "Unable to join channel."),
  });

  const updateMessageMutation = useMutation({
    mutationFn: ({ messageId, content }) =>
      api.patch(`/channels/${selected.id}/messages/${messageId}`, { content }),
    onSuccess: async () => {
      setEditingMessage(null);
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => setFormError(error.message || "Message could not be updated."),
  });

  const deleteMessage = async (message) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await api.delete(`/channels/${selected.id}/messages/${message.id}`);
      await queryClient.invalidateQueries({ queryKey });
      setFormError("");
    } catch (error) {
      setFormError(error.message || "Message could not be deleted.");
    }
  };

  const toggleReaction = async (messageId, emoji) => {
    try {
      await api.post(
        `/channels/${selected.id}/messages/${messageId}/reactions`,
        { emoji },
      );
      await queryClient.invalidateQueries({ queryKey });
    } catch (error) {
      setFormError(error.message || "Reaction could not be saved.");
    }
  };

  const beginConversation = (event) => {
    event.preventDefault();
    const memberIds = selectedMemberIds.filter((memberId) => memberId !== user?.uid);
    if (!memberIds.length) {
      setFormError("Select at least one other workspace member.");
      return;
    }
    createConversationMutation.mutate(memberIds);
  };

  const selectChannel = (channel) => {
    setFormError("");
    setThreadParent(null);
    setSearchText("");
    setActiveId(channel.id);
    if (channel.visibility === "public" && !channel.currentUserIsMember) {
      joinChannelMutation.mutate(channel.id);
    }
  };

  const isLoading = channelsQuery.isPending || conversationsQuery.isPending;
  const listError = channelsQuery.error || conversationsQuery.error;
  const currentUserMember = activeMembers.find(
    (member) => member.userId === user?.uid,
  );
  const typingMembers = activeMembers.filter(
    (member) => member.isTyping && member.userId !== user?.uid,
  );

  const sidebar = (
    <Card
      className="flex h-full min-h-0 flex-col overflow-hidden"
      p={0}
      aria-label={isDirectRoute ? "Direct messages" : "Channels"}
    >
      <HStack justify="space-between" px={4} py={4}>
        <Box>
          <Text
            color="textMuted"
            fontSize="10px"
            fontWeight="700"
            letterSpacing="0.12em"
            textTransform="uppercase"
          >
            {isDirectRoute ? "Messages" : "Channels"}
          </Text>
          <Text mt={1} color="textSecondary" fontSize="xs">
            {activeWorkspace?.name || "Workspace"}
          </Text>
        </Box>
        <Tooltip label={isDirectRoute ? "New conversation" : "Create channel"}>
          <IconButton
            aria-label={isDirectRoute ? "New conversation" : "Create channel"}
            icon={<Plus size={16} />}
            size="sm"
            variant="ghost"
            color="accent"
            onClick={
              isDirectRoute ? conversationDialog.onOpen : channelDialog.onOpen
            }
          />
        </Tooltip>
      </HStack>
      <Divider />
      <Box px={3} pt={3}>
        <InputGroup size="sm">
          <InputLeftElement pointerEvents="none" color="textMuted">
            <Search size={14} />
          </InputLeftElement>
          <Input
            aria-label={isDirectRoute ? "Search conversations" : "Search channels"}
            value={listSearch}
            onChange={(event) => setListSearch(event.target.value)}
            placeholder={isDirectRoute ? "Find a conversation" : "Find a channel"}
            pl="9"
            bg="surfaceRaised"
            borderColor="borderSubtle"
            borderRadius="control"
            _focusVisible={{
              borderColor: "accent",
              boxShadow: "0 0 0 1px var(--accent)",
            }}
          />
        </InputGroup>
      </Box>
      {isLoading ? (
        <HStack p={4} color="textSecondary">
          <Spinner size="sm" color="accent" />
          <Text fontSize="sm">Loading conversations</Text>
        </HStack>
      ) : listError ? (
        <Text p={4} color="danger" fontSize="sm">
          {listError.message}
        </Text>
      ) : list.length ? (
        <VStack
          align="stretch"
          spacing={1}
          p={2}
          overflowY="auto"
          className="app-scrollbar"
        >
          {filteredList.length === 0 ? (
            <Text px={3} py={4} color="textMuted" fontSize="xs">
              No {isDirectRoute ? "conversations" : "channels"} match that search.
            </Text>
          ) : filteredList.map((conversation) => {
            const isSelected = conversation.id === selected?.id;
            const isChannel = conversation.type === "channel";
            return (
              <Button
                key={conversation.id}
                variant="ghost"
                h="42px"
                w="full"
                px={3}
                justifyContent="flex-start"
                gap={2.5}
                color={isSelected ? "textPrimary" : "textSecondary"}
                bg={isSelected ? "accentSoft" : "transparent"}
                border={isSelected ? "1px solid" : "1px solid transparent"}
                borderColor={isSelected ? "accentBorder" : "transparent"}
                _hover={{ bg: isSelected ? "accentSoft" : "surfaceRaised" }}
                onClick={() =>
                  isChannel ? selectChannel(conversation) : setActiveId(conversation.id)
                }
              >
                {isChannel ? (
                  conversation.visibility === "private" ? (
                    <LockKeyhole size={15} />
                  ) : (
                    <Hash size={15} />
                  )
                ) : (
                  <Avatar
                    size="xs"
                    name={conversationTitle(conversation, user?.uid)}
                  />
                )}
                <Text flex={1} textAlign="left" fontSize="sm" noOfLines={1}>
                  {conversationTitle(conversation, user?.uid)}
                </Text>
                {isChannel && !conversation.currentUserIsMember && (
                  <Badge bg="accentSoft" color="accentHot" borderRadius="full">
                    Join
                  </Badge>
                )}
              </Button>
            );
          })}
        </VStack>
      ) : (
        <VStack flex={1} justify="center" px={5} textAlign="center" spacing={2}>
          <Box
            display="grid"
            placeItems="center"
            w="42px"
            h="42px"
            borderRadius="icon"
            bg="accentSoft"
            color="accent"
          >
            {isDirectRoute ? <MessageCircle size={18} /> : <Hash size={18} />}
          </Box>
          <Text color="textPrimary" fontWeight="600" fontSize="sm">
            {isDirectRoute ? "No direct messages yet" : "No channels yet"}
          </Text>
          <Text color="textMuted" fontSize="xs">
            {isDirectRoute
              ? "Start a conversation with someone on your team."
              : "Create a channel to bring your team together."}
          </Text>
          <Button
            variant="secondary"
            mt={2}
            onClick={
              isDirectRoute ? conversationDialog.onOpen : channelDialog.onOpen
            }
          >
            <Plus size={14} />
            <Text ml={2} fontSize="xs">
              {isDirectRoute ? "New conversation" : "Create channel"}
            </Text>
          </Button>
        </VStack>
      )}
      {isDirectRoute && list.length > 0 && (
        <Box mt="auto" p={3} borderTop="1px solid" borderColor="borderSubtle">
          <Button
            variant="secondary"
            w="full"
            onClick={conversationDialog.onOpen}
          >
            <Plus size={14} />
            <Text ml={2} fontSize="xs">New conversation</Text>
          </Button>
        </Box>
      )}
    </Card>
  );

  return (
    <VStack
      align="stretch"
      spacing={4}
      maxW="1600px"
      mx="auto"
      h={{ base: "calc(100dvh - 110px)", md: "calc(100dvh - 132px)" }}
      minH="440px"
    >
      {!activeWorkspace && (
        <Alert status="info" borderRadius="card">
          <AlertIcon />
          Select a workspace to open team conversations.
        </Alert>
      )}
      {formError && (
        <Alert status="error" borderRadius="control">
          <AlertIcon />
          {formError}
          <IconButton
            ml="auto"
            aria-label="Dismiss error"
            icon={<X size={14} />}
            size="xs"
            variant="ghost"
            onClick={() => setFormError("")}
          />
        </Alert>
      )}
      <HStack
        flex={1}
        minH={0}
        align="stretch"
        spacing={4}
        overflow="hidden"
      >
        {(!isMobile || !activeId) && (
          <Box w={{ base: "full", lg: "280px" }} flexShrink={0} minH={0}>
            {sidebar}
          </Box>
        )}
        {(!isMobile || activeId) && (
          <Card className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" p={0}>
            {!selected ? (
              <VStack flex={1} justify="center" spacing={3} textAlign="center" p={6}>
                <MessageCircle size={24} color="var(--accent)" />
                <Heading size="sm">
                  {isDirectRoute ? "Choose a conversation" : "Choose a channel"}
                </Heading>
                <Text maxW="360px" color="textMuted" fontSize="sm">
                  Select an item from the list or start a new conversation.
                </Text>
              </VStack>
            ) : (
              <>
                <HStack
                  px={{ base: 3, md: 5 }}
                  py={3}
                  borderBottom="1px solid"
                  borderColor="borderSubtle"
                  justify="space-between"
                  minH="64px"
                >
                  <HStack spacing={3} minW={0}>
                    {isMobile && (
                      <IconButton
                        aria-label="Back to conversations"
                        icon={<ArrowLeft size={17} />}
                        size="sm"
                        variant="ghost"
                        onClick={() => setActiveId("")}
                      />
                    )}
                    <Box
                      display="grid"
                      placeItems="center"
                      w="34px"
                      h="34px"
                      borderRadius="icon"
                      bg="accentSoft"
                      color="accent"
                      flexShrink={0}
                    >
                      {selected.type === "channel" ? (
                        selected.visibility === "private" ? (
                          <LockKeyhole size={16} />
                        ) : (
                          <Hash size={17} />
                        )
                      ) : (
                        <MessageCircle size={16} />
                      )}
                    </Box>
                    <Box minW={0}>
                      <Heading size="sm" noOfLines={1}>
                        {selectedTitle}
                      </Heading>
                      <HStack mt={0.5} spacing={2}>
                        {selected.topic && (
                          <Text color="textMuted" fontSize="xs" noOfLines={1}>
                            {selected.topic}
                          </Text>
                        )}
                        <HStack spacing={1} color="textMuted">
                          <Users size={12} />
                          <Text fontSize="xs">
                            {activeMembers.length} ·{" "}
                            {activeMembers.filter((member) => member.isOnline).length} online
                          </Text>
                        </HStack>
                      </HStack>
                    </Box>
                  </HStack>
                  <HStack spacing={2}>
                    <HStack
                      spacing={1.5}
                      color={liveStatus === "live" ? "success" : "textMuted"}
                      title={`Messages ${liveStatus}`}
                    >
                      <Box
                        w="7px"
                        h="7px"
                        borderRadius="full"
                        bg={liveStatus === "live" ? "success" : "textMuted"}
                      />
                      <Text display={{ base: "none", sm: "block" }} fontSize="xs">
                        {liveStatus === "live" ? "Live" : "Connecting"}
                      </Text>
                    </HStack>
                    <IconButton
                      aria-label="Search messages"
                      icon={<Search size={16} />}
                      size="sm"
                      variant="ghost"
                      color="textSecondary"
                      onClick={() =>
                        document.getElementById("chat-message-search")?.focus()
                      }
                    />
                  </HStack>
                </HStack>
                {selected.type === "channel" && !selected.currentUserIsMember && (
                  <HStack p={3} bg="accentSoft" justify="space-between">
                    <Text color="textSecondary" fontSize="sm">
                      Join this channel to post messages.
                    </Text>
                    <Button
                      variant="primary"
                      minH="32px"
                      onClick={() => joinChannelMutation.mutate(selected.id)}
                      isLoading={joinChannelMutation.isPending}
                    >
                      Join channel
                    </Button>
                  </HStack>
                )}
                <Box px={{ base: 3, md: 5 }} py={2}>
                  <Input
                    id="chat-message-search"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    aria-label="Search messages in this conversation"
                    placeholder="Search messages in this conversation"
                    size="sm"
                    bg="surfaceRaised"
                    borderColor="borderSubtle"
                    borderRadius="control"
                    _focusVisible={{ borderColor: "accent", boxShadow: "0 0 0 1px var(--accent)" }}
                  />
                </Box>
                {searchText.trim().length >= 2 && (
                  <Box px={{ base: 3, md: 5 }} pb={2}>
                    {searchQuery.isPending ? (
                      <Text color="textMuted" fontSize="xs">Searching...</Text>
                    ) : searchQuery.error ? (
                      <Text color="danger" fontSize="xs">{searchQuery.error.message}</Text>
                    ) : (
                      <HStack spacing={2} overflowX="auto" className="app-scrollbar">
                        {(searchQuery.data || []).map((message) => (
                          <Button
                            key={message.id}
                            variant="secondary"
                            maxW="300px"
                            minH="30px"
                            px={3}
                            onClick={() => jumpToMessage(message)}
                          >
                            <Text noOfLines={1} fontSize="xs">
                              {message.senderName}: {message.content}
                            </Text>
                          </Button>
                        ))}
                        {searchQuery.data?.length === 0 && (
                          <Text color="textMuted" fontSize="xs">No matching messages.</Text>
                        )}
                      </HStack>
                    )}
                  </Box>
                )}
                <Box
                  flex={1}
                  minH={0}
                  display="flex"
                  overflow="hidden"
                  borderTop="1px solid"
                  borderColor="borderSubtle"
                >
                  <Box
                    flex={1}
                    minW={0}
                    overflowY="auto"
                    className="app-scrollbar"
                    py={3}
                  >
                    {messagesQuery.isPending ? (
                      <HStack justify="center" py={10} color="textSecondary">
                        <Spinner size="sm" color="accent" />
                        <Text fontSize="sm">Loading messages</Text>
                      </HStack>
                    ) : messagesQuery.error ? (
                      <Text px={5} py={8} color="danger" fontSize="sm">
                        {messagesQuery.error.message}
                      </Text>
                    ) : (messagesQuery.data?.messages || []).length === 0 ? (
                      <VStack justify="center" py={10} color="textMuted">
                        <MessageCircle size={22} />
                        <Text fontSize="sm">No messages yet. Start the conversation.</Text>
                      </VStack>
                    ) : (
                      <VStack align="stretch" spacing={0}>
                        {messagesQuery.data?.nextBefore && (
                          <Button
                            variant="ghost"
                            alignSelf="center"
                            minH="30px"
                            mb={2}
                            onClick={loadEarlierMessages}
                            isLoading={loadingEarlier}
                          >
                            Load earlier messages
                          </Button>
                        )}
                        {(messagesQuery.data?.messages || []).map((message) => (
                          <Box
                            key={message.id}
                            id={`message-${message.id}`}
                            borderRadius="control"
                            border={
                              jumpTargetId === message.id
                                ? "1px solid var(--accent-border)"
                                : "1px solid transparent"
                            }
                          >
                            {editingMessage === message.id ? (
                              <HStack px={4} py={3} align="start">
                                <Textarea
                                  value={editText}
                                  onChange={(event) => setEditText(event.target.value)}
                                  aria-label="Edit message"
                                  size="sm"
                                  autoFocus
                                />
                                <Button
                                  variant="primary"
                                  minH="36px"
                                  onClick={() =>
                                    updateMessageMutation.mutate({
                                      messageId: message.id,
                                      content: editText,
                                    })
                                  }
                                  isLoading={updateMessageMutation.isPending}
                                >
                                  Save
                                </Button>
                                <Button
                                  variant="secondary"
                                  minH="36px"
                                  onClick={() => setEditingMessage(null)}
                                >
                                  Cancel
                                </Button>
                              </HStack>
                            ) : (
                              <MessageItem
                                message={message}
                                currentUserId={user?.uid}
                                readByCount={activeMembers.filter(
                                  (member) =>
                                    member.userId !== user?.uid &&
                                    (timestampValue(member.lastReadAt) || 0) >=
                                      (message.createdAtMs || Number.MAX_SAFE_INTEGER),
                                ).length}
                                onReply={setThreadParent}
                                onEdit={(item) => {
                                  setEditingMessage(item.id);
                                  setEditText(item.content);
                                }}
                                onDelete={deleteMessage}
                                onReact={toggleReaction}
                              />
                            )}
                          </Box>
                        ))}
                      </VStack>
                    )}
                    {typingMembers.length > 0 && (
                      <Text px={5} pb={2} color="textMuted" fontSize="xs">
                        {typingMembers.map((member) => member.displayName).join(", ")}{" "}
                        {typingMembers.length === 1 ? "is" : "are"} typing...
                      </Text>
                    )}
                    {currentUserMember?.lastReadAt && (
                      <Text px={5} color="textMuted" fontSize="10px">
                        Your read position is up to date
                      </Text>
                    )}
                    <Box ref={messagesEndRef} />
                  </Box>
                  {threadParent && (
                    <Box
                      w={{ base: "min(360px, 85vw)", xl: "360px" }}
                      flexShrink={0}
                      borderLeft="1px solid"
                      borderColor="borderSubtle"
                      display="flex"
                      flexDirection="column"
                      minH={0}
                    >
                      <HStack p={3} justify="space-between">
                        <Box>
                          <Text fontWeight="700" fontSize="sm">Thread</Text>
                          <Text color="textMuted" fontSize="xs">
                            Replying to {threadParent.senderName}
                          </Text>
                        </Box>
                        <IconButton
                          aria-label="Close thread"
                          icon={<X size={15} />}
                          size="xs"
                          variant="ghost"
                          onClick={() => setThreadParent(null)}
                        />
                      </HStack>
                      <Divider />
                      <Box flex={1} minH={0} overflowY="auto" className="app-scrollbar" py={2}>
                        <MessageItem
                          message={threadParent}
                          currentUserId={user?.uid}
                          readByCount={activeMembers.filter(
                            (member) =>
                              member.userId !== user?.uid &&
                              (timestampValue(member.lastReadAt) || 0) >=
                                (threadParent.createdAtMs || Number.MAX_SAFE_INTEGER),
                          ).length}
                          onReply={() => {}}
                          onEdit={(item) => {
                            setEditingMessage(item.id);
                            setEditText(item.content);
                          }}
                          onDelete={deleteMessage}
                          onReact={toggleReaction}
                        />
                        <Divider my={2} />
                        {(threadQuery.data || []).map((message) => (
                          <Box
                            key={message.id}
                            id={`message-${message.id}`}
                            borderRadius="control"
                            border={
                              jumpTargetId === message.id
                                ? "1px solid var(--accent-border)"
                                : "1px solid transparent"
                            }
                          >
                            <MessageItem
                              message={message}
                              currentUserId={user?.uid}
                              readByCount={activeMembers.filter(
                                (member) =>
                                  member.userId !== user?.uid &&
                                  (timestampValue(member.lastReadAt) || 0) >=
                                    (message.createdAtMs || Number.MAX_SAFE_INTEGER),
                              ).length}
                              onReply={() => {}}
                              onEdit={(item) => {
                                setEditingMessage(item.id);
                                setEditText(item.content);
                              }}
                              onDelete={deleteMessage}
                              onReact={toggleReaction}
                            />
                          </Box>
                        ))}
                      </Box>
                      {selected.currentUserIsMember && (
                        <MessageComposer
                          channelId={selected.id}
                          members={activeMembers}
                          parentMessageId={threadParent.id}
                        />
                      )}
                    </Box>
                  )}
                </Box>
                {selected.currentUserIsMember && !threadParent && (
                  <MessageComposer
                    channelId={selected.id}
                    members={activeMembers}
                  />
                )}
              </>
            )}
          </Card>
        )}
      </HStack>

      <Modal isOpen={channelDialog.isOpen} onClose={channelDialog.onClose} isCentered>
        <ModalOverlay backdropFilter="blur(8px)" />
        <ModalContent bg="surface" border="1px solid" borderColor="borderSubtle">
          <ModalHeader>Create a channel</ModalHeader>
          <ModalCloseButton />
          <Box
            as="form"
            onSubmit={(event) => {
              event.preventDefault();
              createChannelMutation.mutate({
                workspaceId: activeWorkspace.id,
                ...channelForm,
              });
            }}
          >
            <ModalBody>
              <VStack align="stretch" spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Channel name</FormLabel>
                  <Input
                    value={channelForm.name}
                    onChange={(event) =>
                      setChannelForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="e.g. product-updates"
                    maxLength={80}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Topic</FormLabel>
                  <Input
                    value={channelForm.topic}
                    onChange={(event) =>
                      setChannelForm((current) => ({
                        ...current,
                        topic: event.target.value,
                      }))
                    }
                    placeholder="What is this channel for?"
                    maxLength={280}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Visibility</FormLabel>
                  <Select
                    value={channelForm.visibility}
                    onChange={(event) =>
                      setChannelForm((current) => ({
                        ...current,
                        visibility: event.target.value,
                        memberIds: [],
                      }))
                    }
                  >
                    <option value="public">Public — anyone can join</option>
                    <option value="private">Private — invited members only</option>
                  </Select>
                </FormControl>
                {channelForm.visibility === "private" && (
                  <FormControl>
                    <FormLabel fontSize="sm">Add members</FormLabel>
                    <Select
                      multiple
                      value={channelForm.memberIds}
                      minH="100px"
                      onChange={(event) =>
                        setChannelForm((current) => ({
                          ...current,
                          memberIds: Array.from(
                            event.target.selectedOptions,
                            (option) => option.value,
                          ),
                        }))
                      }
                    >
                      {(membersQuery.data || [])
                        .filter((member) => member.userId !== user?.uid)
                        .map((member) => (
                          <option key={member.userId} value={member.userId}>
                            {member.profile?.displayName || member.profile?.email || member.userId}
                          </option>
                        ))}
                    </Select>
                    <Text mt={1} color="textMuted" fontSize="xs">
                      Use Ctrl or Command to select more than one person.
                    </Text>
                  </FormControl>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter gap={2}>
              <Button variant="secondary" onClick={channelDialog.onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={createChannelMutation.isPending}
              >
                Create channel
              </Button>
            </ModalFooter>
          </Box>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={conversationDialog.isOpen}
        onClose={conversationDialog.onClose}
        isCentered
      >
        <ModalOverlay backdropFilter="blur(8px)" />
        <ModalContent bg="surface" border="1px solid" borderColor="borderSubtle">
          <ModalHeader>New conversation</ModalHeader>
          <ModalCloseButton />
          <Box as="form" onSubmit={beginConversation}>
            <ModalBody>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Choose workspace members</FormLabel>
                <Select
                  multiple
                  value={selectedMemberIds}
                  minH="160px"
                  onChange={(event) =>
                    setSelectedMemberIds(
                      Array.from(
                        event.target.selectedOptions,
                        (option) => option.value,
                      ),
                    )
                  }
                >
                  {(membersQuery.data || [])
                    .filter((member) => member.userId !== user?.uid)
                    .map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.profile?.displayName ||
                          member.profile?.email ||
                          member.userId}
                      </option>
                    ))}
                </Select>
                <Text mt={1} color="textMuted" fontSize="xs">
                  Select one person for a direct message, or several for a group conversation.
                </Text>
              </FormControl>
            </ModalBody>
            <ModalFooter gap={2}>
              <Button variant="secondary" onClick={conversationDialog.onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={createConversationMutation.isPending}
              >
                Start conversation
              </Button>
            </ModalFooter>
          </Box>
        </ModalContent>
      </Modal>
    </VStack>
  );
}
