import { useEffect, useRef, useState, useCallback } from 'react';
import {
  GoogleMap,
  Marker,
  useJsApiLoader
} from '@react-google-maps/api';
import axios from 'axios';
import {
  MapPin, AlertCircle, Camera, Car, PawPrint, Lock
} from 'lucide-react';
import { renderToString } from 'react-dom/server';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useMap } from '../../contexts/MapContext';
import moment from 'moment'; // Import moment for date formatting
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import MediaDetail from '../mediaContent/mediaDetail/MediaDetail'; // Import MediaDetail component
import { useModal } from '../../contexts/ModalContext';
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
  context.fillStyle = '#0b4bb2'; // Changed to blue color
  context.shadowColor = 'rgba(0, 0, 0, 0.3)';
  context.shadowBlur = 3;
  context.shadowOffsetY = 1;
  context.beginPath();
  context.roundRect(0, 0, finalWidth, totalHeight, cornerRadius);
  context.fill();

  // Draw count text with plus sign on the gray background
  context.font = 'bold 20px Arial'; // Slightly larger font for count
  context.fillStyle = '#ffffff'; // Changed text color to white
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

// Helper function to format date
const formatCreationDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = moment(dateString);
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm') : 'Invalid Date';
};

// Helper function to parse media JSON and count types
const parseMediaAndCount = (mediaJson) => {
  try {
    const mediaArray = JSON.parse(mediaJson);
    if (Array.isArray(mediaArray)) {
      const imageCount = mediaArray.filter(media => media.type === 'image').length;
      const videoCount = mediaArray.filter(media => media.type === 'video').length;
      const firstMediaType = mediaArray.length > 0 ? mediaArray[0].type : null;
      const firstMediaUrl = mediaArray.length > 0 ? mediaArray[0].url : null;
      return { imageCount, videoCount, firstMediaType, firstMediaUrl };
    }
  } catch (e) {
    console.warn('Failed to parse media JSON:', mediaJson, e);
  }
  return { imageCount: 0, videoCount: 0, firstMediaType: null, firstMediaUrl: null };
};

