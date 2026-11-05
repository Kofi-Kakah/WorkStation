import { lazy, Suspense } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Box, Spinner, Text, VStack } from "@chakra-ui/react";
import { useAuth } from "../contexts/useAuth.jsx";
import MainLayout from "../layouts/MainLayout.jsx";
import DashboardPage from "../features/dashboard/DashboardPage.jsx";
import LoginPage from "../features/auth/LoginPage.jsx";
import RegisterPage from "../features/auth/RegisterPage.jsx";

const HealthPage = lazy(() => import("../features/dashboard/HealthPage.jsx"));
const WorkspaceSettingsPage = lazy(
  () => import("../features/workspace/WorkspaceSettingsPage.jsx"),
);
const ProfilePage = lazy(() => import("../features/profile/ProfilePage.jsx"));
const ProjectsPage = lazy(
  () => import("../features/projects/ProjectsPage.jsx"),
);
const ProjectDetailPage = lazy(
  () => import("../features/projects/ProjectDetailPage.jsx"),
);
const InvitationResponsePage = lazy(
  () => import("../features/workspace/InvitationResponsePage.jsx"),
);
const ChatPage = lazy(() => import("../features/chat/ChatPage.jsx"));
const IssuesPage = lazy(() => import("../features/issues/IssuesPage.jsx"));
const NotificationsPage = lazy(
  () => import("../features/notifications/NotificationsPage.jsx"),
);
const BoardsPage = lazy(() => import("../features/boards/BoardsPage.jsx"));
const ProductivityPage = lazy(
  () => import("../features/productivity/ProductivityPage.jsx"),
);
const SearchPage = lazy(() => import("../features/search/SearchPage.jsx"));

function PageLoader() {
  return (
    <Box minH="40vh" display="grid" placeItems="center" role="status">
      <Spinner color="accent" />
    </Box>
  );
}

function ProtectedRoute({ children }) {
  const { authenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <Box
        className="app-shell"
        minH="100dvh"
        display="grid"
        placeItems="center"
        role="status"
      >
        <VStack spacing={3}>
          <Spinner color="amethyst.500" thickness="2px" />
          <Text
            fontSize="sm"
            color="gray.500"
            _dark={{ color: "whiteAlpha.600" }}
          >
            Loading your workspace
          </Text>
        </VStack>
      </Box>
    );
  }
  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <MainLayout>{children}</MainLayout>;
}

function ProtectedPage({ children }) {
  return (
    <ProtectedRoute>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </ProtectedRoute>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/invitations/:token"
        element={
          <ProtectedPage>
            <InvitationResponsePage />
          </ProtectedPage>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedPage>
            <ProjectsPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/boards"
        element={
          <ProtectedPage>
            <BoardsPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/issues"
        element={
          <ProtectedPage>
            <IssuesPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/issues/:issueId"
        element={
          <ProtectedPage>
            <IssuesPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedPage>
            <NotificationsPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/productivity"
        element={
          <ProtectedPage>
            <ProductivityPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedPage>
            <SearchPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/channels"
        element={
          <ProtectedPage>
            <ChatPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/dm"
        element={
          <ProtectedPage>
            <ChatPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/projects/:projectId"
        element={
          <ProtectedPage>
            <ProjectDetailPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/workspace"
        element={
          <ProtectedPage>
            <WorkspaceSettingsPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedPage>
            <ProfilePage />
          </ProtectedPage>
        }
      />
      <Route
        path="/health"
        element={
          <ProtectedPage>
            <HealthPage />
          </ProtectedPage>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
