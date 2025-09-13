import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Footer from './footer/Footer';
import Topbar from './topbar/Topbar';
import Sidebar from './sidebar/sidebar';
import { useMap } from '../contexts/MapContext';
import { useModal } from '../contexts/ModalContext';
import MediaDetail from './mediaContent/mediaDetail/MediaDetail';
import ReportModal from './modals/ReportModal';

function LayoutContent() {
  const topbarHeight = 52;
  const footerHeight = 40;
  const collapsedSidebarWidth = 56; // w-14 in Tailwind
  const expandedSidebarWidth = 136; // w-34 in Tailwind
  const sidebarGap = 16; // Proper gap between sidebar and main content

  const { modalEventId, setModalEventId, reportModalOpen, reportEventId, closeReportModal } = useModal();
  
  // Track screen size for responsive layout
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main content positioning: on mobile use collapsed sidebar width, on desktop use expanded
  const mainContentLeft = isMobile ? collapsedSidebarWidth + sidebarGap : expandedSidebarWidth + sidebarGap;

  return (
    <div className="relative min-h-screen w-full bg-gray-100 overflow-hidden">
      {/* Fixed Topbar */}
      <div className="fixed top-0 left-0 w-full z-[50]">
        <Topbar />
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 w-full z-[50]">
        <Footer />
      </div>

      {/* Fixed Sidebar (overlays when expanded) */}
      <div
        className="fixed top-0 left-0 z-[50] transition-all duration-300 ease-in-out"
        style={{ 
          top: `${topbarHeight}px`, 
          bottom: `${footerHeight}px`, 
          width: `${isMobile ? collapsedSidebarWidth : expandedSidebarWidth}px`,
          pointerEvents: 'auto',
        }}
      >
        <Sidebar />
      </div>

      {/* Scrollable Content (map) - always starts after collapsed sidebar width + gap */}
      <main
        className="overflow-y-auto overflow-x-hidden scrollbar-hide transition-all duration-300 ease-in-out"
        style={{
          position: 'absolute',
          top: `${topbarHeight}px`,
          bottom: `${footerHeight}px`,
          left: `${mainContentLeft}px`,
          right: 0,
          width: `calc(100% - ${mainContentLeft}px)`,
          transition: 'all 300ms ease-in-out'
        }}
      >
        <div className="w-full h-full">
          <Outlet />
        </div>
      </main>

      {/* Global Event Detail Modal */}
      {modalEventId && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/15 backdrop-blur-sm"
          onClick={() => setModalEventId(null)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-0 relative"
            onClick={e => e.stopPropagation()}
          >
            <MediaDetail
              eventId={modalEventId}
              isModal={true}
              onClose={() => setModalEventId(null)}
            />
          </div>
        </div>
      )}

      {/* Global Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={closeReportModal}
        eventId={reportEventId}
      />

    </div>
  );
}

export default function Layout() {
  return (
    <LayoutContent />
  );
}
