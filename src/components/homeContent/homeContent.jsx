import { useEffect, useRef, useState, useCallback } from 'react';
import {
  GoogleMap,
  Marker,
  useJsApiLoader
} from '@react-google-maps/api';
import axios from 'axios';
import {
  MapPin, AlertCircle, Camera, Car, PawPrint
} from 'lucide-react';
import { renderToString } from 'react-dom/server';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 25.3176,
  lng: 82.9739
};

const iconMap = {
  'Location': MapPin,
  'Alert': AlertCircle,
  'Camera': Camera,
  'Vehicle': Car,
  'Pet': PawPrint,
  'Animal': PawPrint,
  'Crime': AlertCircle,
  'Theft': Car,
  'Accident': AlertCircle
};

const libraries = ['places'];

const groupEventsByLatLng = (events) => {
  const map = new Map();
  for (const event of events) {
    const key = `${event.latitude.toFixed(5)},${event.longitude.toFixed(5)}`;
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key).push(event);
  }
  return Array.from(map.values());
};

const applyJitter = (lat, lng, index, total) => {
  const radiusInMeters = 2;
  const angle = (index / total) * 2 * Math.PI;
  const dx = radiusInMeters * Math.cos(angle);
  const dy = radiusInMeters * Math.sin(angle);
  const earthRadius = 6378137;
  const newLat = lat + (dy / earthRadius) * (180 / Math.PI);
  const newLng = lng + (dx / earthRadius) * (180 / Math.PI) / Math.cos(lat * Math.PI / 180);
  return { lat: newLat, lng: newLng };
};

