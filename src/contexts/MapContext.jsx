import { createContext, useContext, useState, useEffect } from 'react';

const MapContext = createContext(null);

export const MapProvider = ({ children }) => {
  const [mapFocusLocation, setMapFocusLocation] = useState(null);
  const [focusMapFn, setFocusMapFn] = useState(null);
  const [searchLocation, setSearchLocation] = useState(null);
  const [setSearchAddressFn, setSetSearchAddressFn] = useState(null);
  const [categorizedSearchResults, setCategorizedSearchResults] = useState(null);
  const [notifyMeParams, setNotifyMeParams] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [refreshEvents, setRefreshEvents] = useState(0);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [searchResults, setSearchResults] = useState(null);
  const [activeDrawer, setActiveDrawer] = useState(null);
  const [hoveredEventId, setHoveredEventId] = useState(null);
  const [animatedMarkerId, setAnimatedMarkerId] = useState(null);
  const [activeSearchQuery, setActiveSearchQuery] = useState(null);
  const [notifyMePayload, setNotifyMePayload] = useState(null);
  const [clearAllEntriesFn, setClearAllEntriesFn] = useState(null);
  const [getUserLocationFn, setGetUserLocationFn] = useState(null);

  const triggerRefreshEvents = () => {
    setRefreshEvents(prev => prev + 1);
  };

  const updateMapFocusLocation = (location) => {
    console.log('MapProvider: Updating mapFocusLocation to:', location);
    setMapFocusLocation(location);
  };

  const updateSearchLocation = (location) => {
    console.log('MapProvider: Updating searchLocation to:', location);
    setSearchLocation(location);
  };

  const updateSearchAddress = (address, lat, lng) => {
    console.log('MapProvider: Calling setSearchAddressFn with:', { address, lat, lng });
    if (setSearchAddressFn) {
      setSearchAddressFn(address, lat, lng);
    }
  };

  const updateCategorizedSearchResults = (results) => {
    console.log('MapProvider: Updating categorizedSearchResults:', results);
    setCategorizedSearchResults(results);
  };

  const updateNotifyMeParams = (params) => {
    console.log('MapProvider: Updating notifyMeParams:', params);
    setNotifyMeParams(params);
  };

  const updateShowLoginModal = (show) => {
    console.log('MapProvider: Setting showLoginModal:', show);
    setShowLoginModal(show);
  };

  const updateIsAuthenticated = (status) => {
    setIsAuthenticated(status);
  };

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <MapContext.Provider value={{ 
      mapFocusLocation,
      setMapFocusLocation: updateMapFocusLocation,
      focusMapFn,
      setFocusMapFn,
      searchLocation,
      setSearchLocation: updateSearchLocation,
      setSearchAddressFn: updateSearchAddress,
      setSetSearchAddressFn,
      categorizedSearchResults,
      setCategorizedSearchResults: updateCategorizedSearchResults,
      notifyMeParams,
      setNotifyMeParams: updateNotifyMeParams,
      showLoginModal,
      setShowLoginModal: updateShowLoginModal,
      refreshEvents,
      triggerRefreshEvents,
      isSidebarExpanded,
      setIsSidebarExpanded,
      isAuthenticated,
      setIsAuthenticated: updateIsAuthenticated,
      searchResults,
      setSearchResults,
      activeDrawer,
      setActiveDrawer,
      hoveredEventId,
      setHoveredEventId,
      animatedMarkerId,
      setAnimatedMarkerId,
      activeSearchQuery,
      setActiveSearchQuery,
      notifyMePayload,
      setNotifyMePayload,
      clearAllEntriesFn,
      setClearAllEntriesFn,
      getUserLocationFn,
      setGetUserLocationFn,
    }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};