const HomeContent = () => {
  const [center, setCenter] = useState(defaultCenter);
  const [events, setEvents] = useState([]);
  const [searchMarkers, setSearchMarkers] = useState([]);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const clustererRef = useRef(null);
  const boundsChangedTimeoutRef = useRef(null);
  const geocoderRef = useRef(null); // Ref for Geocoder
  const [activeView, setActiveView] = useState('mapView'); // Add state for active view
  const [showLoginModal, setShowLoginModal] = useState(false); // Add state for login modal
  const [hoveredEvent, setHoveredEvent] = useState(null); // State for the hovered event
  const [tooltipPosition, setTooltipPosition] = useState({ x: -1000, y: -1000, anchor: 'left-center', markerX: 0, markerY: 0 }); // Initialize tooltip off-screen
  const tooltipRef = useRef(null); // Ref for the tooltip div
  const mouseOutTimerRef = useRef(null); // Ref for the mouseout timer
  const [showTooltip, setShowTooltip] = useState(false);
  const { animatedMarkerId, setAnimatedMarkerId } = useMap();
  const { modalEventId, setModalEventId } = useModal();

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const { mapFocusLocation, setMapFocusLocation, setFocusMapFn, searchLocation, setSearchAddressFn, categorizedSearchResults, setCategorizedSearchResults, refreshEvents, hoveredEventId, setHoveredEventId, setGetUserLocationFn } = useMap();
  const navigate = useNavigate(); // Initialize navigate hook

  console.log('HomeContent rendering. mapFocusLocation:', mapFocusLocation, 'searchLocation:', searchLocation, 'refreshEvents:', refreshEvents);

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

  // Effect to trigger event fetching when refreshEvents changes
  useEffect(() => {
    if (mapRef.current && activeView === 'mapView') { // Only fetch events if in mapView
      const bounds = mapRef.current.getBounds();
      if (bounds) {
        console.log('refreshEvents changed, fetching events.');
        fetchEvents(bounds);
      }
    }
  }, [refreshEvents, mapRef.current, activeView]); // Depend on refreshEvents, mapRef.current and activeView

  // Effect to initialize Geocoder once map is loaded
  useEffect(() => {
    if (isLoaded && mapRef.current && !geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
      console.log('Geocoder initialized.');
    }
  }, [isLoaded, mapRef.current]);

  // Effect to pan/zoom to searchLocation when it changes
  useEffect(() => {
    if (searchLocation && mapRef.current) {
      console.log('Panning map to searchLocation:', searchLocation);
      mapRef.current.panTo(searchLocation);
      mapRef.current.setZoom(15); // Zoom level for search marker
    } else if (mapRef.current && !searchLocation) {
       // If searchLocation is cleared, reset zoom or pan if needed
       // mapRef.current.setZoom(13); // Example: Reset to default zoom
    }
  }, [searchLocation, mapRef.current]);

  // Define the function to focus the map
  const focusMapOnLocation = useCallback((lat, lng) => {
    if (mapRef.current && isLoaded) {
      console.log('Focusing map directly on:', { lat, lng });
      mapRef.current.panTo({ lat, lng });
      mapRef.current.setZoom(18); // Adjusted zoom level
    }
  }, [isLoaded]); // Depend on isLoaded

  // Define the function to get user's current location and focus map on it
  const getUserLocationAndFocus = useCallback(() => {
    if (mapRef.current && isLoaded) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('Got user location, focusing map on:', userLocation);
          mapRef.current.panTo(userLocation);
          mapRef.current.setZoom(15); // Set appropriate zoom level
          setCenter(userLocation); // Update the center state as well
        },
        (error) => {
          console.error('Error getting user location:', error);
          // Fallback to default center if geolocation fails
          mapRef.current.panTo(defaultCenter);
          mapRef.current.setZoom(13);
          setCenter(defaultCenter);
        }
      );
    }
  }, [isLoaded]); // Depend on isLoaded

  // Set the focusMapOnLocation function in context when it's available
  useEffect(() => {
    if (focusMapOnLocation) {
      setFocusMapFn(() => focusMapOnLocation); // Set the function in context
    }
  }, [focusMapOnLocation, setFocusMapFn]); // Depend on the function and its setter

  // Set the getUserLocationAndFocus function in context when it's available
  useEffect(() => {
    if (getUserLocationAndFocus) {
      setGetUserLocationFn(() => getUserLocationAndFocus); // Set the function in context
    }
  }, [getUserLocationAndFocus, setGetUserLocationFn]); // Depend on the function and its setter

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

    // Add a click listener to the map to hide tooltip when clicking elsewhere
    map.addListener('click', () => {
       setHoveredEvent(null);
       setTooltipPosition({ x: -1000, y: -1000, anchor: 'left-center', markerX: 0, markerY: 0 }); // Hide tooltip immediately on map click
    });

  }, []);

  const handleBoundsChanged = () => {
    if (mapRef.current && activeView === 'mapView') { // Only fetch events if in mapView
      const bounds = mapRef.current.getBounds();
      if (bounds) {
        if (boundsChangedTimeoutRef.current) {
          clearTimeout(boundsChangedTimeoutRef.current);
        }
        // Only fetch events if there is no active search marker to avoid flickering
        if (!searchLocation) {
           boundsChangedTimeoutRef.current = setTimeout(() => {
             fetchEvents(bounds);
           }, 2000);
        } else {
           console.log('Skipping fetchEvents because searchLocation is active.');
        }
      }
    }
  };

  // Function to geocode coordinates and update search address in Drawer
  const geocodeLatLng = useCallback((lat, lng) => {
    if (geocoderRef.current && setSearchAddressFn) {
      const latlng = { lat, lng };
      geocoderRef.current.geocode({ location: latlng }, (results, status) => {
        if (status === 'OK') {
          if (results[0]) {
            console.log('Geocoding result:', results[0].formatted_address);
            setSearchAddressFn(results[0].formatted_address, lat, lng);
          } else {
            console.log('No results found during geocoding.');
            setSearchAddressFn('Unknown location', lat, lng); // Update with unknown if no address found
          }
        } else {
          console.error('Geocoder failed due to:', status);
          setSearchAddressFn('Geocoding failed', lat, lng); // Indicate geocoding failure
        }
      });
    }
  }, [setSearchAddressFn]); // Depend on the function to update search address

  // Effect to create markers and clusterer - DEPENDS ONLY ON events and searchMarkers
  useEffect(() => {
    if (!mapRef.current || !window.google) return;

    // Clear old markers and listeners
    markersRef.current.forEach(marker => {
       if (marker._listeners) {
           window.google.maps.event.removeListener(marker._listeners.mouseover);
           window.google.maps.event.removeListener(marker._listeners.mouseout);
           delete marker._listeners;
       }
       marker.setMap(null);
    });
    markersRef.current = [];

    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

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
          const staticIcons = {
            'Accident': '/accidentM.svg',
            'Pet': '/petM.svg',
            'Crime': '/crimeM.svg',
            'Other': '/othersM.svg',
            'People': '/peopleM.svg',
            'LostFound': '/lostM.svg'
          };
          iconUrl = staticIcons[item.category] || '/default.svg';

          const marker = new window.google.maps.Marker({
            position,
            icon: {
              url: iconUrl,
              scaledSize: new window.google.maps.Size(60, 60),
              anchor: new window.google.maps.Point(30, 30) // Add anchor point to center the marker
            },
            title: '',
            draggable: false,
          });

          marker.eventData = item; // Store event data on marker

          // Add mouseover and mouseout listeners
          const mouseoverListener = marker.addListener('mouseover', (event) => {
             console.log('Mouse over event marker:', item.id);
             // Clear any pending mouseout timer
             if (mouseOutTimerRef.current) {
                 clearTimeout(mouseOutTimerRef.current);
                 mouseOutTimerRef.current = null;
             }
             setHoveredEvent(item);
             setHoveredEventId(item.id); // Only set hoveredEventId

             // Position tooltip relative to the marker position (not mouse position)
             if (mapRef.current) {
                 const mapDiv = mapRef.current.getDiv();
                 const mapRect = mapDiv.getBoundingClientRect();
                 const projection = mapRef.current.getProjection();
                 
                 if (projection) {
                     // Get marker position in world coordinates
                     const markerPosition = marker.getPosition();
                     const pixelPosition = projection.fromLatLngToPoint(markerPosition);
                     const scale = Math.pow(2, mapRef.current.getZoom());
                     
                     // Convert to screen coordinates
                     const markerX = pixelPosition.x * scale;
                     const markerY = pixelPosition.y * scale;
                     
                     // Get map center in screen coordinates
                     const mapCenter = mapRef.current.getCenter();
                     const mapCenterPixel = projection.fromLatLngToPoint(mapCenter);
                     const mapCenterX = mapCenterPixel.x * scale;
                     const mapCenterY = mapCenterPixel.y * scale;
                     
                     // Calculate relative position from map center
                     const relativeX = markerX - mapCenterX;
                     const relativeY = markerY - mapCenterY;
                     
                     // Convert to screen coordinates relative to map container
                     const mapWidth = mapDiv.clientWidth;
                     const mapHeight = mapDiv.clientHeight;
                     const screenX = (mapWidth / 2) + relativeX;
                     const screenY = (mapHeight / 2) + relativeY;
                     
                     // Tooltip dimensions (approximate)
                     const tooltipWidth = 200;
                     const tooltipHeight = 280;
                     
                     // Smart tooltip positioning - calculate available space in all directions
                     const offset = 15;
                     const padding = 10;
                     
                     // Calculate available space in each direction
                     const spaceRight = mapWidth - screenX - padding;
                     const spaceLeft = screenX - padding;
                     const spaceTop = screenY - padding;
                     const spaceBottom = mapHeight - screenY - padding;
                     
                     // Determine the best position based on available space
                     let tooltipX, tooltipY, anchorPosition;
                     
                     // Priority order: right, left, bottom, top (most professional looking)
                     if (spaceRight >= tooltipWidth + offset) {
                         // Position to the right
                         tooltipX = screenX + offset;
                         tooltipY = Math.max(padding, Math.min(screenY - tooltipHeight / 2, mapHeight - tooltipHeight - padding));
                         
                         // Determine arrow vertical position
                         if (tooltipY <= padding) {
                             anchorPosition = 'left-top';
                         } else if (tooltipY + tooltipHeight >= mapHeight - padding) {
                             anchorPosition = 'left-bottom';
                         } else {
                             anchorPosition = 'left-center';
                         }
                     } else if (spaceLeft >= tooltipWidth + offset) {
                         // Position to the left
                         tooltipX = screenX - tooltipWidth - offset;
                         tooltipY = Math.max(padding, Math.min(screenY - tooltipHeight / 2, mapHeight - tooltipHeight - padding));
                         
                         // Determine arrow vertical position
                         if (tooltipY <= padding) {
                             anchorPosition = 'right-top';
                         } else if (tooltipY + tooltipHeight >= mapHeight - padding) {
                             anchorPosition = 'right-bottom';
                         } else {
                             anchorPosition = 'right-center';
                         }
                     } else if (spaceBottom >= tooltipHeight + offset) {
                         // Position below
                         tooltipY = screenY + offset;
                         tooltipX = Math.max(padding, Math.min(screenX - tooltipWidth / 2, mapWidth - tooltipWidth - padding));
                         
                         // Determine arrow horizontal position
                         if (tooltipX <= padding) {
                             anchorPosition = 'top-left';
                         } else if (tooltipX + tooltipWidth >= mapWidth - padding) {
                             anchorPosition = 'top-right';
                         } else {
                             anchorPosition = 'top-center';
                         }
                     } else if (spaceTop >= tooltipHeight + offset) {
                         // Position above
                         tooltipY = screenY - tooltipHeight - offset;
                         tooltipX = Math.max(padding, Math.min(screenX - tooltipWidth / 2, mapWidth - tooltipWidth - padding));
                         
                         // Determine arrow horizontal position
                         if (tooltipX <= padding) {
                             anchorPosition = 'bottom-left';
                         } else if (tooltipX + tooltipWidth >= mapWidth - padding) {
                             anchorPosition = 'bottom-right';
                         } else {
                             anchorPosition = 'bottom-center';
                         }
                     } else {
                         // Fallback: position where there's most space (right side preferred)
                         if (spaceRight >= spaceLeft) {
                             tooltipX = screenX + offset;
                             anchorPosition = 'left-center';
                         } else {
                             tooltipX = screenX - tooltipWidth - offset;
                             anchorPosition = 'right-center';
                         }
                         tooltipY = Math.max(padding, Math.min(screenY - tooltipHeight / 2, mapHeight - tooltipHeight - padding));
                     }
                     
                     setTooltipPosition({ 
                         x: tooltipX, 
                         y: tooltipY, 
                         anchor: anchorPosition,
                         markerX: screenX,
                         markerY: screenY
                     });
                     console.log('Calculated tooltip position:', { x: tooltipX, y: tooltipY, anchor: anchorPosition });
                 }
             }
          });

          const mouseoutListener = marker.addListener('mouseout', () => {
             console.log('Mouse out event marker:', item.id);
             // Set a timer to hide the tooltip after a short delay
             // The tooltip's mouseover will clear this timer if the mouse enters the tooltip
             mouseOutTimerRef.current = setTimeout(() => {
                 setHoveredEvent(null);
                 setHoveredEventId(null); // Only clear hoveredEventId
                 setTooltipPosition({ x: -1000, y: -1000, anchor: 'left-center', markerX: 0, markerY: 0 }); // Hide tooltip by moving it off-screen
             }, 100); // Use a slightly longer delay here
          });

          marker._listeners = { mouseover: mouseoverListener, mouseout: mouseoutListener };

          return marker;

        } else if (item.type === 'searchMarker') {
          // Keep existing logic for search markers
          const category = item.label;
          if (category === 'Accident') {
            iconUrl = '/accident3.svg';
          } else if (category === 'LostFound') {
            iconUrl = `/lostandfound3.svg`
          } else {
            const lowerCaseCategory = category.toLowerCase().replace(/[^a-z0-9]/g, '');
            iconUrl = `/${lowerCaseCategory}3.svg`;
          }

          const marker = new window.google.maps.Marker({
              position,
              icon: {
                  url: iconUrl,
                  scaledSize: new window.google.maps.Size(80, 80),
                  anchor: new window.google.maps.Point(25, 50)
              },
              title: `Someone is searching for ${item.label} events`,
              draggable: false,
          });

          return marker;
        }

        // Fallback marker (no custom hover logic)
        const IconComponent = iconMap[item.category || item.label] || MapPin;
        const fallbackMarker = new window.google.maps.Marker({
          position,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
              renderToString(<IconComponent color={item.type === 'searchMarker' ? "blue" : "red"} size={32} />)
            )}`,
            scaledSize: new window.google.maps.Size(32, 32)
          },
          title: item.type === 'event' 
            ? `This is a${(('AEIOUaeiou'.indexOf(item.category?.[0]) !== -1) || (!item.category)) ? 'n' : ''} ${item.category || 'Unknown'} Event`
            : `Someone is searching for ${item.label} events`,
          draggable: false,
        });

        return fallbackMarker;
      })
    );

    markersRef.current = newMarkers;

    const eventMarkersToCluster = newMarkers.filter(marker => marker.eventData);
    const searchMarkersToAdd = newMarkers.filter(marker => !marker.eventData);

    // Add searchMarkers directly to the map (they don't get clustered)
    searchMarkersToAdd.forEach((marker, index) => {
      marker.setMap(mapRef.current);
    });

    if (clustererRef.current) {
        clustererRef.current.clearMarkers();
    }

    clustererRef.current = new MarkerClusterer({
      markers: eventMarkersToCluster,
      map: mapRef.current,
      renderer: { // Keep existing renderer logic
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
      styles: [ // Add custom cluster styles if needed for size adjustments
           {
              url: '/cluster.png', // Your custom cluster icon image
              width: 53,
              height: 52,
              textColor: '#fff',
              textSize: 11,
              fontWeight: 'bold'
           }, // Define more styles for different cluster sizes if needed
       ]
    });

  }, [events, searchMarkers]); // Dependencies remain events and searchMarkers

   // Add mouseover and mouseout listeners to the tooltip div
   useEffect(() => {
       const tooltipElement = tooltipRef.current;
       if (tooltipElement) {
           const handleTooltipMouseover = () => {
               // Clear the mouseout timer if the mouse enters the tooltip
               if (mouseOutTimerRef.current) {
                   clearTimeout(mouseOutTimerRef.current);
                   mouseOutTimerRef.current = null;
               }
           };

           const handleTooltipMouseout = () => {
               // Set a timer to hide the tooltip after a short delay when mouse leaves tooltip
                mouseOutTimerRef.current = setTimeout(() => {
                    setHoveredEvent(null);
                    setHoveredEventId(null); // Also clear in context
                    setTooltipPosition({ x: -1000, y: -1000, anchor: 'left-center', markerX: 0, markerY: 0 });
               }, 50); // Short delay
           };

           tooltipElement.addEventListener('mouseover', handleTooltipMouseover);
           tooltipElement.addEventListener('mouseout', handleTooltipMouseout);

           return () => {
               tooltipElement.removeEventListener('mouseover', handleTooltipMouseover);
               tooltipElement.removeEventListener('mouseout', handleTooltipMouseout);
           };
       }
   }, [hoveredEvent]); // Re-attach listeners when hoveredEvent changes

  // When hoveredEvent changes, control showTooltip for fade effect
  useEffect(() => {
    if (hoveredEvent) {
      setShowTooltip(true);
    } else if (showTooltip) {
      // Delay hiding to allow fade-out
      const timeout = setTimeout(() => setShowTooltip(false), 200); // 200ms matches the transition
      return () => clearTimeout(timeout);
    }
  }, [hoveredEvent]);

  // Add this effect after the other useEffects, before the animation effect:
  useEffect(() => {
    if (animatedMarkerId && mapRef.current) {
      // Find the marker with the matching event ID
      const targetMarker = markersRef.current.find(marker => 
        marker.eventData && marker.eventData.id === animatedMarkerId
      );
      if (targetMarker) {
        const position = targetMarker.getPosition();
        mapRef.current.panTo(position);
      }
    }
  }, [animatedMarkerId, mapRef.current]);

  // Effect to apply animation to markers
  useEffect(() => {
    let animationInterval = null;
    
    if (animatedMarkerId) {
      // Find the marker to animate
      const targetMarker = markersRef.current.find(marker => 
        marker.eventData && marker.eventData.id === animatedMarkerId
      );
      
      if (targetMarker) {
        const originalPosition = targetMarker.getPosition();
        const originalLat = originalPosition.lat();
        const originalLng = originalPosition.lng();
        let isUp = false;
        
        // Create bouncing animation
        animationInterval = setInterval(() => {
          if (isUp) {
            // Normal position
            targetMarker.setPosition(new window.google.maps.LatLng(originalLat, originalLng));
          } else {
            // Bounced up position (move up by a small amount)
            const bounceOffset = 0.0002; // Small offset for bouncing effect
            targetMarker.setPosition(new window.google.maps.LatLng(originalLat + bounceOffset, originalLng));
          }
          isUp = !isUp;
        }, 250); // Change position every 300ms for bouncing effect
      }
    }
    
    // Cleanup function
    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
      
      // Reset all markers to their original positions when animation stops
      markersRef.current.forEach(marker => {
        if (marker.eventData) {
          // Reset to original position if this was the animated marker
          if (marker.eventData.id === animatedMarkerId) {
            const originalPosition = marker.getPosition();
            const originalLat = originalPosition.lat();
            const originalLng = originalPosition.lng();
            marker.setPosition(new window.google.maps.LatLng(originalLat, originalLng));
          }
        }
      });
    };
  }, [animatedMarkerId]);

  return (
    <div className="w-full h-full pt-6 sm:pt-11 pl-0 pr-4 sm:px-4 md:px-8 lg:px-12 overflow-x-hidden">
      <div className="w-full mb-8 px-2">
        <p className="text-gray-600 text-sm sm:text-base md:text-lg lg:text-xl mb-4 text-center leading-relaxed">
          The only search tool by <span className="font-semibold">TI<span style={{ color: 'red' }}>:</span>ME</span> and  <span className="font-semibold"><span style={{ color: '#0868a8' }}>P</span>LACE</span> to find or post lost items, pets, people, witnesses and events.
        </p>
      </div>

      <div className="flex w-full h-[calc(100%-7.5rem)] bg-gray-100 relative"> {/* Add relative positioning here */}
        {/* Map and List View Container - Now takes full width */}
        <div className="flex-1 rounded-lg overflow-hidden relative">
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
            >
              {/* Movable Search Marker */}
              {searchLocation && isLoaded && (
                <Marker
                  position={searchLocation}
                  draggable={true}
                  onDragEnd={(event) => {
                    const newLat = event.latLng.lat();
                    const newLng = event.latLng.lng();
                    console.log('Search marker drag ended. New coordinates:', { lat: newLat, lng: newLng });
                    geocodeLatLng(newLat, newLng);
                  }}
                  icon={{
                    url: '/Ppoing.png',
                    scaledSize: new window.google.maps.Size(50, 50),
                    anchor: new window.google.maps.Point(24, 43)
                  }}
                  title="Drag to select location"
                />
              )}

              {/* searchMarkers are now handled in the useEffect hook above for proper icon assignment and to avoid duplicates */}

              {/* Existing markers (clustered events and static search markers from API) are handled in useEffects */}

            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-blue-700 font-bold">
              Loading Map...
            </div>
          )}

          {/* Always render the tooltip for fade effect */}
          <div
            ref={tooltipRef}
            className={`event-tooltip absolute z-20 bg-gray-200 text-gray-800 p-3 rounded shadow-lg transition-opacity duration-400
              ${hoveredEvent ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            style={{
              top: tooltipPosition.y,
              left: tooltipPosition.x,
              minWidth: '100px',
              maxWidth: '200px',
            }}
          >
            {/* Tooltip Arrow */}
            <div
              className="absolute w-0 h-0"
              style={{
                filter: 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))',
                
                // Left side arrows (tooltip is to the right of marker)
                ...(tooltipPosition.anchor === 'left-center' && {
                  left: '-8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                  borderRight: '8px solid #e5e7eb',
                }),
                ...(tooltipPosition.anchor === 'left-top' && {
                  left: '-8px',
                  top: '20px',
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                  borderRight: '8px solid #e5e7eb',
                }),
                ...(tooltipPosition.anchor === 'left-bottom' && {
                  left: '-8px',
                  bottom: '20px',
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                  borderRight: '8px solid #e5e7eb',
                }),
                
                // Right side arrows (tooltip is to the left of marker)
                ...(tooltipPosition.anchor === 'right-center' && {
                  right: '-8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                  borderLeft: '8px solid #e5e7eb',
                }),
                ...(tooltipPosition.anchor === 'right-top' && {
                  right: '-8px',
                  top: '20px',
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                  borderLeft: '8px solid #e5e7eb',
                }),
                ...(tooltipPosition.anchor === 'right-bottom' && {
                  right: '-8px',
                  bottom: '20px',
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                  borderLeft: '8px solid #e5e7eb',
                }),
                
                // Top arrows (tooltip is below marker)
                ...(tooltipPosition.anchor === 'top-center' && {
                  top: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderBottom: '8px solid #e5e7eb',
                }),
                ...(tooltipPosition.anchor === 'top-left' && {
                  top: '-8px',
                  left: '20px',
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderBottom: '8px solid #e5e7eb',
                }),
                ...(tooltipPosition.anchor === 'top-right' && {
                  top: '-8px',
                  right: '20px',
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderBottom: '8px solid #e5e7eb',
                }),
                
                // Bottom arrows (tooltip is above marker)
                ...(tooltipPosition.anchor === 'bottom-center' && {
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '8px solid #e5e7eb',
                }),
                ...(tooltipPosition.anchor === 'bottom-left' && {
                  bottom: '-8px',
                  left: '20px',
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '8px solid #e5e7eb',
                }),
                ...(tooltipPosition.anchor === 'bottom-right' && {
                  bottom: '-8px',
                  right: '20px',
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '8px solid #e5e7eb',
                }),
              }}
            />
            <h3 className="font-semibold text-base mb-1">{hoveredEvent?.category || 'Unknown Category'}</h3>
            <p className="text-xs mb-1">{hoveredEvent?.address || 'No address'}</p>
            {/* Media Info Row */}
            <div className="grid grid-cols-2 gap-2 mb-2" style={{ width: 180 }}>
              <div
                className="bg-white text-gray-800 text-xs rounded flex flex-col justify-center items-center"
                style={{ width: 80, height: 80 }}
              >
                <div className="text-center">
                  {parseMediaAndCount(hoveredEvent?.media).videoCount > 0 &&
                    `${parseMediaAndCount(hoveredEvent?.media).videoCount} video(s)`}
                </div>
                <div className="text-center">
                  {parseMediaAndCount(hoveredEvent?.media).imageCount > 0 &&
                    `${parseMediaAndCount(hoveredEvent?.media).imageCount} photo(s)`}
                </div>
              </div>
              <div
                className="bg-white rounded overflow-hidden flex items-center justify-center"
                style={{ width: 80, height: 80 }}
              >
                {(() => {
                  const previewImageUrl = hoveredEvent?.previewImage;
                  let actualPreviewMedia = null;

                  if (previewImageUrl && hoveredEvent?.media) {
                    try {
                      const mediaArray = JSON.parse(hoveredEvent.media);
                      actualPreviewMedia = mediaArray.find(item => item.url === previewImageUrl);
                    } catch (e) {
                      console.error("Failed to parse media JSON:", e);
                    }
                  }

                  if (actualPreviewMedia && actualPreviewMedia.url) {
                    return actualPreviewMedia.type === 'video' ? (
                      <div className="relative w-full h-full flex items-center justify-center bg-gray-100">
                        <video 
                          src={actualPreviewMedia.url}
                          className="w-full h-full object-cover"
                          preload="metadata"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                            <svg 
                              className="w-4 h-4 text-white" 
                              fill="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={actualPreviewMedia.url}
                        alt="Preview Media"
                        className="object-cover w-full h-full"
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                      />
                    );
                  } else {
                    return <span className="text-gray-500 text-xs">No Media</span>;
                  }
                })()}
              </div>
            </div>

            {/* Description and Claim Button Grouped */}
            <div className="bg-white rounded flex flex-col items-stretch my-2">
              <div className="px-2 py-2 text-xs text-gray-800">
                {hoveredEvent?.description
                  ? hoveredEvent.description.slice(0, 50) + (hoveredEvent.description.length > 50 ? '...' : '')
                  : 'No description'}
              </div>
              <div className="border-t border-gray-300" />
              <button
                onClick={() => {
                  console.log('Claim button clicked for event:', hoveredEvent.id);
                  navigate(`/event/${hoveredEvent.id}`, { state: { event: hoveredEvent } });
                }}
                className="w-full text-blue-600 font-semibold py-2 text-sm hover:underline focus:outline-none"
                style={{ background: 'none' }}
              >
                Claim
              </button>
            </div>

            {/* Listing ID */}
            <p className="text-xs">Listing ID: {hoveredEvent?.eventCode || 'N/A'}</p>
            
            {/* Posted Date */}
            <p className="text-xs">
              Posted {hoveredEvent?.createdAt ? 
                new Date(hoveredEvent.createdAt).toLocaleDateString('en-US', {
                  month: '2-digit',
                  day: '2-digit', 
                  year: 'numeric'
                }) : 'N/A'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeContent;