const HomeContent = () => {
  const [center, setCenter] = useState(defaultCenter);
  const [events, setEvents] = useState([]);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const clustererRef = useRef(null);
  const boundsChangedTimeoutRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => setCenter(defaultCenter)
    );
  }, []);

  const fetchEvents = async (bounds) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}events/map-bounds`,
        {
          params: {
            north: bounds.getNorthEast().lat(),
            south: bounds.getSouthWest().lat(),
            east: bounds.getNorthEast().lng(),
            west: bounds.getSouthWest().lng()
          }
        }
      );
      setEvents(res.data);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const handleMapLoad = useCallback((map) => {
    mapRef.current = map;
    const bounds = map.getBounds();
    if (bounds) fetchEvents(bounds);
  }, []);

  const handleBoundsChanged = () => {
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      if (bounds) {
        if (boundsChangedTimeoutRef.current) {
          clearTimeout(boundsChangedTimeoutRef.current);
        }
        boundsChangedTimeoutRef.current = setTimeout(() => {
          fetchEvents(bounds);
        }, 2000);
      }
    }
  };

  useEffect(() => {
    if (!mapRef.current || !window.google || !events.length) return;

    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const groups = groupEventsByLatLng(events);

    const newMarkers = groups.flatMap((group) =>
      group.map((event, index) => {
        const position = group.length > 1
          ? applyJitter(event.latitude, event.longitude, index, group.length)
          : { lat: event.latitude, lng: event.longitude };

        // const categoryImageMap = {
        //   'Accident': '/accident.svg',
        //   'Pet': '/pet.svg',
        //   'Crime': '/crime.svg',
        //   'Other': '/other.svg',
        //   'People': '/people.svg'
        // };

        // if (categoryImageMap[event.category]) {
        //   return new window.google.maps.Marker({
        //     position,
        //     icon: {
        //       url: categoryImageMap[event.category],
        //       scaledSize: new window.google.maps.Size(55, 55)
        //     }
        //   });
        // }

        let iconUrl = null;

// Try to parse media to check type
let mediaType = null;
try {
  const mediaArray = JSON.parse(event.media);
  if (Array.isArray(mediaArray) && mediaArray.length > 0) {
    mediaType = mediaArray[0].type; // 'image' or 'video'
  }
} catch (e) {
  console.warn('Failed to parse media JSON:', event.media);
}

// Define dynamic category+mediaType image map
const dynamicCategoryIcons = {
  'Accident': {
    image: '/accident1.svg',
    video: '/accident2.svg'
  },
  'Pet': {
    image: '/pet1.svg',
    video: '/pet2.svg'
  },
  'Crime': {
    image: '/crime1.svg',
    video: '/crime2.svg'
  },
  'Other': {
    image: '/other1.svg',
    video: '/other2.svg'
  },
  'People': {
    image: '/people1.svg',
    video: '/people2.svg'
  }
};

// Check for dynamic icon
if (dynamicCategoryIcons[event.category] && mediaType) {
  iconUrl = dynamicCategoryIcons[event.category][mediaType];
} else {
  // Fallback to static icon
  const staticIcons = {
    'Accident': '/accident.svg',
    'Pet': '/pet.svg',
    'Crime': '/crime.svg',
    'Other': '/other.svg',
    'People': '/people.svg'
  };
  iconUrl = staticIcons[event.category];
}

if (iconUrl) {
  return new window.google.maps.Marker({
    position,
    icon: {
      url: iconUrl,
      scaledSize: new window.google.maps.Size(100, 100)
    }
  });
}


        const IconComponent = iconMap[event.category] || MapPin;
        return new window.google.maps.Marker({
          position,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
              renderToString(<IconComponent color="red" size={32} />)
            )}`,
            scaledSize: new window.google.maps.Size(32, 32)
          }
        });
      })
    );

    markersRef.current = newMarkers;

    clustererRef.current = new MarkerClusterer({
      markers: newMarkers,
      map: mapRef.current,
      renderer: {
        render: ({ count, markers }) => {
          const iconsToShow = markers.slice(0, 3).map(marker => {
            const iconUrl = marker.getIcon()?.url;
            return `<img src="${iconUrl}" style="width:24px;height:24px;margin-right:2px;" />`;
          }).join('');

          const extraCount = count > 3 ? `<span style="font-weight:bold;margin-left:4px;">+${count - 3}</span>` : '';

          const html = `
            <div style="display:flex;align-items:center;background-color:#e5e7eb;padding:4px 8px;border-radius:9999px;box-shadow:0 1px 3px rgba(0,0,0,0.3);">
              ${iconsToShow}
              ${extraCount}
            </div>
          `;

          return new window.google.maps.Marker({
            position: markers[0].getPosition(),
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg xmlns='http://www.w3.org/2000/svg' width='64' height='40'>
                  <foreignObject width='100%' height='100%'>
                    <div xmlns='http://www.w3.org/1999/xhtml' style="display:flex;align-items:center;background-color:#e5e7eb;padding:4px 8px;border-radius:9999px;box-shadow:0 1px 3px rgba(0,0,0,0.3);">
                      ${iconsToShow}
                      ${extraCount}
                    </div>
                  </foreignObject>
                </svg>
              `)}`,
              scaledSize: new window.google.maps.Size(64, 40),
              anchor: new window.google.maps.Point(32, 20)
            },
            zIndex: Number(window.google.maps.Marker.MAX_ZINDEX) + count
          });
        }
      }
    });
  }, [events]);

  const badges = [
    { icon: <img src="/accident.svg" alt="Accident" className="w-8 h-8" />, name: 'Accidents' },
    { icon: <img src="/pet.svg" alt="Pets" className="w-8 h-8" />, name: 'Pets' },
    { icon: <img src="/lost.svg" alt="Lost and Found" className="w-8 h-8" />, name: 'Lost and Found' },
    { icon: <img src="/crime.svg" alt="Crimes" className="w-8 h-8" />, name: 'Crimes' },
    { icon: <img src="/people.svg" alt="People" className="w-8 h-8" />, name: 'People' }
  ];

  return (
    <div className="w-full h-full px-4 sm:px-8 lg:px-12 overflow-hidden">
      <div className="w-full flex justify-center pt-2">
        <img src="/PoingLogo.svg" alt="Poing Logo" className="h-32 object-contain" />
      </div>

      <div className="flex w-full h-[calc(100%-5.5rem)] gap-4 bg-gray-100">
        <div className="flex-1 rounded-lg overflow-hidden">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={center}
              zoom={13}
              onLoad={handleMapLoad}
              onBoundsChanged={handleBoundsChanged}
              options={{
                streetViewControl: false,
                fullscreenControl: false,
                mapTypeControl: false,
                gestureHandling: 'greedy'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-blue-700 font-bold">
              Loading Map...
            </div>
          )}
        </div>

        <div className="w-24 flex flex-col justify-center items-center gap-6 bg-transparent p-4">
          {badges.map((badge, idx) => (
            <div key={idx} className="flex flex-col items-center text-sm text-gray-700">
              {badge.icon}
              <span className="mt-1 text-center">{badge.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeContent;
