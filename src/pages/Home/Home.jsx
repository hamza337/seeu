import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import HomeContent from '../../components/homeContent/homeContent'
import { useModal } from '../../contexts/ModalContext';
import { useMap } from '../../contexts/MapContext';

const Home = () => {
  const [searchParams] = useSearchParams();
  const { setModalEventId } = useModal();
  const { focusMapFn } = useMap();

  useEffect(() => {
    // Check for URL parameters
    const eventId = searchParams.get('eventId');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (eventId) {
      // Set modal event ID to open the event details
      setModalEventId(eventId);
      
      // If coordinates are provided, focus the map on that location
      if (lat && lng && focusMapFn) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        
        if (!isNaN(latitude) && !isNaN(longitude)) {
          // Small delay to ensure map is ready
          setTimeout(() => {
            focusMapFn(latitude, longitude);
          }, 500);
        }
      }
    }
  }, [searchParams, setModalEventId, focusMapFn]);

  return (
    <HomeContent />
  )
}

export default Home