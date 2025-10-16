import { useEffect, useRef, useState, useCallback } from 'react';
import {
  GoogleMap,
  Marker,
  useJsApiLoader
} from '@react-google-maps/api';
import axios from 'axios';
import {
  MapPin, AlertCircle, Camera, Car, PawPrint, Lock, Search
} from 'lucide-react';
import { renderToString } from 'react-dom/server';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useMap } from '../../contexts/MapContext';
import moment from 'moment'; // Import moment for date formatting
import { useNavigate } from 'react-router-dom'; // Import useNavigate
// import MediaDetail from '../mediaContent/mediaDetail/MediaDetail'; // Import MediaDetail component
import { useModal } from '../../contexts/ModalContext';
import { useLanguage } from '../../contexts/LanguageContext';
import toast from 'react-hot-toast';
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
const formatCreationDate = (dateString, t) => {
  if (!dateString) return t('common.notAvailable');
  const date = moment(dateString);
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm') : t('common.invalidDate');
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
  const { t } = useLanguage();
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
  const [tooltipPosition, setTooltipPosition] = useState({ x: -1000, y: -1000, anchor: 'left', markerX: 0, markerY: 0, arrowX: 0, arrowY: 0 }); // Initialize tooltip off-screen
  const tooltipRef = useRef(null); // Ref for the tooltip div
  const mouseOutTimerRef = useRef(null); // Ref for the mouseout timer
  const [showTooltip, setShowTooltip] = useState(false);
  const [placeClickInfo, setPlaceClickInfo] = useState(null);
  const [showPlaceButtons, setShowPlaceButtons] = useState(false);
  const placesServiceRef = useRef(null);
  const { animatedMarkerId, setAnimatedMarkerId } = useMap();
  const { modalEventId, setModalEventId, openReportModal } = useModal();

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const { mapFocusLocation, setMapFocusLocation, setFocusMapFn, searchLocation, setSearchAddressFn, categorizedSearchResults, setCategorizedSearchResults, refreshEvents, hoveredEventId, setHoveredEventId, setGetUserLocationFn, setActiveDrawer, setSearchLocation, setIsSidebarExpanded } = useMap();
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
      // Convert to numbers and validate coordinates
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        console.error('Invalid coordinates provided:', { lat, lng });
        return;
      }
      
      // Clear any animated marker to prevent interference
      setAnimatedMarkerId(null);
      
      const targetLocation = { lat: latitude, lng: longitude };
      
      // Use a more aggressive approach for focusing
      mapRef.current.setCenter(targetLocation);
      mapRef.current.setZoom(18);
      setCenter(targetLocation); // Update the center state as well
      
      // Also use panTo as a fallback
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.panTo(targetLocation);
        }
      }, 100);
    }
  }, [isLoaded, setAnimatedMarkerId]); // Depend on isLoaded and setAnimatedMarkerId

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

  // Handle mapFocusLocation when component mounts or when it changes
  useEffect(() => {
    if (mapFocusLocation && mapFocusLocation.lat && mapFocusLocation.lng && focusMapOnLocation) {
      // Small delay to ensure map is ready
      setTimeout(() => {
        focusMapOnLocation(mapFocusLocation.lat, mapFocusLocation.lng);
        // Clear the mapFocusLocation after focusing
        setMapFocusLocation(null);
      }, 200);
    }
  }, [mapFocusLocation, focusMapOnLocation, setMapFocusLocation]); // Depend on mapFocusLocation and related functions

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

    // Initialize Places service
    placesServiceRef.current = new window.google.maps.places.PlacesService(map);

    // Add a click listener to the map to handle place clicks and hide tooltips
    map.addListener('click', (event) => {
       // Hide existing tooltips and place buttons
       setHoveredEvent(null);
       setTooltipPosition({ x: -1000, y: -1000, anchor: 'left-center', markerX: 0, markerY: 0 });
       setShowPlaceButtons(false);
       
       // Check if click was on a place
       if (event.placeId) {
         event.stop(); // Prevent default info window
         handlePlaceClick(event, map);
       }
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

  // Function to handle place clicks
  const handlePlaceClick = useCallback((event, map) => {
    if (!placesServiceRef.current) return;
    
    const request = {
      placeId: event.placeId,
      fields: ['name', 'formatted_address', 'geometry']
    };
    
    placesServiceRef.current.getDetails(request, (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        // Get screen coordinates for the actual clicked location (event.latLng)
        const projection = map.getProjection();
        if (projection && event.latLng) {
          const mapDiv = map.getDiv();
          const mapRect = mapDiv.getBoundingClientRect();
          // Use the actual click position instead of place geometry location
          const pixelPosition = projection.fromLatLngToPoint(event.latLng);
          const scale = Math.pow(2, map.getZoom());
          
          const screenX = pixelPosition.x * scale;
          const screenY = pixelPosition.y * scale;
          
          // Convert to actual screen coordinates
          const mapCenter = map.getCenter();
          const mapCenterPixel = projection.fromLatLngToPoint(mapCenter);
          const mapCenterX = mapCenterPixel.x * scale;
          const mapCenterY = mapCenterPixel.y * scale;
          
          const offsetX = screenX - mapCenterX;
          const offsetY = screenY - mapCenterY;
          
          const finalX = mapRect.width / 2 + offsetX;
          const finalY = mapRect.height / 2 + offsetY;
          
          setPlaceClickInfo({
            name: place.name,
            address: place.formatted_address,
            lat,
            lng,
            x: finalX,
            y: finalY
          });
          setShowPlaceButtons(true);
        }
      }
    });
  }, []);
  
  // Function to handle "Poing it" button click
  const handlePoingItClick = useCallback(() => {
    if (placeClickInfo && setSearchAddressFn) {
      // Set both the address and the search location for the blue marker
      setSearchAddressFn(placeClickInfo.address, placeClickInfo.lat, placeClickInfo.lng);
      setSearchLocation({ lat: placeClickInfo.lat, lng: placeClickInfo.lng });
      setActiveDrawer('location');
      setIsSidebarExpanded(false);
      setShowPlaceButtons(false);
    }
  }, [placeClickInfo, setSearchAddressFn, setSearchLocation, setActiveDrawer, setIsSidebarExpanded]);
  
  // Function to handle "Search" button click
  const handleSearchClick = useCallback(() => {
    if (placeClickInfo) {
      setSearchLocation({ lat: placeClickInfo.lat, lng: placeClickInfo.lng });
      setActiveDrawer('search');
      setIsSidebarExpanded(false);
      setShowPlaceButtons(false);
    }
  }, [placeClickInfo, setSearchLocation, setActiveDrawer, setIsSidebarExpanded]);

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
            setSearchAddressFn(t('map.unknownLocation'), lat, lng); // Update with unknown if no address found
          }
        } else {
          console.error('Geocoder failed due to:', status);
          setSearchAddressFn(t('map.geocodingFailed'), lat, lng); // Indicate geocoding failure
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
                     const offset = 25;
                     const padding = 10;
                     
                     // Calculate available space in each direction
                     const spaceRight = mapWidth - screenX - padding;
                     const spaceLeft = screenX - padding;
                     const spaceTop = screenY - padding;
                     const spaceBottom = mapHeight - screenY - padding;
                     
                     // Determine the best position based on available space
                     let tooltipX, tooltipY, anchorPosition, arrowX, arrowY;
                     
                     // Priority order: right, left, bottom, top (most professional looking)
                     if (spaceRight >= tooltipWidth + offset) {
                         // Position to the right
                         tooltipX = screenX + offset;
                         tooltipY = Math.max(padding, Math.min(screenY - tooltipHeight / 2, mapHeight - tooltipHeight - padding));
                         anchorPosition = 'left';
                         // Calculate exact arrow position to point at marker
                         arrowY = Math.max(9, Math.min(screenY - tooltipY, tooltipHeight - 9));
                     } else if (spaceLeft >= tooltipWidth + offset) {
                         // Position to the left with extra offset to avoid covering marker
                         const leftOffset = offset + 65; // Extra space to prevent covering marker
                         tooltipX = screenX - tooltipWidth - leftOffset;
                         tooltipY = Math.max(padding, Math.min(screenY - tooltipHeight / 2, mapHeight - tooltipHeight - padding));
                         anchorPosition = 'right';
                         // Calculate exact arrow position to point at marker
                         arrowY = Math.max(9, Math.min(screenY - tooltipY, tooltipHeight - 9));
                     } else if (spaceBottom >= tooltipHeight + offset) {
                         // Position below
                         tooltipY = screenY + offset;
                         tooltipX = Math.max(padding, Math.min(screenX - tooltipWidth / 2, mapWidth - tooltipWidth - padding));
                         anchorPosition = 'top';
                         // Calculate exact arrow position to point at marker
                         arrowX = Math.max(9, Math.min(screenX - tooltipX, tooltipWidth - 9));
                     } else if (spaceTop >= tooltipHeight + offset) {
                         // Position above
                         tooltipY = screenY - tooltipHeight - offset;
                         tooltipX = Math.max(padding, Math.min(screenX - tooltipWidth / 2, mapWidth - tooltipWidth - padding));
                         anchorPosition = 'bottom';
                         // Calculate exact arrow position to point at marker
                         arrowX = Math.max(9, Math.min(screenX - tooltipX, tooltipWidth - 9));
                     } else {
                         // Fallback: position where there's most space (right side preferred)
                         if (spaceRight >= spaceLeft) {
                             tooltipX = screenX + offset;
                             anchorPosition = 'left';
                             arrowY = Math.max(9, Math.min(screenY - tooltipY, tooltipHeight - 9));
                         } else {
                             const leftOffset = offset + 15; // Extra space to prevent covering marker
                             tooltipX = screenX - tooltipWidth - leftOffset;
                             anchorPosition = 'right';
                             arrowY = Math.max(9, Math.min(screenY - tooltipY, tooltipHeight - 9));
                         }
                         tooltipY = Math.max(padding, Math.min(screenY - tooltipHeight / 2, mapHeight - tooltipHeight - padding));
                     }
                     
                     setTooltipPosition({ 
                         x: tooltipX, 
                         y: tooltipY, 
                         anchor: anchorPosition,
                         markerX: screenX,
                         markerY: screenY,
                         arrowX: arrowX,
                         arrowY: arrowY
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
                 setTooltipPosition({ x: -1000, y: -1000, anchor: 'left', markerX: 0, markerY: 0, arrowX: 0, arrowY: 0 }); // Hide tooltip by moving it off-screen
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
            ? t('map.eventMarkerTitle', { category: item.category || t('common.unknown') })
            : t('map.searchMarkerTitle', { label: item.label }),
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

  // Effect to apply glow animation to markers
  useEffect(() => {
    // Remove glow from all markers first
    const allMarkerImages = document.querySelectorAll('img[src*=".svg"]');
    allMarkerImages.forEach(img => {
      img.classList.remove('marker-glow');
      img.parentElement?.classList.remove('marker-glow');
      // Remove the data attribute used for identification
      img.removeAttribute('data-event-id');
    });
    
    if (animatedMarkerId) {
      // Find the marker to animate
      const targetMarker = markersRef.current.find(marker => 
        marker.eventData && marker.eventData.id === animatedMarkerId
      );
      
      if (targetMarker) {
        // Add glow effect using CSS by finding the marker's DOM element
        setTimeout(() => {
          const markerPosition = targetMarker.getPosition();
          if (markerPosition) {
            // Find the specific marker image in the DOM by position matching
            const markerImages = document.querySelectorAll('img[src*=".svg"]');
            let targetImage = null;
            let minDistance = Infinity;
            
            markerImages.forEach(img => {
              const imgRect = img.getBoundingClientRect();
              const imgCenterX = imgRect.left + imgRect.width / 2;
              const imgCenterY = imgRect.top + imgRect.height / 2;
              
              // Convert marker position to screen coordinates
              if (mapRef.current) {
                const projection = mapRef.current.getProjection();
                if (projection) {
                  const pixelPosition = projection.fromLatLngToPoint(markerPosition);
                  const scale = Math.pow(2, mapRef.current.getZoom());
                  const mapDiv = mapRef.current.getDiv();
                  const mapRect = mapDiv.getBoundingClientRect();
                  
                  const markerX = pixelPosition.x * scale;
                  const markerY = pixelPosition.y * scale;
                  
                  const mapCenter = mapRef.current.getCenter();
                  const mapCenterPixel = projection.fromLatLngToPoint(mapCenter);
                  const mapCenterX = mapCenterPixel.x * scale;
                  const mapCenterY = mapCenterPixel.y * scale;
                  
                  const relativeX = markerX - mapCenterX;
                  const relativeY = markerY - mapCenterY;
                  
                  const screenX = mapRect.left + (mapDiv.clientWidth / 2) + relativeX;
                  const screenY = mapRect.top + (mapDiv.clientHeight / 2) + relativeY;
                  
                  // Calculate distance between image center and marker screen position
                  const distance = Math.sqrt(
                    Math.pow(imgCenterX - screenX, 2) + Math.pow(imgCenterY - screenY, 2)
                  );
                  
                  // Find the closest image (should be the exact marker)
                  if (distance < minDistance && distance < 50) { // 50px tolerance
                    minDistance = distance;
                    targetImage = img;
                  }
                }
              }
            });
            
            // Apply glow to the closest matching image
            if (targetImage) {
              targetImage.classList.add('marker-glow');
              targetImage.setAttribute('data-event-id', animatedMarkerId);
              if (targetImage.parentElement) {
                targetImage.parentElement.classList.add('marker-glow');
              }
            }
          }
        }, 200); // Increased timeout to ensure DOM is ready
      }
    }
    
    // Cleanup function
    return () => {
      // Remove glow from all marker elements
      const allMarkerImages = document.querySelectorAll('img[src*=".svg"]');
      allMarkerImages.forEach(img => {
        img.classList.remove('marker-glow');
        img.parentElement?.classList.remove('marker-glow');
        img.removeAttribute('data-event-id');
      });
      
      // Also clean up any remaining glow effects
      const glowElements = document.querySelectorAll('.marker-glow');
      glowElements.forEach(el => el.classList.remove('marker-glow'));
    };
  }, [animatedMarkerId]);

  return (
    <div className="w-full h-full pt-6 sm:pt-11 pl-0 pr-4 sm:px-4 md:px-8 lg:px-12 overflow-x-hidden">
      <div className="w-full mb-8 px-2">
        <p className="text-gray-600 text-sm sm:text-base md:text-lg lg:text-xl mb-4 text-center leading-relaxed">
          {t('home.description')}
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
                    anchor: new window.google.maps.Point(25, 25)
                  }}
                  title={t('map.dragToSelectLocation')}
                />
              )}

              {/* searchMarkers are now handled in the useEffect hook above for proper icon assignment and to avoid duplicates */}

              {/* Existing markers (clustered events and static search markers from API) are handled in useEffects */}

            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-blue-700 font-bold">
              {t('map.loadingMap')}
            </div>
          )}

          {/* Always render the tooltip for fade effect */}
          <div
            ref={tooltipRef}
            className={`event-tooltip absolute z-20 bg-white text-gray-800 p-4 rounded-xl shadow-2xl border border-gray-200 transition-opacity duration-400
              ${hoveredEvent ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            style={{
              top: tooltipPosition.y,
              left: tooltipPosition.x,
              minWidth: '220px',
              maxWidth: '260px',
            }}
          >
            {/* Tooltip Arrow */}
            <div
              className="absolute"
              style={{
              // Left side arrows (tooltip is to the right of marker)
              ...(tooltipPosition.anchor === 'left' && {
                left: '-9px',
                top: `${tooltipPosition.arrowY}px`,
              }),
              
              // Right side arrows (tooltip is to the left of marker)
              ...(tooltipPosition.anchor === 'right' && {
                right: '-9px',
                top: `${tooltipPosition.arrowY}px`,
              }),
              
              // Top arrows (tooltip is below marker)
              ...(tooltipPosition.anchor === 'top' && {
                top: '-9px',
                left: `${tooltipPosition.arrowX}px`,
              }),
              
              // Bottom arrows (tooltip is above marker)
              ...(tooltipPosition.anchor === 'bottom' && {
                bottom: '-9px',
                left: `${tooltipPosition.arrowX}px`,
              }),
            }}
            >
              {/* Arrow border (gray) */}
               <div
                 className="absolute w-0 h-0"
                 style={{
                   // Left side arrows - border
                   ...(tooltipPosition.anchor === 'left' && {
                     borderTop: '9px solid transparent',
                     borderBottom: '9px solid transparent',
                     borderRight: '9px solid #d1d5db',
                   }),
                   
                   // Right side arrows - border
                   ...(tooltipPosition.anchor === 'right' && {
                     borderTop: '9px solid transparent',
                     borderBottom: '9px solid transparent',
                     borderLeft: '9px solid #d1d5db',
                   }),
                   
                   // Top arrows - border
                   ...(tooltipPosition.anchor === 'top' && {
                     borderLeft: '9px solid transparent',
                     borderRight: '9px solid transparent',
                     borderBottom: '9px solid #d1d5db',
                   }),
                   
                   // Bottom arrows - border
                   ...(tooltipPosition.anchor === 'bottom' && {
                     borderLeft: '9px solid transparent',
                     borderRight: '9px solid transparent',
                     borderTop: '9px solid #d1d5db',
                   }),
                 }}
               />
              {/* Arrow fill (white) */}
              <div
                className="absolute w-0 h-0"
                style={{
                  // Left side arrows - fill
                  ...(tooltipPosition.anchor === 'left' && {
                    left: '1px',
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent',
                    borderRight: '8px solid white',
                  }),
                  
                  // Right side arrows - fill
                  ...(tooltipPosition.anchor === 'right' && {
                    right: '1px',
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent',
                    borderLeft: '8px solid white',
                  }),
                  
                  // Top arrows - fill
                  ...(tooltipPosition.anchor === 'top' && {
                    top: '1px',
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderBottom: '8px solid white',
                  }),
                  
                  // Bottom arrows - fill
                  ...(tooltipPosition.anchor === 'bottom' && {
                    bottom: '1px',
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderTop: '8px solid white',
                  }),
                }}
              />
            </div>
            <div className="mb-3">
              <h3 className="font-bold text-lg mb-2 text-gray-900">{hoveredEvent?.category === 'LostFound' ? t('categories.lost') : t(`categories.${hoveredEvent?.category?.toLowerCase()}`) || t('common.unknownCategory')}</h3>
              <p className="text-sm text-gray-600 mb-1">{hoveredEvent?.address || t('common.noAddress')}</p>
              <p className="text-sm text-red-500 font-medium">
                {hoveredEvent?.date ? moment(hoveredEvent.date).format('MMM DD, YYYY') : t('common.notAvailable')}
              </p>
            </div>
            {/* Media Info Row */}
            <div className="grid grid-cols-2 gap-3 mb-4" style={{ width: '100%' }}>
              <div
                className="bg-gray-50 text-gray-700 text-sm rounded-lg flex flex-col justify-center items-center p-3"
                style={{ height: 100 }}
              >
                <div className="text-center font-medium">
                  {parseMediaAndCount(hoveredEvent?.media).videoCount > 0 &&
                    t('common.videoCount', { count: parseMediaAndCount(hoveredEvent?.media).videoCount })}
                </div>
                <div className="text-center font-medium">
                  {parseMediaAndCount(hoveredEvent?.media).imageCount > 0 &&
                    `${parseMediaAndCount(hoveredEvent?.media).imageCount} photo(s)`}
                </div>
              </div>
              <div
                className="bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center"
                style={{ height: 100, width: '100%' }}
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
                          className="w-full h-full object-contain"
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
                        className="object-contain w-full h-full"
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                      />
                    );
                  } else {
                    return <span className="text-gray-500 text-xs">{t('common.noMedia')}</span>;
                  }
                })()}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
              {hoveredEvent?.description
                ? hoveredEvent.description.length > 120
                  ? `${hoveredEvent.description.substring(0, 120)}...`
                  : hoveredEvent.description
                : t('common.noDescription')}
            </p>

            {/* Action Buttons - Only show claim button if user is not the event owner */}
            {(() => {
              const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
              const currentUserId = currentUser.id;
              const isOwner = hoveredEvent?.sellerId === currentUserId;
              
              return !isOwner ? (
                <div className="flex gap-3 mb-3">
                  <button
                    className="flex-1 bg-blue-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    onClick={() => {
                      navigate(`/event/${hoveredEvent?.id}`);
                    }}
                  >
                    {t('common.claim')}
                  </button>
                </div>
              ) : null;
            })()}

            {/* Listing ID and Posted Date */}
            <div className="text-xs text-gray-500 pt-2 border-t border-gray-200 space-y-1">
              <div className="font-medium">{t('common.id')}: {hoveredEvent?.eventCode || t('common.notAvailable')}</div>
              <div className="font-medium">
                {t('common.posted')}: {hoveredEvent?.createdAt ? 
                  new Date(hoveredEvent.createdAt).toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit', 
                    year: 'numeric'
                  }) : t('common.notAvailable')
                }
              </div>
              
              {/* Report Button - New Design - Only show if user is not the event owner */}
              {(() => {
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const currentUserId = currentUser.id;
                const isOwner = hoveredEvent?.sellerId === currentUserId;
                
                return !isOwner ? (
                  <div className="pt-2">
                    <button
                      className="flex items-center gap-2 bg-white text-red-500 text-sm hover:cursor-pointer transition-colors font-medium"
                      onClick={() => {
                        openReportModal(hoveredEvent?.id);
                      }}
                    >
                      <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">!</span>
                      </div>
                      {t('common.report')}
                    </button>
                  </div>
                ) : null;
              })()}
            </div>
          </div>

          {/* Place Click Buttons */}
          {showPlaceButtons && placeClickInfo && (
            <div
              className="absolute z-30 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 backdrop-blur-sm"
              style={{
                top: placeClickInfo.y - 150,
                left: placeClickInfo.x,
                minWidth: '240px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
                transform: 'translateX(-50%)'
              }}
            >
              {/* Location Icon and Name */}
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <MapPin className="w-4 h-4 text-[#0868A8]" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900 leading-tight">
                    {placeClickInfo.name}
                  </div>
                  {placeClickInfo.address && (
                    <div className="text-xs text-gray-500 mt-1 truncate">
                      {placeClickInfo.address.length > 30 
                        ? placeClickInfo.address.substring(0, 30) + '...' 
                        : placeClickInfo.address
                      }
                    </div>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handlePoingItClick}
                  className="flex-1 bg-[#0868A8] text-white text-sm px-4 py-2.5 rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  {t('common.poingIt')}
                </button>
                <button
                  onClick={handleSearchClick}
                  className="flex-1 bg-gradient-to-r bg-[#CE69FF] text-white text-sm px-4 py-2.5 rounded-lg transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  {t('common.search')}
                </button>
              </div>
              
              {/* Small arrow pointing down */}
              <div 
                className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-gray-100 rotate-45"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)'
                }}
              ></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeContent;
