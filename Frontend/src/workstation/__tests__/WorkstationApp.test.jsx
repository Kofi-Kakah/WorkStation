import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import WorkstationApp from "../WorkstationApp.jsx";

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <WorkstationApp />
    </MemoryRouter>,
  );
}

describe("WorkStation app shell", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders the overview with the three-module story", () => {
    renderAt("/");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("One workspace");
    expect(screen.getByText("Unified activity")).toBeInTheDocument();
    expect(screen.getAllByText(/Sprint 24/).length).toBeGreaterThan(0);
  });

  it("renders the kanban board with workflow columns", () => {
    renderAt("/boards");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Boards");
    expect(screen.getAllByText("In progress").length).toBeGreaterThan(0);
    expect(screen.getByText("Session refresh loop drops users on slow networks")).toBeInTheDocument();
  });

  it("renders the issue tracker with grouped workflow rows", () => {
    renderAt("/issues");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Issues");
    expect(screen.getByText("ORB-142")).toBeInTheDocument();
  });

  it("opens the command palette and jumps to an issue", async () => {
    renderAt("/");

    fireEvent.keyDown(window, { key: "k", metaKey: true });

    const input = await screen.findByLabelText("Search workspace");
    fireEvent.change(input, { target: { value: "ORB-142" } });

    const palette = screen.getByRole("dialog", { name: "Command palette" });
    const result = await within(palette).findByText(/Session refresh loop drops users/);
    fireEvent.click(result);

    const drawer = await screen.findByRole("dialog");
    expect(drawer).toHaveTextContent("ORB-142");
    expect(drawer).toHaveTextContent("Session refresh loop drops users on slow networks");
  });

  it("creates an issue from the create dialog", async () => {
    renderAt("/issues");

    fireEvent.click(screen.getAllByRole("button", { name: /New issue/ })[0]);
    const titleInput = await screen.findByLabelText("Title");
    fireEvent.change(titleInput, { target: { value: "Telemetry gaps in the audit log" } });
    fireEvent.click(screen.getByRole("button", { name: /Create issue/ }));

    expect(await screen.findByText("Telemetry gaps in the audit log")).toBeInTheDocument();
    expect(screen.getByText("Issue created")).toBeInTheDocument();
  });

  it("renders the pulse event stream", () => {
    renderAt("/pulse");

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Pulse");
    expect(screen.getByText("Event stream")).toBeInTheDocument();
    expect(screen.getByText("Module bridges")).toBeInTheDocument();
  });

  it("renders the channel view with a composer", () => {
    renderAt("/channels");

    expect(screen.getByPlaceholderText("Message #platform")).toBeInTheDocument();
    expect(screen.getByText(/Welcome to #platform/)).toBeInTheDocument();
  });
});
