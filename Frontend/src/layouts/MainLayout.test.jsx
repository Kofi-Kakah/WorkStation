import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MainLayout from "./MainLayout.jsx";

const auth = vi.hoisted(() => ({
  state: {
    workspaces: [{ id: "workspace-1", name: "Alpha Workspace" }],
    activeWorkspace: { id: "workspace-1", name: "Alpha Workspace" },
    selectWorkspace: vi.fn(),
    profile: { displayName: "Jordan Member" },
    user: { uid: "member-1" },
  },
}));

vi.mock("../contexts/useAuth.jsx", () => ({
  useAuth: () => auth.state,
}));

vi.mock("../services/apiClient.js", () => ({
  api: {
    get: vi.fn(async () => ({ unreadCount: 3 })),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="path">{location.pathname}</span>;
}

function setViewport(width) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
}

function renderLayout(path = "/dashboard") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <ChakraProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <MainLayout>
            <div>Content area</div>
          </MainLayout>
          <LocationProbe />
        </MemoryRouter>
      </QueryClientProvider>
    </ChakraProvider>,
  );
}

describe("MainLayout responsive shell", () => {
  beforeEach(() => {
    auth.state.selectWorkspace.mockClear();
  });

  it("renders persistent navigation and the context panel on desktop", async () => {
    setViewport(1440);
    renderLayout();

    expect(
      screen.getByRole("navigation", { name: "Workspace navigation" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Nothing selected yet")).toBeVisible();
    expect(screen.getByText("Content area")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Collapse sidebar" }),
    ).toBeVisible();
    expect(
      await screen.findByRole("button", { name: /Notifications, 3 unread/ }),
    ).toBeVisible();
    expect(await screen.findByTestId("notification-dot")).toBeVisible();
  });

  it("marks the active route and navigates from the breadcrumb parent", async () => {
    setViewport(1440);
    renderLayout("/projects");

    expect(screen.getByRole("button", { name: "Projects" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    fireEvent.click(screen.getByRole("button", { name: "Workspace" }));

    await waitFor(() => {
      expect(screen.getByTestId("path")).toHaveTextContent("/dashboard");
    });
  });

  it("collapses navigation sections", () => {
    setViewport(1440);
    renderLayout();

    fireEvent.click(screen.getByRole("button", { name: "Insights" }));

    expect(
      screen.queryByRole("button", { name: "Projects" }),
    ).not.toBeInTheDocument();
  });

  it("collapses and restores the desktop sidebar", async () => {
    setViewport(1440);
    renderLayout();

    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));

    expect(
      screen.getByRole("button", { name: "Expand sidebar" }),
    ).toBeVisible();
    expect(screen.queryByText("Tools")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }));

    expect(
      screen.getByRole("button", { name: "Collapse sidebar" }),
    ).toBeVisible();
    expect(screen.getByText("Tools")).toBeVisible();
  });

  it("uses a navigation drawer and closes it after navigating on mobile", async () => {
    setViewport(375);
    renderLayout();

    expect(
      screen.queryByRole("navigation", { name: "Workspace navigation" }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Open workspace navigation" }),
    );

    const navigation = await screen.findByRole("navigation", {
      name: "Workspace navigation",
    });
    expect(navigation).toBeVisible();
    expect(screen.getByText("Alpha Workspace")).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: "Productivity" }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("path")).toHaveTextContent("/productivity");
    });
  });

  it("opens the contextual panel in a drawer on mobile", async () => {
    setViewport(375);
    renderLayout();

    expect(screen.queryByText("Nothing selected yet")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Toggle workspace context" }),
    );

    expect(await screen.findByText("Nothing selected yet")).toBeVisible();
    expect(
      screen.getByText(
        "Select an issue, card, or conversation to see its details here.",
      ),
    ).toBeVisible();
  });
});
