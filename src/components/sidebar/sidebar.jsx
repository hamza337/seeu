import { Home, Search, List, Info } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import SearchDrawer from './drawers/SearchDrawer';
import LocationDrawer from './drawers/LocationDrawer';
import ResultsDrawer from './drawers/ResultsDrawer';
import { useMap } from '../../contexts/MapContext';
import { useModal } from '../../contexts/ModalContext';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Sidebar() {
  // const [activeDrawer, setActiveDrawer] = useState(null);
  const [selectedEventType, setSelectedEventType] = useState(null);
  const { setMapFocusLocation, mapFocusLocation, focusMapFn, showLoginModal, setActiveView, isSidebarExpanded, setIsSidebarExpanded, isAuthenticated, searchResults, notifyMeParams, activeDrawer, setActiveDrawer, clearAllEntriesFn, getUserLocationFn } = useMap();
  const clearMapFocusTimeoutRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { setModalEventId } = useModal();
  const { t } = useLanguage();

  // Handle sidebar state based on page navigation and screen size
  useEffect(() => {
    // Always collapse on mobile
    if (window.innerWidth < 600) {
      setIsSidebarExpanded(false);
      return;
    }
    
    // On desktop, expand sidebar when navigating to home page (unless a drawer is open)
    if (location.pathname === '/' && !activeDrawer) {
      setIsSidebarExpanded(true);
    }
  }, [location.pathname, setIsSidebarExpanded, activeDrawer]);

  // Handle screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 600) {
        // Always collapse on mobile
        setIsSidebarExpanded(false);
      } else {
        // On desktop, restore expanded state if no drawer is open and we're on home page
        if (location.pathname === '/' && !activeDrawer) {
          setIsSidebarExpanded(true);
        }
      }
    };

    // Check on mount
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsSidebarExpanded, location.pathname, activeDrawer]);

  const handleHomeClick = () => {
    // Navigate to home page if not already there
    if (location.pathname !== '/') {
      navigate('/');
    }
    
    // Clear all search entries if clearAllEntriesFn is available
    if (clearAllEntriesFn) {
      clearAllEntriesFn();
    }
    
    // Close any open drawer
    setActiveDrawer(null);
    // Only expand sidebar if screen is >= 600px
    if (window.innerWidth >= 600) {
      setIsSidebarExpanded(true);
    }
    
    // Only reset map to user's current location if there's no pending map focus
    // This prevents interference with event location focusing from notifications
    if (getUserLocationFn && !mapFocusLocation) {
      getUserLocationFn();
    }
    
    // Clear map focus after checking
    setMapFocusLocation(null);
  };

  const toggleDrawer = (drawer) => {
    if (activeDrawer === drawer) {
      setActiveDrawer(null);
      // Only expand sidebar if screen is >= 600px
      if (window.innerWidth >= 600) {
        setIsSidebarExpanded(true);
      }
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
    // Only expand sidebar if screen is >= 600px
    if (window.innerWidth >= 600) {
      setIsSidebarExpanded(true);
    }
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
        {/* Home Button */}
        <button 
          onClick={handleHomeClick}
          className={`flex items-center mb-36`}
        >
          <span className={``}>
            <Home className={`text-black ${isSidebarExpanded ? 'mr-4' : 'mr-0'}`} title={t('nav.goToHome')} />
          </span>
          {isSidebarExpanded && <span className="text-black font-medium whitespace-nowrap">{t('nav.home')}</span>}
        </button>

        {/* Search Button */}
        <button 
          onClick={() => toggleDrawer('search')} 
          title={t('nav.searchForEvents')} 
          className={`flex items-center mb-36 cursor-pointer`}
        >
          <span className={activeDrawer === 'search' ? iconHighlight : ''}>
            <Search className={`text-black ${isSidebarExpanded ? 'mr-4' : 'mr-0'} rotate-90`} />
          </span>
          {isSidebarExpanded && <span className="text-black font-medium whitespace-nowrap">{t('nav.search')}</span>}
        </button>

        {/* Post Event Button */}
        <button 
          onClick={() => toggleDrawer('location')} 
          title={t('nav.postAnEvent')} 
          className={`flex items-center mb-36 cursor-pointer`}
        >
          <span className={activeDrawer === 'location' ? iconHighlight : ''}>
            <img src="/Ppoing.png" alt={t('nav.poingAppIcon')} className={`w-10`} />
          </span>
          {isSidebarExpanded && <span className="text-black font-medium whitespace-nowrap">{t('nav.poingIt')}</span>}
        </button>

        {/* List Button (no navigation) */}
        <button
          type="button"
          className={`flex items-center cursor-pointer`}
          onClick={() => {
            if (activeDrawer === 'results') {
              setActiveDrawer(null);
              // Only expand sidebar if screen is >= 600px
              if (window.innerWidth >= 600) {
                setIsSidebarExpanded(true);
              }
            } else {
              setActiveDrawer('results');
              setIsSidebarExpanded(false);
            }
          }}
        >
          <span className={activeDrawer === 'results' ? iconHighlight : ''}>
            <List className={`text-black ${isSidebarExpanded ? 'mr-4' : 'mr-0'}`} title={t('nav.list')} />
          </span>
          {isSidebarExpanded && <span className="text-black font-medium whitespace-nowrap">{t('nav.list')}</span>}
        </button>
      </div>

      {/* Drawers */}
      <SearchDrawer
        isOpen={activeDrawer === 'search'}
        onClose={() => {
          setActiveDrawer(null);
          // Only expand sidebar if screen is >= 600px
          if (window.innerWidth >= 600) {
            setIsSidebarExpanded(true);
          }
        }}
        selectedEventType={selectedEventType}
        setSelectedEventType={setSelectedEventType}
        onEventClick={handleEventClick}
      />

      <LocationDrawer
        isOpen={activeDrawer === 'location'}
        onClose={() => {
          setActiveDrawer(null);
          // Only expand sidebar if screen is >= 600px
          if (window.innerWidth >= 600) {
            setIsSidebarExpanded(true);
          }
        }}
      />

      {activeDrawer === 'results' && (
        <ResultsDrawer
          results={searchResults}
          onClose={() => {
            setActiveDrawer(null);
            // Only expand sidebar if screen is >= 600px
            if (window.innerWidth >= 600) {
              setIsSidebarExpanded(true);
            }
          }}
          notifyMeParams={notifyMeParams}
          isSidebarExpanded={isSidebarExpanded}
          onEventClick={event => {
            // Set modal event ID to open the event details
            setModalEventId(event.id);
            
            // Navigate to home page if not already there
            if (location.pathname !== '/') {
              navigate('/');
            }
            
            // Focus map on event location with smooth transition
            if (event.latitude && event.longitude && focusMapFn) {
              // Small delay to ensure navigation completes before focusing map
              setTimeout(() => {
                focusMapFn(event.latitude, event.longitude);
              }, location.pathname !== '/' ? 100 : 0);
            }
            
            // Close the results drawer for a cleaner experience
            setActiveDrawer(null);
            if (window.innerWidth >= 600) {
              setIsSidebarExpanded(true);
            }
          }}
        />
      )}
    </>
  );
}
