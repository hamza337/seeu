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
import { useMap } from '../../contexts/MapContext';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 39.8283, // Approximate geographic center of the contiguous US
  lng: -98.5795 // Approximate geographic center of the contiguous US
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

const groupEventsByLatLng = (items) => {
  const map = new Map();
  for (const item of items) {
    // Use item.latitude or item.lat, item.longitude or item.lng
    const lat = item.latitude || item.lat;
    const lng = item.longitude || item.lng;

    // Ensure lat and lng are valid numbers before calling toFixed
    if (typeof lat === 'number' && typeof lng === 'number') {
      const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(item);
    } else {
       console.warn('Skipping item with invalid coordinates:', item);
    }
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

// Helper function to load an image and return a Promise
const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

// Function to create a cluster icon on a canvas
const createClusterIcon = async (count, markers) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const iconSize = 32; // Increased size for the individual icons
  const padding = 6; // Padding between elements (slightly increased for larger icons)
  const countAreaWidth = 60; // Fixed width reserved for the count area when needed

  const iconsToDraw = markers.slice(0, 3);
  const numIcons = iconsToDraw.length;

  // Calculate dynamic widths
  const iconAreaWidth = numIcons > 0 ? numIcons * (iconSize + padding) - padding : 0; // Sum of icon widths + padding between them
  const calculatedCountAreaWidth = count > 3 ? countAreaWidth : 0; // Only include count area width if count > 3

  const totalWidth = calculatedCountAreaWidth + (calculatedCountAreaWidth > 0 ? padding : 0) + iconAreaWidth + (iconAreaWidth > 0 ? padding : 0); // Sum of widths + padding. Add padding only if the element before it exists.
  const totalHeight = Math.max(iconSize, 40) + padding * 2; // Height is based on max of iconSize or a base size, plus padding

  // Ensure a minimum width if there are icons but no count area
  const finalWidth = Math.max(totalWidth, numIcons > 0 ? iconAreaWidth + padding * 2 : 0);

  canvas.width = finalWidth;
  canvas.height = totalHeight;

  // Draw rounded background (matches the gray bar)
  const cornerRadius = totalHeight / 2;
  context.fillStyle = '#d3d3d3'; // Light gray background color
  context.shadowColor = 'rgba(0, 0, 0, 0.3)';
  context.shadowBlur = 3;
  context.shadowOffsetY = 1;
  context.beginPath();
  context.roundRect(0, 0, finalWidth, totalHeight, cornerRadius);
  context.fill();

  // Draw count text with plus sign on the gray background
  context.font = 'bold 20px Arial'; // Slightly larger font for count
  context.fillStyle = '#000'; // Black text color
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  let countText = ''; // Initialize countText as empty
  if (count > 3) {
    const displayedCount = count - 3;
    countText = `+${displayedCount}`;
  }

  // Only draw text if countText is not empty
  if (countText) {
    const countTextX = padding + countAreaWidth / 2;
    const countTextY = totalHeight / 2;
    context.fillText(countText, countTextX, countTextY);
  }

  // Draw icons
  // Start drawing icons after the count area and its padding (if count area exists)
  let currentIconX = (calculatedCountAreaWidth > 0 ? calculatedCountAreaWidth + padding : padding); // Start icons after count area + padding OR just padding if no count area

  for (const marker of iconsToDraw) {
    const icon = marker.getIcon();
    const iconUrl = typeof icon === 'string' ? icon : icon.url;
    if (iconUrl) {
      try {
        const img = await loadImage(iconUrl);
        // Center icon vertically
        context.drawImage(img, currentIconX, (totalHeight - iconSize) / 2, iconSize, iconSize);
        currentIconX += iconSize + padding;
      } catch (error) {
        console.error('Failed to load icon for canvas:', iconUrl, error);
        // Draw a placeholder or skip if image fails to load
      }
    }
  }

  // Calculate anchor point (center of the total shape)
  const anchorX = finalWidth / 2;
  const anchorY = totalHeight / 2;

  return {
    url: canvas.toDataURL(),
    scaledSize: new window.google.maps.Size(finalWidth, totalHeight),
    anchor: new window.google.maps.Point(anchorX, anchorY),
  };
};

const HomeContent = () => {
  const [center, setCenter] = useState(defaultCenter);
  const [events, setEvents] = useState([]);
  const [searchMarkers, setSearchMarkers] = useState([]);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const clustererRef = useRef(null);
  const boundsChangedTimeoutRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const { mapFocusLocation, setMapFocusLocation, setFocusMapFn } = useMap();

  console.log('HomeContent rendering. mapFocusLocation:', mapFocusLocation);

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

  // Define the function to focus the map
  const focusMapOnLocation = useCallback((lat, lng) => {
    if (mapRef.current && isLoaded) {
      console.log('Focusing map directly on:', { lat, lng });
      mapRef.current.panTo({ lat, lng });
      mapRef.current.setZoom(18); // Adjusted zoom level
    }
  }, [isLoaded]); // Depend on isLoaded

  // Set the focusMapOnLocation function in context when it's available
  useEffect(() => {
    if (focusMapOnLocation) {
      setFocusMapFn(() => focusMapOnLocation); // Set the function in context
    }
  }, [focusMapOnLocation, setFocusMapFn]); // Depend on the function and its setter

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
      console.log('API response:', res.data);
      setEvents(res.data.events || []);
      setSearchMarkers(res.data.searchMarkers || []);
    } catch (err) {
      console.error('Error fetching data:', err);
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
    if (!mapRef.current || !window.google) return;

    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const allItems = [
      ...(events || []).map(item => ({ ...item, type: 'event' })),
      ...(searchMarkers || []).map(item => ({ ...item, type: 'searchMarker' }))
    ];

    if (allItems.length === 0) return;

    const groups = groupEventsByLatLng(allItems);

    const newMarkers = groups.flatMap((group) =>
      group.map((item, index) => {
        const position = group.length > 1
          ? applyJitter(item.latitude || item.lat, item.longitude || item.lng, index, group.length)
          : { lat: item.latitude || item.lat, lng: item.longitude || item.lng };

        let iconUrl = null;

        if (item.type === 'event') {
          let mediaType = null;
          try {
            const mediaArray = JSON.parse(item.media);
            if (Array.isArray(mediaArray) && mediaArray.length > 0) {
              mediaType = mediaArray[0].type;
            }
          } catch (e) {
            // console.warn('Failed to parse media JSON for event:', item.media);
          }

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

          if (dynamicCategoryIcons[item.category] && mediaType) {
            iconUrl = dynamicCategoryIcons[item.category][mediaType];
          } else {
            const staticIcons = {
              'Accident': '/accident.svg',
              'Pet': '/pet.svg',
              'Crime': '/crime.svg',
              'Other': '/other.svg',
              'People': '/people.svg'
            };
            iconUrl = staticIcons[item.category];
          }
        } else if (item.type === 'searchMarker') {
          const category = item.label;
          if (category === 'Accident') {
            iconUrl = '/accident3.svg';
          } else {
            const lowerCaseCategory = category.toLowerCase().replace(/[^a-z0-9]/g, '');
            iconUrl = `/${lowerCaseCategory}3.svg`;
          }
        }

        if (iconUrl) {
          return new window.google.maps.Marker({
            position,
            icon: {
              url: iconUrl,
              scaledSize: new window.google.maps.Size(100, 100)
            },
            title: `This is a ${item.category || item.label} Event`,
          });
        }

        const IconComponent = iconMap[item.category || item.label] || MapPin;
        return new window.google.maps.Marker({
          position,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
              renderToString(<IconComponent color="red" size={32} />)
            )}`,
            scaledSize: new window.google.maps.Size(32, 32)
          },
          title: `This is a ${item.category || item.label} Event`,
        });
      })
    );

    markersRef.current = newMarkers;

    if (clustererRef.current) {
        clustererRef.current.clearMarkers();
    }

    clustererRef.current = new MarkerClusterer({
      markers: newMarkers,
      map: mapRef.current,
      renderer: {
        render: ({ count, markers }) => {
          const clusterMarker = new window.google.maps.Marker({
            position: markers[0].getPosition(),
            zIndex: Number(window.google.maps.Marker.MAX_ZINDEX) + count,
          });

          createClusterIcon(count, markers).then(iconInfo => {
            clusterMarker.setIcon(iconInfo);
          }).catch(error => {
            console.error('Error creating cluster icon:', error);
          });

          return clusterMarker;
        },
      },
    });
  }, [events, searchMarkers]);

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
