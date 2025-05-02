import { Outlet } from 'react-router-dom';
import Footer from './footer/Footer';
import Topbar from './topbar/Topbar';

export default function Layout() {
  // Adjust these if your Topbar/Footer are a different height
  const topbarHeight = 52;
  const footerHeight = 40;

  return (
    <div className="relative min-h-screen w-full bg-gray-100 overflow-x-hidden">
      {/* Fixed Topbar */}
      <div
        className="fixed top-0 left-0 w-full z-50"
      >
        <Topbar />
      </div>
      {/* Fixed Footer */}
      <div
        className="fixed bottom-0 left-0 w-full z-50"
      >
        <Footer />
      </div>
      {/* Scrollable Content */}
      <main
        className="w-full overflow-y-auto scrollbar-hide"
        style={{
          position: 'absolute',
          top: `${topbarHeight}px`,
          bottom: `${footerHeight}px`,
          left: 0,
          right: 0,
        }}
      >
        <div className="w-full max-w-full px-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

