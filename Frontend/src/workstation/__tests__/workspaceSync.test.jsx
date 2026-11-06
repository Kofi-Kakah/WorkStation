import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { WorkspaceProvider } from "../store/WorkspaceProvider.jsx";
import { useWorkspace } from "../store/useWorkspace.js";

function Harness() {
  const { state, moveIssue, createIssueFromMessage } = useWorkspace();
  const issue = state.issues.find((item) => item.id === "ORB-138");
  const platform = state.channels.find((item) => item.id === "platform");

  return (
    <div>
      <span data-testid="status">{issue.status}</span>
      <span data-testid="issue-count">{state.issues.length}</span>
      <span data-testid="message-count">{platform.messages.length}</span>
      <span data-testid="latest-activity">{state.activity[0]?.target}</span>
      <button type="button" onClick={() => moveIssue("ORB-138", "done")}>
        move
      </button>
      <button type="button" onClick={() => createIssueFromMessage("platform", "msg-plat-1")}>
        capture
      </button>
    </div>
  );
}

function renderHarness() {
  return render(
    <WorkspaceProvider>
      <Harness />
    </WorkspaceProvider>,
  );
}

describe("workspace cross-module sync", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("moves an issue to a new workflow status from the board and logs activity", () => {
    renderHarness();

    expect(screen.getByTestId("status")).toHaveTextContent("in_review");

    fireEvent.click(screen.getByRole("button", { name: "move" }));

    expect(screen.getByTestId("status")).toHaveTextContent("done");
    expect(screen.getByTestId("latest-activity")).toHaveTextContent("ORB-138");
  });

  it("captures a Slack message as a new issue and replies in the channel", () => {
    renderHarness();

    const issuesBefore = Number(screen.getByTestId("issue-count").textContent);
    const messagesBefore = Number(screen.getByTestId("message-count").textContent);

    fireEvent.click(screen.getByRole("button", { name: "capture" }));

    expect(Number(screen.getByTestId("issue-count").textContent)).toBe(issuesBefore + 1);
    expect(Number(screen.getByTestId("message-count").textContent)).toBe(messagesBefore + 1);
  });
});
