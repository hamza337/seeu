import { Home, Search, List, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useRef } from 'react';
import SearchDrawer from './drawers/SearchDrawer';
import LocationDrawer from './drawers/LocationDrawer';
import { useMap } from '../../contexts/MapContext';

export default function Sidebar() {
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [selectedEventType, setSelectedEventType] = useState(null);
  const { setMapFocusLocation, mapFocusLocation, focusMapFn, showLoginModal, setActiveView, isSidebarExpanded, setIsSidebarExpanded } = useMap();
  const clearMapFocusTimeoutRef = useRef(null);

  const toggleDrawer = (drawer) => {
    setActiveDrawer((prev) => (prev === drawer ? null : drawer));

    // Clear map focus only when opening the search drawer
    if (drawer === 'search') {
      console.log('Opening search drawer, clearing map focus.');
      setMapFocusLocation(null);
    }
     // Close drawer if already open and clicked again
     if (activeDrawer === drawer) {
        setActiveDrawer(null);
     }
  };

  const handleEventClick = (lat, lng) => {
    console.log('handleEventClick called with:', { lat, lng });
    console.log('Value of focusMapFn in Sidebar:', focusMapFn);
    console.log('Calling focusMapFn.');
    if (focusMapFn) {
      focusMapFn(lat, lng);
    }
    setActiveDrawer(null); // Close the search drawer
    // Removed setActiveView here, handled when clicking list items in HomeContent
  };

  // Define collapsed and expanded widths
  const collapsedWidth = 'w-14'; // Tailwind class for 56px
  const expandedWidth = 'w-34'; // Tailwind class for 256px


  return (
    <>
      {/* Fixed Sidebar */}
      <div
        className={`pt-14 h-full bg-white flex flex-col py-4 shadow-md fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out
          ${
            isSidebarExpanded ? `${expandedWidth} items-start px-4` : `${collapsedWidth} items-center px-0` // Adjust width and padding based on expanded state
          }
        `}
        onMouseEnter={() => { console.log('Mouse Enter Sidebar'); setIsSidebarExpanded(true); }} // Expand on hover
        onMouseLeave={() => { console.log('Mouse Leave Sidebar'); setIsSidebarExpanded(false); }} // Collapse on mouse leave
      >
        {/* Home Link */}
        <Link to="/" className={`flex items-center mb-12`}> {/* Use flex and adjust alignment */}
          <Home className={`text-black ${isSidebarExpanded ? 'mr-4' : 'mr-0'}`} title="Go to Home" /> {/* Add margin when expanded */}
          {isSidebarExpanded && <span className="text-black font-medium whitespace-nowrap">HOME</span>} {/* Conditionally render text */}
        </Link>

        {/* Search Button */}
        <button onClick={() => toggleDrawer('search')} title="Search for Events" className={`flex items-center mb-44 cursor-pointer`}> {/* Adjust alignment and spacing */}
          <Search className={`text-black ${isSidebarExpanded ? 'mr-4' : 'mr-0'} rotate-90`} /> {/* Add margin when expanded */}
          {isSidebarExpanded && <span className="text-black font-medium whitespace-nowrap">Search</span>} {/* Conditionally render text */}
        </button>

        {/* Post Event Button */}
        <button onClick={() => toggleDrawer('location')} title="Post an Event" className={`flex items-center cursor-pointer`}> {/* Adjust alignment */}
          <img src="/Ppoing.png" alt="Poing App Icon" className={`w-10`} /> {/* Add margin when expanded */}
          {isSidebarExpanded && <span className="text-black font-medium whitespace-nowrap">Poing It</span>} {/* Conditionally render text */}
        </button>
        {/* My Events Link */}
        <Link to="/my-events" className={`flex items-center mt-4`}> {/* Add margin-top and adjust alignment */}
          <List className={`text-black ${isSidebarExpanded ? 'mr-4' : 'mr-0'}`} title="Go to Home" /> {/* Placeholder icon - replace with appropriate icon */}
           {isSidebarExpanded && <span className="text-black font-medium whitespace-nowrap">My Events</span>} {/* Conditionally render text */}
        </Link>

      </div>

      {/* Drawers (will be positioned relative to sidebar in their own files) */}
      {/* Removed conditional rendering based on activeDrawer here, drawers are always mounted for transitions */}
       <SearchDrawer
         isOpen={activeDrawer === 'search'}
         onClose={() => toggleDrawer(null)}
         selectedEventType={selectedEventType} // Pass necessary props
         setSelectedEventType={setSelectedEventType}
         onEventClick={handleEventClick} // Pass necessary props
       />

       <LocationDrawer
         isOpen={activeDrawer === 'location'}
         onClose={() => toggleDrawer(null)} // Pass necessary props
       />
        {/* Add other drawers if needed, e.g., AboutDrawer */}

    </>
  );
}
