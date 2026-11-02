import { Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth.jsx";
import MainLayout from "../layouts/MainLayout.jsx";
import DashboardPage from "../features/dashboard/DashboardPage.jsx";
import HealthPage from "../features/dashboard/HealthPage.jsx";
import LoginPage from "../features/auth/LoginPage.jsx";
import RegisterPage from "../features/auth/RegisterPage.jsx";
import {
  mockProjects,
  mockBoards,
  mockIssues,
  mockChannels,
  mockNotifications,
} from "../features/dashboard/mockData.js";

function ProtectedRoute({ children }) {
  const { authenticated, loading } = useAuth();
  if (loading) return <div className="p-8 text-center">Loading…</div>;
  if (!authenticated) return <Navigate to="/login" replace />;
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
              boards={mockBoards}
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
              boards={mockBoards}
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
