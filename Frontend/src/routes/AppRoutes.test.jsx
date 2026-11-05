import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";

const authState = vi.hoisted(() => ({
  authenticated: false,
  loading: false,
}));

vi.mock("../contexts/useAuth.jsx", () => ({
  useAuth: () => ({ ...authState }),
  default: () => ({ ...authState }),
}));

vi.mock("../layouts/MainLayout.jsx", () => ({
  default: ({ children }) => <div data-testid="app-shell">{children}</div>,
  MainLayout: ({ children }) => <div data-testid="app-shell">{children}</div>,
}));

vi.mock("../features/dashboard/DashboardPage.jsx", () => ({
  default: () => <div>Dashboard content</div>,
}));

vi.mock("../features/auth/LoginPage.jsx", () => ({
  default: () => <div>Login page</div>,
}));

vi.mock("../features/auth/RegisterPage.jsx", () => ({
  default: () => <div>Register page</div>,
}));

import AppRoutes from "./AppRoutes.jsx";

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderApp(initialPath = "/dashboard") {
  return render(
    <ChakraProvider>
      <MemoryRouter initialEntries={[initialPath]}>
        <AppRoutes />
        <LocationProbe />
      </MemoryRouter>
    </ChakraProvider>,
  );
}

describe("AppRoutes protected routing", () => {
  beforeEach(() => {
    authState.authenticated = false;
    authState.loading = false;
  });

  it("shows the loading state while authentication resolves", () => {
    authState.loading = true;
    renderApp("/dashboard");

    expect(screen.getByText("Loading your workspace")).toBeInTheDocument();
    expect(screen.queryByTestId("app-shell")).not.toBeInTheDocument();
  });

  it("redirects unauthenticated visitors to the login page", () => {
    renderApp("/dashboard");

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/login");
    expect(screen.queryByTestId("app-shell")).not.toBeInTheDocument();
  });

  it("renders authenticated pages inside the application shell", () => {
    authState.authenticated = true;
    renderApp("/dashboard");

    expect(screen.getByTestId("app-shell")).toBeInTheDocument();
    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/dashboard");
  });

  it("redirects unknown routes to the dashboard root", () => {
    authState.authenticated = true;
    renderApp("/does-not-exist");

    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/$/);
  });
});
