import { ChakraProvider } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { DateRangeProvider, useDateRange } from "./useDateRange.js";
import PageHeader from "../components/navigation/PageHeader.jsx";

function TestConsumer() {
  const {
    preset,
    label,
    selectedProjectId,
    setPreset,
    setSelectedProjectId,
    setCustomDates,
    isInCurrentRange,
    isInPreviousRange,
    start,
    previousStart,
  } = useDateRange();
  const location = useLocation();

  return (
    <div>
      <div data-testid="preset">{preset}</div>
      <div data-testid="label">{label}</div>
      <div data-testid="project">{selectedProjectId}</div>
      <div data-testid="search">{location.search}</div>
      <div data-testid="in-current">
        {isInCurrentRange(start) ? "yes" : "no"}
      </div>
      <div data-testid="in-previous">
        {isInPreviousRange(previousStart) ? "yes" : "no"}
      </div>
      <button type="button" onClick={() => setPreset("7d")}>
        Set 7d
      </button>
      <button type="button" onClick={() => setSelectedProjectId("proj-abc")}>
        Set Project
      </button>
      <button
        type="button"
        onClick={() =>
          setCustomDates(new Date("2026-09-16"), new Date("2026-10-15"))
        }
      >
        Set Custom
      </button>
    </div>
  );
}

function renderWithProviders(ui, initialEntries = ["/"]) {
  return render(
    <ChakraProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <DateRangeProvider>{ui}</DateRangeProvider>
      </MemoryRouter>
    </ChakraProvider>,
  );
}

describe("useDateRange Hook & DateRangeProvider (Step 7.1)", () => {
  it("provides default 30d range and formats label", () => {
    renderWithProviders(<TestConsumer />);

    expect(screen.getByTestId("preset")).toHaveTextContent("30d");
    expect(screen.getByTestId("project")).toHaveTextContent("all");
    expect(screen.getByTestId("in-current")).toHaveTextContent("yes");
    expect(screen.getByTestId("in-previous")).toHaveTextContent("yes");
  });

  it("updates preset and syncs search parameters to URL", () => {
    renderWithProviders(<TestConsumer />);

    fireEvent.click(screen.getByRole("button", { name: "Set 7d" }));
    expect(screen.getByTestId("preset")).toHaveTextContent("7d");
    expect(screen.getByTestId("search")).toHaveTextContent("range=7d");
  });

  it("updates selected project and syncs to URL", () => {
    renderWithProviders(<TestConsumer />);

    fireEvent.click(screen.getByRole("button", { name: "Set Project" }));
    expect(screen.getByTestId("project")).toHaveTextContent("proj-abc");
    expect(screen.getByTestId("search")).toHaveTextContent("project=proj-abc");
  });

  it("supports custom date range and syncs from/to params", () => {
    renderWithProviders(<TestConsumer />);

    fireEvent.click(screen.getByRole("button", { name: "Set Custom" }));
    expect(screen.getByTestId("preset")).toHaveTextContent("custom");
    expect(screen.getByTestId("search")).toHaveTextContent("from=2026-09-16");
    expect(screen.getByTestId("search")).toHaveTextContent("to=2026-10-15");
    expect(screen.getByTestId("label")).toHaveTextContent("Sep 16 – Oct 15");
  });

  it("initializes from URL query parameters", () => {
    renderWithProviders(<TestConsumer />, [
      "/dashboard?range=7d&project=proj-123",
    ]);

    expect(screen.getByTestId("preset")).toHaveTextContent("7d");
    expect(screen.getByTestId("project")).toHaveTextContent("proj-123");
  });
});

describe("PageHeader Component (Step 7.1)", () => {
  it("renders title, live indicator, and actions", () => {
    const handlePrimary = vi.fn();
    const handleExport = vi.fn();

    renderWithProviders(
      <PageHeader
        title="Revenue overview"
        showProjectFilter={false}
        onPrimaryAction={handlePrimary}
        primaryActionLabel="New report"
        onExport={handleExport}
      />,
    );

    expect(screen.getByText("Revenue overview")).toBeInTheDocument();
    expect(screen.getByText(/Live · updated/i)).toBeInTheDocument();

    const exportBtn = screen.getByRole("button", { name: "Export" });
    fireEvent.click(exportBtn);
    expect(handleExport).toHaveBeenCalledTimes(1);

    const newReportBtn = screen.getByRole("button", { name: /New report/i });
    fireEvent.click(newReportBtn);
    expect(handlePrimary).toHaveBeenCalledTimes(1);
  });

  it("triggers primary action on 'C' keyboard shortcut when not typing in an input", () => {
    const handlePrimary = vi.fn();

    renderWithProviders(
      <PageHeader
        title="Revenue overview"
        showProjectFilter={false}
        onPrimaryAction={handlePrimary}
        primaryActionShortcut="C"
      />,
    );

    fireEvent.keyDown(window, { key: "c" });
    expect(handlePrimary).toHaveBeenCalledTimes(1);
  });
});

