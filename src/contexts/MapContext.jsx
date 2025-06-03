import { createContext, useContext, useState } from 'react';

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