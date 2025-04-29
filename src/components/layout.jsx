import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar/sidebar';

export default function Layout() {
  return (
    <div className="flex h-screen w-screen">
      {/* Sidebar on the left */}
      <Sidebar />

      {/* Main page content */}
      <div className="flex-1 h-screen p-6 bg-gray-100 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
  
