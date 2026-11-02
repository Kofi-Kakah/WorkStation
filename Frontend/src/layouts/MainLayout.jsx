import { useState } from "react";
import {
  Box,
  Drawer,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  useBreakpointValue,
} from "@chakra-ui/react";
import Sidebar from "../components/navigation/Sidebar.jsx";
import Topbar from "../components/navigation/Topbar.jsx";
import ContextPanel from "../components/navigation/ContextPanel.jsx";

/**
 * Responsive application frame with navigation, workspace content, and context.
 *
 * @param {{ children: import('react').ReactNode, className?: string, [key: string]: any }} props
 */
export function MainLayout({ children, className = "", ...props }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contextOpen, setContextOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contextDrawerOpen, setContextDrawerOpen] = useState(false);

  const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;
  const isCompact = useBreakpointValue({ base: true, xl: false }) ?? true;
  const collapsed = sidebarCollapsed || isCompact;

  const toggleContext = () => {
    if (isCompact) {
      setContextDrawerOpen(true);
      return;
    }
    setContextOpen((open) => !open);
  };

  return (
    <Box
      className={`app-shell ${className}`}
      display="flex"
      w="full"
      h="100dvh"
      minH="0"
      overflow="hidden"
      {...props}
    >
      {!isMobile && (
        <Box
          as="aside"
          className="app-sidebar border-r"
          w={collapsed ? "68px" : "228px"}
          h="100%"
          flexShrink={0}
          overflow="hidden"
          transition="width 180ms ease"
        >
          <Sidebar
            collapsed={collapsed}
            onCollapse={
              isCompact ? undefined : () => setSidebarCollapsed((value) => !value)
            }
          />
        </Box>
      )}

      <Box
        display="flex"
        flex={1}
        flexDirection="column"
        minW="0"
        minH="0"
        overflow="hidden"
      >
        <Topbar
          onMenu={() => setMobileMenuOpen(true)}
          onToggleContext={toggleContext}
        />

        <Box display="flex" flex={1} minW="0" minH="0" overflow="hidden">
          <Box
            as="main"
            className="app-content app-scrollbar"
            flex={1}
            minW="0"
            overflowY="auto"
            px={{ base: 4, md: 6, xl: 7 }}
            py={{ base: 5, md: 7 }}
          >
            {children}
          </Box>

          {!isCompact && contextOpen && (
            <Box
              as="aside"
              className="app-sidebar border-l"
              w="286px"
              flexShrink={0}
              overflowY="auto"
            >
              <ContextPanel onClose={() => setContextOpen(false)} />
            </Box>
          )}
        </Box>
      </Box>

      {isMobile && (
        <Drawer
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          placement="left"
          size="xs"
        >
          <DrawerOverlay />
          <DrawerContent className="app-sidebar">
            <DrawerCloseButton />
            <Sidebar
              collapsed={false}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </DrawerContent>
        </Drawer>
      )}

      {isCompact && (
        <Drawer
          isOpen={contextDrawerOpen}
          onClose={() => setContextDrawerOpen(false)}
          placement="right"
          size="xs"
        >
          <DrawerOverlay />
          <DrawerContent className="app-sidebar">
            <DrawerCloseButton />
            <ContextPanel onClose={() => setContextDrawerOpen(false)} />
          </DrawerContent>
        </Drawer>
      )}
    </Box>
  );
}

export default MainLayout;
