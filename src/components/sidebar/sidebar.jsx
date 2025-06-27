import { Home, Search, List, Info } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import SearchDrawer from './drawers/SearchDrawer';
import LocationDrawer from './drawers/LocationDrawer';
import { useMap } from '../../contexts/MapContext';

export default function Sidebar() {
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [selectedEventType, setSelectedEventType] = useState(null);
  const { setMapFocusLocation, mapFocusLocation, focusMapFn, showLoginModal, setActiveView, isSidebarExpanded, setIsSidebarExpanded, isAuthenticated } = useMap();
  const clearMapFocusTimeoutRef = useRef(null);
  const location = useLocation();

  // Set sidebar expanded by default on home page
  useEffect(() => {
    if (location.pathname === '/') {
      setIsSidebarExpanded(true);
    }
  }, [location.pathname, setIsSidebarExpanded]);

  const toggleDrawer = (drawer) => {
    if (activeDrawer === drawer) {
      setActiveDrawer(null);
      setIsSidebarExpanded(true);
    } else {
      setActiveDrawer(drawer);
      setIsSidebarExpanded(false);
    }
    if (drawer === 'search') {
      setMapFocusLocation(null);
    }
  };

  const handleEventClick = (lat, lng) => {
    if (focusMapFn) {
      focusMapFn(lat, lng);
    }
    setActiveDrawer(null);
    setIsSidebarExpanded(true);
  };

  const collapsedWidth = 'w-14';
  const expandedWidth = 'w-34';

  // Only highlight icon if drawer is active
  const iconHighlight = 'border border-black rounded-full p-1';

  return (
    <>
      <div
        className={`pt-14 h-full bg-white flex flex-col py-4 shadow-md fixed left-0 top-0 z-50 transition-all duration-500 ease-in-out overflow-hidden
          ${isSidebarExpanded ? `${expandedWidth} items-start px-4` : `${collapsedWidth} items-center px-0`}
        `}
      >
        {/* Home Link (no highlight by default) */}
        <Link 
          to="/" 
          className={`flex items-center mb-12`}
        >
          <span className={``}>
            <Home className={`text-black ${isSidebarExpanded ? 'mr-4' : 'mr-0'}`} title="Go to Home" />
          </span>
          {isSidebarExpanded && <span className="text-black font-medium whitespace-nowrap">HOME</span>}
        </Link>

        {/* Search Button */}
        <button 
          onClick={() => toggleDrawer('search')} 
          title="Search for Events" 
          className={`flex items-center mb-36 cursor-pointer`}
        >
          <span className={activeDrawer === 'search' ? iconHighlight : ''}>
            <Search className={`text-black ${isSidebarExpanded ? 'mr-4' : 'mr-0'} rotate-90`} />
          </span>
          {isSidebarExpanded && <span className="text-black font-medium whitespace-nowrap">Search</span>}
        </button>

        {/* Post Event Button */}
        <button 
          onClick={() => toggleDrawer('location')} 
          title="Post an Event" 
          className={`flex items-center cursor-pointer`}
        >
          <span className={activeDrawer === 'location' ? iconHighlight : ''}>
            <img src="/Ppoing.png" alt="Poing App Icon" className={`w-10`} />
          </span>
          {isSidebarExpanded && <span className="text-black font-medium whitespace-nowrap">Poing It</span>}
        </button>

        {/* List Button (no navigation) */}
        <button
          type="button"
          className={`flex items-center mt-36 cursor-pointer`}
        >
          <span className={activeDrawer === 'my-events' ? iconHighlight : ''}>
            <List className={`text-black ${isSidebarExpanded ? 'mr-4' : 'mr-0'}`} title="List" />
          </span>
          {isSidebarExpanded && <span className="text-black font-medium whitespace-nowrap">List</span>}
        </button>
      </div>

      {/* Drawers */}
      <SearchDrawer
        isOpen={activeDrawer === 'search'}
        onClose={() => {
          setActiveDrawer(null);
          setIsSidebarExpanded(true);
        }}
        selectedEventType={selectedEventType}
        setSelectedEventType={setSelectedEventType}
        onEventClick={handleEventClick}
      />

      <LocationDrawer
        isOpen={activeDrawer === 'location'}
        onClose={() => {
          setActiveDrawer(null);
          setIsSidebarExpanded(true);
        }}
      />
    </>
  );
}
