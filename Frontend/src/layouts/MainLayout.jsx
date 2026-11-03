import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contextOpen, setContextOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contextDrawerOpen, setContextDrawerOpen] = useState(false);

  const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;
  const isCompact = useBreakpointValue({ base: true, md: false }) ?? true;
  const showContextPanel = useBreakpointValue({ base: false, xl: true }) ?? false;
  const collapsed = sidebarCollapsed || isCompact;

  useEffect(() => {
    const handleSearchShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        navigate("/search");
      }
    };
    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, [navigate]);

  const toggleContext = () => {
    if (!showContextPanel) {
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
          w={collapsed ? "68px" : "240px"}
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

          {showContextPanel && contextOpen && (
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

      {!showContextPanel && (
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
