import { useState } from 'react';
import { Box, useBreakpointValue, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton } from '@chakra-ui/react';
import Sidebar from '../components/navigation/Sidebar.jsx';
import Topbar from '../components/navigation/Topbar.jsx';
import ContextPanel from '../components/navigation/ContextPanel.jsx';

/**
 * Main application shell.
 *
 * Desktop: persistent sidebar + main content + collapsible right context panel.
 * Tablet: collapsible sidebar, context panel as a drawer.
 * Mobile: sidebar as a drawer, full-screen content.
 *
 * @param {{ children: import('react').ReactNode, className?: string, [key: string]: any }} props
 */
export function MainLayout({ children, className = '', ...props }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contextOpen, setContextOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isMobile = useBreakpointValue({ base: true, md: false });
  const isTablet = useBreakpointValue({ base: false, md: true, lg: false });

  const sidebarWidth = sidebarCollapsed ? '64px' : '240px';
  const contextWidth = '320px';

  return (
    <Box className={`flex flex-col h-screen overflow-hidden ${className}`} {...props}>
      <Topbar onMenu={() => setMobileMenuOpen(true)} />

      <Box className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        {!isMobile && !isTablet && (
          <Box w={sidebarWidth} flexShrink={0}>
            <Sidebar
              collapsed={sidebarCollapsed}
              onCollapse={() => setSidebarCollapsed((c) => !c)}
            />
          </Box>
        )}

        {/* Tablet collapsible sidebar */}
        {isTablet && (
          <Box w={sidebarCollapsed ? '64px' : sidebarWidth} flexShrink={0}>
            <Sidebar
              collapsed={sidebarCollapsed}
              onCollapse={() => setSidebarCollapsed((c) => !c)}
            />
          </Box>
        )}

        {/* Mobile sidebar drawer */}
        {isMobile && (
          <Drawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} placement="left" size="xs">
            <DrawerOverlay />
            <DrawerContent>
              <DrawerCloseButton />
              <Sidebar collapsed={false} />
            </DrawerContent>
          </Drawer>
        )}

        {/* Main content */}
        <Box
          flex={1}
          overflowY="auto"
          p={4}
          ml={isMobile || isTablet ? 0 : sidebarCollapsed ? '64px' : sidebarWidth}
          mr={contextOpen && !isMobile ? contextWidth : 0}
          transition="margin 0.2s"
        >
          {children}
        </Box>

        {/* Context panel — desktop/tablet */}
        {contextOpen && !isMobile && (
          <Box
            className="glass-surface"
            w={contextWidth}
            flexShrink={0}
            borderLeftWidth="1px"
            borderColor="blackAlpha.200"
            _dark={{ borderColor: 'whiteAlpha.100' }}
            overflowY="auto"
          >
            <ContextPanel onClose={() => setContextOpen(false)} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default MainLayout;