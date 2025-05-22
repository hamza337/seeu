import { Home, Search, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useRef } from 'react';
import SearchDrawer from './drawers/SearchDrawer';
import LocationDrawer from './drawers/LocationDrawer';
import { useMap } from '../../contexts/MapContext';

export default function Sidebar() {
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [selectedEventType, setSelectedEventType] = useState(null);
  const { setMapFocusLocation, mapFocusLocation, focusMapFn, showLoginModal } = useMap();
  const clearMapFocusTimeoutRef = useRef(null);

  const toggleDrawer = (drawer) => {
    setActiveDrawer((prev) => (prev === drawer ? null : drawer));

    // Clear map focus only when opening the search drawer
    if (drawer === 'search') {
      console.log('Opening search drawer, clearing map focus.');
      setMapFocusLocation(null);
    }
  };

  const handleEventClick = (lat, lng) => {
    console.log('handleEventClick called with:', { lat, lng });
    console.log('Value of focusMapFn in Sidebar:', focusMapFn);
    console.log('Calling focusMapFn.');
    if (focusMapFn) {
      focusMapFn(lat, lng);
    }
    setActiveDrawer(null);
  };

  return (
    <>
      {/* Fixed Sidebar */}
      <div className={` pt-14 h-full w-14 bg-white flex flex-col items-center py-4 shadow-md fixed left-0 top-0 z-50 transition-opacity duration-300`}>
        <Link to="/">
          <Home className="text-black mb-12 hover:text-blue-500" title="Go to Home" />
        </Link>

        <button onClick={() => toggleDrawer('search')} title="Search for Events">
          <Search className="text-black mb-44 hover:text-blue-500" />
        </button>

        <button onClick={() => toggleDrawer('location')} title="Post an Event">
          <MapPin className="text-black hover:text-blue-500" />
        </button>
      </div>

      <SearchDrawer
        isOpen={activeDrawer === 'search'}
        onClose={() => toggleDrawer(null)}
        selectedEventType={selectedEventType}
        setSelectedEventType={setSelectedEventType}
        onEventClick={handleEventClick}
      />

      <LocationDrawer
        isOpen={activeDrawer === 'location'}
        onClose={() => toggleDrawer(null)}
      />
    </>
  );
}
