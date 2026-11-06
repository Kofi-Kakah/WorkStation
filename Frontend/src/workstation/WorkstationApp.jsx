import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { WorkspaceProvider } from "./store/WorkspaceProvider.jsx";
import { UiProvider } from "./store/UiProvider.jsx";
import { useUi } from "./store/useUi.js";
import Shell from "./components/Shell.jsx";
import CommandPalette from "./components/CommandPalette.jsx";
import IssueDrawer from "./components/IssueDrawer.jsx";
import CreateIssueModal from "./components/CreateIssueModal.jsx";
import { Toasts } from "./components/ui.jsx";
import OverviewPage from "./pages/OverviewPage.jsx";
import BoardsPage from "./pages/BoardsPage.jsx";
import IssuesPage from "./pages/IssuesPage.jsx";
import ChannelsPage from "./pages/ChannelsPage.jsx";
import PulsePage from "./pages/PulsePage.jsx";

function ShellLayout() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}

function GlobalShortcuts() {
  const { setPaletteOpen, openCreateIssue } = useUi();
  const navigate = useNavigate();

  useEffect(() => {
    let pendingG = false;
    let gTimer = null;

    const isTyping = (target) =>
      target &&
      (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
        target.isContentEditable);

    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTyping(event.target)) return;

      if (pendingG) {
        const routes = {
          b: "/boards",
          i: "/issues",
          c: "/channels",
          p: "/pulse",
          o: "/",
        };
        const target = routes[event.key.toLowerCase()];
        pendingG = false;
        if (target) {
          event.preventDefault();
          navigate(target);
        }
        return;
      }

      if (event.key.toLowerCase() === "g") {
        pendingG = true;
        clearTimeout(gTimer);
        gTimer = setTimeout(() => {
          pendingG = false;
        }, 900);
        return;
      }

      if (event.key.toLowerCase() === "c") {
        event.preventDefault();
        openCreateIssue({});
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(gTimer);
    };
  }, [navigate, openCreateIssue, setPaletteOpen]);

  return null;
}

function WorkspaceFrame() {
  return (
    <>
      <GlobalShortcuts />
      <Routes>
        <Route element={<ShellLayout />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/boards" element={<BoardsPage />} />
          <Route path="/issues" element={<IssuesPage />} />
          <Route path="/channels" element={<ChannelsPage />} />
          <Route path="/pulse" element={<PulsePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <IssueDrawer />
      <CreateIssueModal />
      <CommandPalette />
      <Toasts />
    </>
  );
}

export default function WorkstationApp() {
  return (
    <WorkspaceProvider>
      <UiProvider>
        <WorkspaceFrame />
      </UiProvider>
    </WorkspaceProvider>
  );
}
