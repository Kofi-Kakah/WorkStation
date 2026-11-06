import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "./DashboardPage.jsx";
import { api } from "../../services/apiClient.js";

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock("../../services/apiClient.js", () => ({
  api: { get: vi.fn() },
}));

vi.mock("../../contexts/useAuth.jsx", () => ({
  useAuth: () => ({
    activeWorkspace: { id: "ws-1", name: "Acme Studio" },
  }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigate };
});

function isoInDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const ISSUES = [
  {
    id: "i1",
    issueKey: "ENG-1",
    title: "Fix login redirect",
    status: "todo",
    priority: "high",
    assigneeId: "u1",
    dueDate: isoInDays(2),
  },
  {
    id: "i2",
    issueKey: "ENG-2",
    title: "Add audit log",
    status: "in_progress",
    priority: "medium",
    assigneeId: "u2",
    dueDate: isoInDays(20),
  },
  {
    id: "i3",
    issueKey: "ENG-3",
    title: "Polish empty states",
    status: "in_review",
    priority: "low",
    assigneeId: "u1",
    dueDate: null,
  },
  {
    id: "i4",
    issueKey: "ENG-4",
    title: "Ship onboarding",
    status: "backlog",
    priority: "medium",
    assigneeId: null,
    dueDate: isoInDays(3),
  },
  {
    id: "i5",
    issueKey: "ENG-5",
    title: "Set up CI",
    status: "done",
    priority: "high",
    assigneeId: "u2",
    dueDate: null,
  },
  {
    id: "i6",
    issueKey: "ENG-6",
    title: "Write docs",
    status: "done",
    priority: "low",
    assigneeId: null,
    dueDate: null,
  },
];

const ANALYTICS = {
  summary: {
    projectCount: 2,
    totalIssues: 6,
    completedIssues: 2,
    activeIssues: 4,
    overdueIssues: 0,
    dueSoonIssues: 2,
  },
  statusCounts: {
    backlog: 1,
    todo: 1,
    in_progress: 1,
    in_review: 1,
    done: 2,
  },
  workload: [],
  projects: [
    {
      id: "p1",
      name: "Platform",
      totalIssues: 3,
      completedIssues: 1,
      activeIssues: 2,
    },
    {
      id: "p2",
      name: "Mobile",
      totalIssues: 3,
      completedIssues: 1,
      activeIssues: 2,
    },
  ],
  issues: ISSUES,
};

const CHANNELS = [
  {
    id: "c1",
    name: "general",
    visibility: "public",
    topic: "Team-wide updates",
  },
  {
    id: "c2",
    name: "leads",
    visibility: "private",
    topic: "Leads only",
  },
];

const MEMBERS = [
  { userId: "u1", profile: { displayName: "Avery Quinn" } },
  { userId: "u2", profile: { displayName: "Riley Chen" } },
];

function mockApiSuccess() {
  api.get.mockImplementation((path) => {
    if (path.startsWith("/analytics/workspace")) {
      return Promise.resolve({ analytics: ANALYTICS });
    }
    if (path.startsWith("/channels")) {
      return Promise.resolve({ channels: CHANNELS });
    }
    if (path.includes("/members")) {
      return Promise.resolve({ members: MEMBERS });
    }
    return Promise.reject(new Error(`Unexpected request: ${path}`));
  });
}

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <ChakraProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>
    </ChakraProvider>,
  );
}

async function openCardMenu(label) {
  fireEvent.click(
    screen.getByRole("button", { name: `Options for ${label}` }),
  );
  return screen.findByRole("menu");
}

describe("DashboardPage", () => {
  beforeEach(() => {
    localStorage.clear();
    navigate.mockReset();
    api.get.mockReset();
    mockApiSuccess();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders every metric and caption from the workspace analytics API", async () => {
    renderDashboard();

    expect(await screen.findByLabelText("Open issues: 4")).toBeInTheDocument();
    expect(screen.getByLabelText("Active channels: 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Assigned issues: 4")).toBeInTheDocument();
    expect(screen.getByLabelText("Project progress: 33%")).toBeInTheDocument();

    expect(screen.getByText("2 due this week")).toBeInTheDocument();
    expect(screen.getByText("1 public · 1 private")).toBeInTheDocument();
    expect(screen.getByText("2 unassigned")).toBeInTheDocument();
    expect(screen.getByText("2 projects · 2/6 done")).toBeInTheDocument();

    expect(screen.getAllByText("Backlog").length).toBeGreaterThan(0);
    expect(screen.getByText("Platform")).toBeInTheDocument();
    expect(screen.getByText("Mobile")).toBeInTheDocument();
    expect(screen.getAllByText("Fix login redirect").length).toBeGreaterThan(0);
    expect(screen.getByText("ENG-1 · Avery Quinn")).toBeInTheDocument();
  });

  it("hides a metric card and restores it from the customize panel", async () => {
    renderDashboard();
    await screen.findByLabelText("Open issues: 4");

    await openCardMenu("Open issues");
    fireEvent.click(screen.getByRole("menuitem", { name: "Hide card" }));

    await waitFor(() => {
      expect(screen.queryByLabelText("Open issues: 4")).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(
        JSON.parse(
          localStorage.getItem("workstation-dashboard-widgets-v2") || "{}",
        )["ws-1"],
      ).toContain("openIssues");
    });

    fireEvent.click(screen.getByRole("button", { name: "Customize" }));
    const toggle = screen.getByRole("switch", {
      name: "Show Open issues widget",
    });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    fireEvent.click(toggle);
    await waitFor(() => {
      expect(screen.getByLabelText("Open issues: 4")).toBeInTheDocument();
    });
  });

  it("opens the issues list from the Open issues card menu", async () => {
    renderDashboard();
    await screen.findByLabelText("Open issues: 4");

    await openCardMenu("Open issues");
    fireEvent.click(screen.getByRole("menuitem", { name: "View details" }));

    expect(navigate).toHaveBeenCalledWith("/issues");
  });

  it("exports open issues as CSV from the card menu", async () => {
    const createObjectURL = vi.fn(() => "blob:dashboard");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    renderDashboard();
    await screen.findByLabelText("Open issues: 4");

    await openCardMenu("Open issues");
    fireEvent.click(screen.getByRole("menuitem", { name: "Export CSV" }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect(anchorClick).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:dashboard");
  });

  it("reports analytics failures and retries on request", async () => {
    api.get.mockImplementation((path) => {
      if (path.startsWith("/analytics/workspace")) {
        return Promise.reject(new Error("Analytics service offline"));
      }
      if (path.startsWith("/channels")) {
        return Promise.resolve({ channels: CHANNELS });
      }
      return Promise.resolve({ members: MEMBERS });
    });

    renderDashboard();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Workspace analytics are unavailable");
    expect(alert).toHaveTextContent("Analytics service offline");
    expect(screen.getByText("Failed to load Open issues")).toBeInTheDocument();

    const analyticsCalls = () =>
      api.get.mock.calls.filter(([path]) =>
        path.startsWith("/analytics/workspace"),
      ).length;
    const before = analyticsCalls();

    fireEvent.click(within(alert).getByRole("button", { name: "Try again" }));

    await waitFor(() => {
      expect(analyticsCalls()).toBeGreaterThan(before);
    });
  });
});
