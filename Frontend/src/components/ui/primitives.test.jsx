import { ChakraProvider } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Activity, Bell } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dropdown,
  Input,
  SegmentedControl,
  StatCard,
  Toggle,
  Tooltip,
} from "./index.js";

function renderWithChakra(ui) {
  return render(<ChakraProvider>{ui}</ChakraProvider>);
}

describe("Emberline UI Primitives (Step 2.0)", () => {
  it("renders Button with primary and secondary variants", () => {
    const handleClick = vi.fn();
    renderWithChakra(
      <>
        <Button variant="primary" onClick={handleClick}>
          Primary Action
        </Button>
        <Button variant="secondary">Secondary Action</Button>
      </>,
    );

    const primaryBtn = screen.getByRole("button", { name: "Primary Action" });
    expect(primaryBtn).toBeInTheDocument();
    expect(primaryBtn).toHaveClass("ui-button--primary");

    fireEvent.click(primaryBtn);
    expect(handleClick).toHaveBeenCalledTimes(1);

    const secondaryBtn = screen.getByRole("button", { name: "Secondary Action" });
    expect(secondaryBtn).toBeInTheDocument();
    expect(secondaryBtn).toHaveClass("ui-button--secondary");
  });

  it("renders Input with placeholder and leading icon", () => {
    renderWithChakra(
      <Input
        placeholder="Search metrics..."
        leftElement={<Bell data-testid="bell-icon" />}
      />,
    );

    expect(screen.getByPlaceholderText("Search metrics...")).toBeInTheDocument();
    expect(screen.getByTestId("bell-icon")).toBeInTheDocument();
  });

  it("renders Badge variants with semantic styling", () => {
    renderWithChakra(
      <>
        <Badge variant="success">+12.4%</Badge>
        <Badge variant="danger">-2.7%</Badge>
        <Badge variant="accent">New</Badge>
      </>,
    );

    expect(screen.getByText("+12.4%")).toHaveClass("ui-badge--success");
    expect(screen.getByText("-2.7%")).toHaveClass("ui-badge--danger");
    expect(screen.getByText("New")).toHaveClass("ui-badge--accent");
  });

  it("renders the warning badge variant", () => {
    renderWithChakra(<Badge variant="warning">Medium priority</Badge>);

    expect(screen.getByText("Medium priority")).toHaveClass("ui-badge--warning");
  });

  it("renders Card with default and featured variants", () => {
    renderWithChakra(
      <>
        <Card data-testid="default-card">Standard Surface</Card>
        <Card variant="featured" data-testid="featured-card">
          Featured Gradient Surface
        </Card>
      </>,
    );

    expect(screen.getByTestId("default-card")).toHaveClass("ui-card--default");
    expect(screen.getByTestId("featured-card")).toHaveClass("ui-card--featured");
  });

  it("renders StatCard with value, delta pill, and attention marker", () => {
    renderWithChakra(
      <StatCard
        label="Completed issues"
        value={184}
        icon={Activity}
        trend={12.4}
        comparison="vs last month"
        attention
      />,
    );

    expect(screen.getByText("Completed issues")).toBeInTheDocument();
    expect(screen.getByText("184")).toBeInTheDocument();
    expect(screen.getByText("12.4%")).toBeInTheDocument();
    expect(screen.getByText("vs last month")).toBeInTheDocument();
    expect(screen.getByTitle("Needs attention")).toBeInTheDocument();
  });

  it("keeps the trend arrow by sign while inverting the semantic color", () => {
    renderWithChakra(
      <StatCard
        label="Average cycle time"
        value="3.2d"
        invertTrend
        trend={-8}
      />,
    );

    expect(screen.getByText("8%").closest(".ui-badge")).toHaveClass(
      "ui-badge--success",
    );
  });

  it("omits the options control when a StatCard has no actions", () => {
    renderWithChakra(<StatCard label="Open issues" value={12} />);

    expect(
      screen.queryByRole("button", { name: /options for open issues/i }),
    ).not.toBeInTheDocument();
  });

  it("renders featured StatCard with interactive toggle switch", () => {
    const handleToggle = vi.fn();
    renderWithChakra(
      <StatCard
        featured
        label="Q4 forecast"
        value="$212.4k"
        icon={Activity}
        toggleChecked
        onToggle={handleToggle}
        toggleLabel="Toggle forecast mode"
      />,
    );

    expect(screen.getByText("Q4 forecast")).toBeInTheDocument();
    expect(screen.getByText("$212.4k")).toBeInTheDocument();

    const switchBtn = screen.getByRole("switch", { name: "Toggle forecast mode" });
    expect(switchBtn).toBeInTheDocument();
    expect(switchBtn).toHaveAttribute("aria-checked", "true");
    expect(switchBtn).toHaveClass("ui-toggle--on-accent");

    fireEvent.click(switchBtn);
    expect(handleToggle).toHaveBeenCalledWith(false);
  });

  it("renders Toggle switch and changes state on click", () => {
    const handleToggle = vi.fn();
    renderWithChakra(
      <Toggle
        checked={false}
        onChange={handleToggle}
        label="Live updates"
      />,
    );

    const switchBtn = screen.getByRole("switch", { name: "Live updates" });
    expect(switchBtn).toHaveAttribute("aria-checked", "false");

    fireEvent.click(switchBtn);
    expect(handleToggle).toHaveBeenCalledWith(true);
  });

  it("renders SegmentedControl and switches active tab", () => {
    const handleChange = vi.fn();
    renderWithChakra(
      <SegmentedControl
        label="Time grain"
        value="weekly"
        onChange={handleChange}
        options={[
          { label: "Daily", value: "daily" },
          { label: "Weekly", value: "weekly" },
          { label: "Monthly", value: "monthly" },
        ]}
      />,
    );

    const weeklyTab = screen.getByRole("tab", { name: "Weekly" });
    expect(weeklyTab).toHaveAttribute("aria-selected", "true");

    const dailyTab = screen.getByRole("tab", { name: "Daily" });
    fireEvent.click(dailyTab);
    expect(handleChange).toHaveBeenCalledWith("daily");
  });

  it("renders Dropdown with items and handles selection", async () => {
    const handleSelect = vi.fn();
    renderWithChakra(
      <Dropdown
        label="All regions"
        items={[
          { label: "North America", onSelect: handleSelect },
          { label: "Europe" },
        ]}
      />,
    );

    const dropdownBtn = screen.getByRole("button", { name: "All regions" });
    expect(dropdownBtn).toBeInTheDocument();
    fireEvent.pointerDown(dropdownBtn, { pointerType: "mouse", button: 0 });
    fireEvent.click(dropdownBtn);

<<<<<<< Updated upstream
    const item = await screen.findByRole("menuitem", { name: "North America" });
=======
    const item = screen.getByText("North America");
>>>>>>> Stashed changes
    expect(item).toBeInTheDocument();
    fireEvent.click(item);
    expect(handleSelect).toHaveBeenCalledTimes(1);
  });

  it("renders Avatar with fallback initials and gradient styling", () => {
    renderWithChakra(<Avatar name="Leonhard Hopf" size="md" />);

    expect(screen.getByText("LH")).toBeInTheDocument();
  });

  it("renders Tooltip wrapping a target element", () => {
    renderWithChakra(
      <Tooltip label="Emberline tooltip info">
        <button type="button">Hover me</button>
      </Tooltip>,
    );

    expect(screen.getByRole("button", { name: "Hover me" })).toBeInTheDocument();
  });
});

