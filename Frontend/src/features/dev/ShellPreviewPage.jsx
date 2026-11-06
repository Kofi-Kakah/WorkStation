import { useMemo, useState } from "react";
import { Box, Text } from "@chakra-ui/react";
import AuthContext from "../../contexts/AuthContext.jsx";
import MainLayout from "../../layouts/MainLayout.jsx";

const PREVIEW_WORKSPACES = [
  { id: "preview-workspace-1", name: "Acme Studio" },
  { id: "preview-workspace-2", name: "Orbit Labs" },
];

/**
 * Dev-only harness for visually checking the application shell without
 * connecting to Firebase or the API. Not reachable in production builds.
 */
export default function ShellPreviewPage() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(
    PREVIEW_WORKSPACES[0].id,
  );

  const authValue = useMemo(
    () => ({
      user: { uid: "preview-user" },
      profile: { displayName: "Avery Quinn", photoURL: "" },
      loading: false,
      authenticated: true,
      workspaces: PREVIEW_WORKSPACES,
      activeWorkspace:
        PREVIEW_WORKSPACES.find(
          (workspace) => workspace.id === activeWorkspaceId,
        ) || null,
      activeWorkspaceId,
      selectWorkspace: setActiveWorkspaceId,
      getIdToken: async () => "preview-token",
    }),
    [activeWorkspaceId],
  );

  return (
    <AuthContext.Provider value={authValue}>
      <MainLayout>
        <Box className="ui-card" p={6} maxW="620px">
          <Text fontSize="lg" fontWeight="600" color="textPrimary">
            Shell preview
          </Text>
          <Text mt={2} fontSize="sm" color="textSecondary">
            Dev-only harness for checking navigation, the top bar, and the
            contextual panel against the Emberline reference. Product screens
            render here once they are migrated.
          </Text>
        </Box>
      </MainLayout>
    </AuthContext.Provider>
  );
}
