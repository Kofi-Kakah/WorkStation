import { useEffect, useState } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button as ChakraButton,
  Heading,
  HStack,
  Icon,
  Spinner,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Settings2,
  Smartphone,
} from "lucide-react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import { useAuth } from "../../contexts/useAuth.jsx";
import { api } from "../../services/apiClient.js";
import {
  removePushRegistration,
  requestPushPermissionAndToken,
  subscribeToForegroundPush,
} from "../../services/pushNotifications.js";

const PAGE_SIZE = 20;

function displayDate(value) {
  if (!value) return "Just now";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function safeInternalLink(link) {
  return typeof link === "string" && link.startsWith("/") && !link.startsWith("//")
    ? link
    : null;
}

function ActivityItem({ activity }) {
  const actor = activity.actorName || "A teammate";
  const resource =
    activity.resource?.key || activity.resource?.name || activity.resource?.id;
  const summary = {
    "issue.created": "created an issue",
    "issue.created_from_message": "created an issue from a conversation",
    "issue.status_changed": "changed an issue status",
    "issue.assignee_changed": "changed an issue assignee",
  }[activity.action] || activity.action?.replaceAll(".", " ") || "updated a resource";

  return (
    <HStack align="start" spacing={3} py={3}>
      <Box
        display="grid"
        placeItems="center"
        w="34px"
        h="34px"
        flexShrink={0}
        borderRadius="full"
        bg="accentSoft"
        color="accent"
      >
        <Bell size={15} />
      </Box>
      <Box minW="0" flex={1}>
        <Text fontSize="sm" color="textPrimary">
          <Text as="span" fontWeight="600">{actor}</Text>{" "}
          {summary}
          {resource ? `: ${resource}` : ""}
        </Text>
        <Text mt={1} color="textMuted" fontSize="xs">
          {displayDate(activity.createdAt)}
        </Text>
      </Box>
    </HStack>
  );
}

export default function NotificationsPage() {
  const { activeWorkspace, profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [pageError, setPageError] = useState("");
  const [busyPreference, setBusyPreference] = useState("");
  const preferences = {
    inApp: true,
    push: true,
    ...profile?.notificationPreferences,
  };

  const notificationsQuery = useInfiniteQuery({
    queryKey: ["notifications", "list"],
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (pageParam) params.set("cursor", pageParam);
      return api.get(`/notifications?${params.toString()}`);
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
  });
  const activitiesQuery = useInfiniteQuery({
    queryKey: ["activities", activeWorkspace?.id],
    enabled: Boolean(activeWorkspace?.id),
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        workspaceId: activeWorkspace.id,
        limit: String(PAGE_SIZE),
      });
      if (pageParam) params.set("cursor", pageParam);
      return api.get(`/activities?${params.toString()}`);
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
  });
  const notifications =
    notificationsQuery.data?.pages.flatMap((page) => page.items || []) || [];
  const activities =
    activitiesQuery.data?.pages.flatMap((page) => page.items || []) || [];
  const unreadCount =
    notificationsQuery.data?.pages[0]?.unreadCount ?? 0;

  useEffect(() => {
    let active = true;
    let unsubscribe;
    subscribeToForegroundPush(() => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    })
      .then((cleanup) => {
        if (active) unsubscribe = cleanup;
        else cleanup();
      })
      .catch((error) => {
        if (active) {
          setPageError(
            error.message || "Foreground push messages could not be enabled.",
          );
        }
      });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [queryClient]);

  const markRead = async (notificationId) => {
    try {
      await api.post(`/notifications/${notificationId}/read`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        queryClient.invalidateQueries({
          queryKey: ["notifications", "unread-count"],
        }),
      ]);
    } catch (error) {
      setPageError(error.message || "Notification could not be marked as read.");
      throw error;
    }
  };

  const markAllRead = async () => {
    setPageError("");
    try {
      await api.post("/notifications/read-all");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notifications"] }),
        queryClient.invalidateQueries({
          queryKey: ["notifications", "unread-count"],
        }),
      ]);
    } catch (error) {
      setPageError(error.message || "Notifications could not be marked as read.");
    }
  };

  const openNotification = async (notification) => {
    if (!notification.read) {
      try {
        await markRead(notification.id);
      } catch {
        return;
      }
    }
    const link = safeInternalLink(notification.link);
    if (link) navigate(link);
  };

  const savePreference = async (key, value) => {
    setBusyPreference(key);
    setPageError("");
    try {
      await api.patch("/users/me", {
        notificationPreferences: { [key]: value },
      });
      await refreshProfile();
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      setPageError(error.message || "Notification preferences could not be saved.");
    } finally {
      setBusyPreference("");
    }
  };

  const togglePush = async (enabled) => {
    setBusyPreference("push");
    setPageError("");
    try {
      if (enabled) {
        const token = await requestPushPermissionAndToken();
        await api.patch("/users/me", {
          notificationPreferences: { push: true },
        });
        await api.post("/notifications/devices", {
          token,
          userAgent: navigator.userAgent,
        });
      } else {
        await api.patch("/users/me", {
          notificationPreferences: { push: false },
        });
        await removePushRegistration();
      }
      await refreshProfile();
    } catch (error) {
      setPageError(error.message || "Push notification settings could not be updated.");
      if (enabled) {
        try {
          await api.patch("/users/me", {
            notificationPreferences: { push: false },
          });
          await refreshProfile();
        } catch (rollbackError) {
          setPageError(
            `${error.message || "Push registration failed."} The preference could not be rolled back: ${rollbackError.message || "request failed"}`,
          );
        }
      }
    } finally {
      setBusyPreference("");
    }
  };

  const queryError =
    notificationsQuery.error?.message || activitiesQuery.error?.message;

  return (
    <VStack align="stretch" spacing={5} maxW="1000px" mx="auto">
      <HStack
        justify="space-between"
        align={{ base: "flex-start", sm: "center" }}
        flexWrap="wrap"
        gap={3}
      >
        <Box>
          <Text
            color="textMuted"
            fontSize="xs"
            fontWeight="700"
            letterSpacing="0.12em"
            textTransform="uppercase"
          >
            Workspace updates
          </Text>
          <Heading mt={2} fontSize={{ base: "2xl", md: "3xl" }}>
            Notifications
          </Heading>
          <Text mt={2} color="textSecondary">
            {unreadCount} unread notifications and recent team activity.
          </Text>
        </Box>
        <ChakraButton
          variant="outline"
          leftIcon={<CheckCheck size={15} />}
          onClick={markAllRead}
          isDisabled={!unreadCount}
        >
          Mark all read
        </ChakraButton>
      </HStack>

      {(pageError || queryError) && (
        <Alert status="error" borderRadius="control">
          <AlertIcon />
          {pageError || queryError}
        </Alert>
      )}

      <Card className="p-4 sm:p-5">
        <HStack align="start" spacing={3} mb={4}>
          <Icon as={Settings2} color="accent" boxSize={5} mt={1} />
          <Box>
            <Heading size="sm">Notification preferences</Heading>
            <Text mt={1} color="textMuted" fontSize="sm">
              Choose how WorkStation delivers updates to you.
            </Text>
          </Box>
        </HStack>
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between" gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight="600">In-app notifications</Text>
              <Text mt={1} color="textMuted" fontSize="xs">
                Keep updates in your notification center.
              </Text>
            </Box>
            <Switch
              aria-label="Enable in-app notifications"
              isChecked={preferences.inApp}
              isDisabled={busyPreference === "inApp"}
              onChange={(event) => savePreference("inApp", event.target.checked)}
              colorScheme="purple"
            />
          </HStack>
          <HStack justify="space-between" gap={4}>
            <Box>
              <HStack spacing={2}>
                <Icon as={Smartphone} color="textMuted" boxSize={4} />
                <Text fontSize="sm" fontWeight="600">Browser push notifications</Text>
              </HStack>
              <Text mt={1} color="textMuted" fontSize="xs">
                Requires browser permission and the Firebase web push key.
              </Text>
            </Box>
            <Switch
              aria-label="Enable browser push notifications"
              isChecked={preferences.push}
              isDisabled={busyPreference === "push"}
              onChange={(event) => togglePush(event.target.checked)}
              colorScheme="purple"
            />
          </HStack>
        </VStack>
      </Card>

      <Tabs colorScheme="purple" isLazy>
        <TabList>
          <Tab>Notifications</Tab>
          <Tab>Activity</Tab>
        </TabList>
        <TabPanels>
          <TabPanel px={0}>
            <Card className="p-4 sm:p-5">
              {notificationsQuery.isPending ? (
                <Box py={10} textAlign="center">
                  <Spinner color="accent" />
                </Box>
              ) : notifications.length ? (
                <VStack align="stretch" divider={<Box borderTop="1px solid" borderColor="borderSubtle" />}>
                  {notifications.map((notification) => (
                    <HStack
                      key={notification.id}
                      as="button"
                      type="button"
                      w="full"
                      textAlign="left"
                      align="start"
                      spacing={3}
                      py={3}
                      borderRadius="control"
                      bg={notification.read ? "transparent" : "accentSoft"}
                      px={3}
                      cursor="pointer"
                      onClick={() => openNotification(notification)}
                      _hover={{ bg: "surfaceRaised" }}
                    >
                      <Box
                        display="grid"
                        placeItems="center"
                        w="36px"
                        h="36px"
                        flexShrink={0}
                        borderRadius="full"
                        bg="surfaceRaised"
                        color="accent"
                      >
                        <Bell size={16} />
                      </Box>
                      <Box minW="0" flex={1}>
                        <HStack spacing={2} flexWrap="wrap">
                          <Text fontSize="sm" fontWeight="600">
                            {notification.title || "WorkStation update"}
                          </Text>
                          {!notification.read && (
                            <Badge colorScheme="purple" borderRadius="full">
                              New
                            </Badge>
                          )}
                        </HStack>
                        {notification.body && (
                          <Text mt={1} color="textSecondary" fontSize="sm">
                            {notification.body}
                          </Text>
                        )}
                        <Text mt={1} color="textMuted" fontSize="xs">
                          {displayDate(notification.createdAt)}
                        </Text>
                      </Box>
                      {safeInternalLink(notification.link) && (
                        <Icon as={ExternalLink} color="textMuted" boxSize={4} />
                      )}
                    </HStack>
                  ))}
                </VStack>
              ) : (
                <Box py={10} textAlign="center">
                  <Icon as={Bell} boxSize={6} color="textMuted" />
                  <Text mt={3} fontWeight="600">You’re all caught up</Text>
                  <Text mt={1} color="textMuted" fontSize="sm">
                    New assignments and updates will appear here.
                  </Text>
                </Box>
              )}
              {notificationsQuery.hasNextPage && (
                <ChakraButton
                  mt={4}
                  variant="outline"
                  onClick={() => notificationsQuery.fetchNextPage()}
                  isLoading={notificationsQuery.isFetchingNextPage}
                >
                  Load more notifications
                </ChakraButton>
              )}
            </Card>
          </TabPanel>
          <TabPanel px={0}>
            <Card className="p-4 sm:p-5">
              {!activeWorkspace ? (
                <Text color="textMuted" fontSize="sm">
                  Select a workspace to view its activity.
                </Text>
              ) : activitiesQuery.isPending ? (
                <Box py={10} textAlign="center">
                  <Spinner color="accent" />
                </Box>
              ) : activities.length ? (
                <VStack
                  align="stretch"
                  divider={<Box borderTop="1px solid" borderColor="borderSubtle" />}
                >
                  {activities.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </VStack>
              ) : (
                <Box py={10} textAlign="center">
                  <Text fontWeight="600">No activity yet</Text>
                  <Text mt={1} color="textMuted" fontSize="sm">
                    Relevant workspace events will show up here.
                  </Text>
                </Box>
              )}
              {activitiesQuery.hasNextPage && (
                <ChakraButton
                  mt={4}
                  variant="outline"
                  onClick={() => activitiesQuery.fetchNextPage()}
                  isLoading={activitiesQuery.isFetchingNextPage}
                >
                  Load more activity
                </ChakraButton>
              )}
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
}
