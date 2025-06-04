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
  const [tooltipPosition, setTooltipPosition] = useState({ x: -1000, y: -1000 }); // Initialize tooltip off-screen
  const tooltipRef = useRef(null); // Ref for the tooltip div
  const mouseOutTimerRef = useRef(null); // Ref for the mouseout timer

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const { mapFocusLocation, setMapFocusLocation, setFocusMapFn, searchLocation, setSearchAddressFn, categorizedSearchResults, setCategorizedSearchResults, refreshEvents } = useMap();
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

    // Add a click listener to the map to hide tooltip when clicking elsewhere
    map.addListener('click', () => {
       setHoveredEvent(null);
       setTooltipPosition({ x: -1000, y: -1000 }); // Hide tooltip immediately on map click
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
            'Accident': '/accident.svg',
            'Pet': '/pet.svg',
            'Crime': '/crime.svg',
            'Other': '/other.svg',
            'People': '/people.svg'
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

             // Position tooltip relative to the map container
             if (mapRef.current && event.domEvent) {
                 const mapDiv = mapRef.current.getDiv();
                 const mapRect = mapDiv.getBoundingClientRect();
                 const tooltipX = event.domEvent.clientX - mapRect.left;
                 const tooltipY = event.domEvent.clientY - mapRect.top;
                 setTooltipPosition({ x: tooltipX, y: tooltipY });
                 console.log('Calculated tooltip position:', { x: tooltipX, y: tooltipY });
             }
          });

          const mouseoutListener = marker.addListener('mouseout', () => {
             console.log('Mouse out event marker:', item.id);
             // Set a timer to hide the tooltip after a short delay
             // The tooltip's mouseover will clear this timer if the mouse enters the tooltip
             mouseOutTimerRef.current = setTimeout(() => {
                 setHoveredEvent(null);
                 setTooltipPosition({ x: -1000, y: -1000 }); // Hide tooltip by moving it off-screen
             }, 100); // Use a slightly longer delay here
          });

          marker._listeners = { mouseover: mouseoverListener, mouseout: mouseoutListener };

          return marker;

        } else if (item.type === 'searchMarker') {
          // Keep existing logic for search markers
          const category = item.label;
          if (category === 'Accident') {
            iconUrl = '/accident3.svg';
          } else {
            const lowerCaseCategory = category.toLowerCase().replace(/[^a-z0-9]/g, '');
            iconUrl = `/${lowerCaseCategory}3.svg`;
          }

          const marker = new window.google.maps.Marker({
              position,
              icon: {
                  url: iconUrl,
                  scaledSize: new window.google.maps.Size(50, 50),
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
                    setTooltipPosition({ x: -1000, y: -1000 });
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

  // Component to render the list view (keep existing logic)
  const renderListView = () => {
    if (!categorizedSearchResults) {
      return (
        <div className="text-center text-gray-600 mt-8">
          <p className="text-lg font-semibold mb-2">No search results to display.</p>
          <p>Perform a search using the Search drawer.</p>
        </div>
      );
    }

    const frontendCategories = ['within 1 mile', 'within 3 miles', 'within 5 miles', 'within 6-200 miles'];
    const categoryIcons = { // Define category icons here or import from a shared file
      'Accident': <img src="/accident.svg" alt="Accident" className="w-5 h-5" />,
      'Pet': <img src="/pet.svg" alt="Pet" className="w-5 h-5" />,
      'Lost & Found': <img src="/lostnfound.svg" alt="Lost and Found" className="w-5 h-5" />,
      'Crime': <img src="/crime.svg" alt="Crime" className="w-5 h-5" />,
      'People': <img src="/people.svg" alt="People" className="w-5 h-5" />,
      'Other': <img src="/others.svg" alt="Other" className="w-5 h-5" />
    };

    return (
      <div className="overflow-y-auto h-full p-4 scrollbar-hide">
        {frontendCategories.map(category => (
          <div key={category} className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">{category}</h3>
            {categorizedSearchResults[category] && categorizedSearchResults[category].length > 0 ? (
              <div className="space-y-4">
                {categorizedSearchResults[category].map((event) => (
                  <div 
                    key={event.id} 
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                    onClick={() => {
                      console.log('Event card clicked in ListView:', event.id, event.latitude, event.longitude);
                      if (focusMapFn) { // Use focusMapFn from context to pan/zoom
                         focusMapFn(event.latitude, event.longitude);
                      }
                      // Optionally switch back to map view on click
                       setActiveView('mapView');
                    }}
                  >
                    <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {event.media && event.media[0] ? (
                        event.media[0].type === 'video' ? (
                          <video 
                            src={event.media[0].url} 
                            className="w-full h-full object-cover"
                            controls
                          />
                        ) : (
                          <img 
                            src={event.media[0].url} 
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300">
                          {/* Placeholder icon if no media */}
                           {categoryIcons[event.category] || <MapPin size={24} className="text-gray-500" />} 
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {categoryIcons[event.category]} 
                        <h4 className="font-medium text-gray-900">{event.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{event.address}</p>
                      <div className="flex items-center gap-2">
                        {!event.isFree && (
                          <span className="text-sm font-medium text-green-600">${event.price}</span>
                        )}
                        {event.isExclusive && (
                          <span className="flex items-center gap-1 text-sm text-purple-600">
                            <Lock size={14} />
                            Exclusive
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Download Button */}
                    <div className="flex-shrink-0">
                       <button 
                          onClick={(e) => { // Add event handler
                              e.stopPropagation(); // Prevent card click event from firing
                              console.log('Download button clicked for event:', event.id);
                              
                              const token = localStorage.getItem('token');

                              if (!token) {
                                  console.log('User not authenticated. Showing login modal.');
                                  setShowLoginModal(true); // Show login modal
                                  return; // Stop execution if not authenticated
                              }

                              const eventId = event.id; // Get the event ID
                              const purchaseUrl = `${import.meta.env.VITE_API_URL}stripe/purchase/${eventId}`;

                              axios.post(purchaseUrl,{}, {
                                headers: {
                                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                                }
                              })
                              .then(response => {
                                  console.log('Stripe purchase API response:', response.data);
                                  if (response.data && response.data.url) {
                                      // Redirect to Stripe page in the same tab
                                      window.location.href = response.data.url;
                                  } else {
                                      alert('Failed to get Stripe checkout URL from API.');
                                  }
                              })
                              .catch(error => {
                                  console.error('Error calling Stripe purchase API:', error);
                                  alert(error.response?.data?.message || 'Failed to initiate purchase. Please try again.');
                                  // Optionally check for 401 and show login modal again
                                  if (error.response && error.response.status === 401) {
                                       setShowLoginModal(true);
                                  }
                              });
                          }}
                          className="bg-green-500 text-white py-1 px-2 rounded hover:bg-green-600"
                       >
                          Download
                       </button>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-600 mt-8">
                <p className="text-lg font-semibold mb-2">No events found in this category.</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full px-4 sm:px-8 lg:px-12 overflow-x-hidden">
      <div className="w-full flex flex-col items-center">
        <img src="/brandLogo.png" alt="Poing Logo" className="w-30 object-contain" />
        <p className="text-gray-600 text-lg mb-4 text-center">The only search, find or post tool for lost items, pets, people, witnesses and event by location and time.</p>
      </div>

      <div className="flex w-full h-[calc(100%-7.5rem)] bg-gray-100 relative"> {/* Add relative positioning here */}
        {/* Map and List View Container - Now takes full width */}
        <div className="flex-1 rounded-lg overflow-hidden relative">
           {/* Toggle Buttons */}
           <div className="absolute top-4 right-4 z-10 flex space-x-2">
              <button
                 onClick={() => setActiveView('mapView')}
                 className={`px-4 py-2 text-sm font-medium rounded-md ${activeView === 'mapView' ? 'bg-[#0868a8] text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                 Map View
              </button>
              <button
                 onClick={() => setActiveView('listView')}
                 className={`px-4 py-2 text-sm font-medium rounded-md ${activeView === 'listView' ? 'bg-[#0868a8] text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                 List View
              </button>
           </div>

          {isLoaded ? (
            activeView === 'mapView' ? (
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
                {console.log('Rendering search marker?', searchLocation, isLoaded)}
                {searchLocation && isLoaded && (
                  console.log('Rendering search marker at:', searchLocation),
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

                {/* Existing markers (clustered events and static search markers from API) are handled in useEffects */}

              </GoogleMap>
            ) : ( // Render List View
               renderListView()
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl text-blue-700 font-bold">
              Loading Map...
            </div>
          )}

          {/* Custom Event Tooltip */}
          {hoveredEvent && tooltipPosition.x > -1000 && (
            <div
              ref={tooltipRef} // Attach ref to tooltip div
              className="event-tooltip absolute z-20 bg-gray-200 text-gray-800 p-3 rounded shadow-lg pointer-events-auto"
              style={{
                top: tooltipPosition.y + 15, // Adjust offset as needed
                left: tooltipPosition.x + 15, // Adjust offset as needed
                minWidth: '200px', // Ensure minimum width
                maxWidth: '300px', // Ensure maximum width
              }}
            >
              <h3 className="font-bold text-base mb-1">{hoveredEvent.category || 'Unknown Category'}</h3>
              <p className="text-xs mb-1">{hoveredEvent.address || 'No address'}</p>
              <p className="text-xs text-red-600 mb-2">{formatCreationDate(hoveredEvent.createdAt)}</p>

              {/* Media Info Row */}
              <div className="flex gap-2 mb-2">
                 <div className="flex-1 bg-white text-gray-800 text-xs p-1 rounded flex items-center justify-center text-center">
                   {`${parseMediaAndCount(hoveredEvent.media).imageCount} image(s) and ${parseMediaAndCount(hoveredEvent.media).videoCount} video(s)`}
                 </div>
                 <div className="w-12 h-12 bg-gray-300 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {parseMediaAndCount(hoveredEvent.media).firstMediaType === 'image' ? (
                       <img src={parseMediaAndCount(hoveredEvent.media).firstMediaUrl} alt="Media" className="w-full h-full object-cover"/>
                    ) : parseMediaAndCount(hoveredEvent.media).firstMediaType === 'video' ? (
                       <video src={parseMediaAndCount(hoveredEvent.media).firstMediaUrl} className="w-full h-full object-cover"/>
                    ) : (
                       <span className="text-gray-500 text-xs">No Media</span>
                    )}
                 </div>
              </div>

              {/* Description */}
              <p className="text-xs mb-2">
                 {hoveredEvent.description ? hoveredEvent.description.slice(0, 50) + (hoveredEvent.description.length > 50 ? '...' : '') : 'No description'}
              </p>

              {/* Claim Button */}
              <button
                 onClick={() => {
                    console.log('Claim button clicked for event:', hoveredEvent.id);
                    navigate(`/event/${hoveredEvent.id}`, { state: { event: hoveredEvent } }); // Pass event object in state
                 }}
                 className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700 mb-2"
              >
                 Claim
              </button>

              {/* Listing ID */}
              <p className="text-xs">Listing ID: {hoveredEvent.id}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default HomeContent;
