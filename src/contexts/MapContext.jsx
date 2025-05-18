import { createContext, useContext, useState } from 'react';

const MapContext = createContext(null);

export const MapProvider = ({ children }) => {
  const [mapFocusLocation, setMapFocusLocation] = useState(null);
  const [focusMapFn, setFocusMapFn] = useState(null);

  const updateMapFocusLocation = (location) => {
    console.log('MapProvider: Updating mapFocusLocation to:', location);
    setMapFocusLocation(location);
  };

  return (
    <MapContext.Provider value={{ mapFocusLocation, setMapFocusLocation: updateMapFocusLocation, focusMapFn, setFocusMapFn }}>
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