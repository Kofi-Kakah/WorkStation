import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Box, Spinner, Text, VStack } from "@chakra-ui/react";
import { useAuth } from "../contexts/useAuth.jsx";
import MainLayout from "../layouts/MainLayout.jsx";
import DashboardPage from "../features/dashboard/DashboardPage.jsx";
import HealthPage from "../features/dashboard/HealthPage.jsx";
import LoginPage from "../features/auth/LoginPage.jsx";
import RegisterPage from "../features/auth/RegisterPage.jsx";
import {
  mockProjects,
  mockIssues,
  mockChannels,
  mockNotifications,
} from "../features/dashboard/mockData.js";

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

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/health"
        element={
          <ProtectedRoute>
            <HealthPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage
              projects={mockProjects}
              issues={mockIssues}
              channels={mockChannels}
              notifications={mockNotifications}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage
              projects={mockProjects}
              issues={mockIssues}
              channels={mockChannels}
              notifications={mockNotifications}
            />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
