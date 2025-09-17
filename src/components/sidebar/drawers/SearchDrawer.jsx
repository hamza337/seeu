import { X, SquareActivity, PawPrint, Bike, Camera, Users, MapPin, Glasses, Lock, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import axios from 'axios';
import { debounce } from 'lodash';
import { useMap } from '../../../contexts/MapContext';
import toast from 'react-hot-toast';
import ResultsDrawer from './ResultsDrawer';

export default function SearchDrawer({ isOpen, onClose, onEventClick }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [location, setLocation] = useState({ lat: null, lng: null, address: '' });
  const [dateRangeError, setDateRangeError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const autocompleteRef = useRef(null);
  const baseUrl = import.meta.env.VITE_API_URL;
  const drawerRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const { 
    setSearchLocation, 
    setSetSearchAddressFn, 
    setCategorizedSearchResults, 
    notifyMeParams,
    setNotifyMeParams,
    setShowLoginModal,
    showLoginModal,
    isSidebarExpanded,
    setSearchResults,
    setActiveDrawer,
    setActiveSearchQuery,
    setNotifyMePayload,
    setClearAllEntriesFn,
  } = useMap();

  // Sidebar widths in px (match layout/sidebar)
  const collapsedSidebarWidthPx = 56;
  const expandedSidebarWidthPx = 256;
  
  // Responsive drawer width and positioning
  const drawerWidthPx = isMobile ? Math.min(window.innerWidth - 80, 320) : 415; // Mobile: leave space for sidebar, Desktop: 415px
  const leftPx = isSidebarExpanded ? expandedSidebarWidthPx : collapsedSidebarWidthPx;
  
  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to reset all search fields
  const resetSearchFields = () => {
    setSelectedCategories([]);
    setLocation({ lat: null, lng: null, address: '' });
    setStartDate(null);
    setEndDate(null);
    setDateRangeError('');
    setCategoryError('');
    setLocationError('');
    setSearchResults(null);
    setActiveSearchQuery(null);
    setNotifyMePayload(null);
    setSearchLocation(null);
    
    // Clear the autocomplete input field
    if (autocompleteRef.current && autocompleteRef.current.input) {
      autocompleteRef.current.input.value = '';
    }
  };

  // Register the reset function with MapContext
  useEffect(() => {
    setClearAllEntriesFn(() => resetSearchFields);
    return () => setClearAllEntriesFn(null);
  }, [setClearAllEntriesFn]);

  useEffect(() => {
    if (!isOpen) {
      console.log('SearchDrawer: Clearing state due to isOpen becoming false.');
      setSelectedCategories([]);
      setNotifyMeParams(null);
    }
  }, [isOpen, setSelectedCategories, setNotifyMeParams]);

  useEffect(() => {
    if (isOpen) {
      console.log('SearchDrawer: Setting setSearchAddressFn in context.');
      setSetSearchAddressFn(() => (address, lat, lng) => {
        console.log('SearchDrawer: Setting location from map:', { address, lat, lng });
        setLocation({ address, lat, lng });
        // Force update the input field
        if (autocompleteRef.current) {
          const input = autocompleteRef.current.input;
          if (input) {
            input.value = address;
          } else {
            console.warn('SearchDrawer: Autocomplete input element not found.');
          }
        } else {
          console.warn('SearchDrawer: Autocomplete reference not found.');
        }
      });
    } else {
      console.log('SearchDrawer: Clearing setSearchAddressFn in context.');
      setSetSearchAddressFn(null);
    }
    // Cleanup function
    return () => {
      console.log('SearchDrawer: Running cleanup for setSearchAddressFn effect.');
      // Only clear if it's still our function
      setSetSearchAddressFn(prevFn => {
          // Check if the function in context is the one we set
          if (prevFn && prevFn.toString() === ((address, lat, lng) => {
              console.log('SearchDrawer: Setting location from map:', { address, lat, lng });
              setLocation({ address, lat, lng });
              // Force update the input field
              if (autocompleteRef.current) {
                const input = autocompleteRef.current.input;
                if (input) {
                  input.value = address;
                } else {
                  console.warn('SearchDrawer: Autocomplete input element not found.');
                }
              }
            }).toString()) {
              return null;
          } else {
              return prevFn; // Keep the function if it's not ours
          }
      });
    };
  }, [isOpen, setSetSearchAddressFn, setLocation]);

  const handleDropdownToggle = () => setIsDropdownOpen(!isDropdownOpen);

  // Define the category options with icons for the dropdown grid
  const categoryOptions = [
    { label: 'Accident', icon: <img src="/accident.svg" alt="Accident" className="w-14 h-14" />, textClass: 'text-red-600' },
    { label: 'Pet', icon: <img src="/pet.svg" alt="Pet" className="w-14 h-14" />, textClass: '' },
    { label: 'Lost & Found', icon: <img src="/lost.svg" alt="Lost and Found" className="w-14 h-14" />, textClass: '' },
    { label: 'Crime', icon: <img src="/crime.svg" alt="Crime" className="w-14 h-14" />, textClass: 'text-red-600' },
    { label: 'People', icon: <img src="/people.svg" alt="People" className="w-14 h-14" />, textClass: '' },
    { label: 'Other', icon: <img src="/others.svg" alt="Other" className="w-14 h-14" />, textClass: '' },
  ];

  const debouncedPlaceChanged = debounce(() => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        console.log('Autocomplete selected location:', { lat, lng });
        setSearchLocation({ lat, lng });
        setLocation(prev => ({ ...prev, lat, lng, address: place.formatted_address }));
        setLocationError(''); // Clear location error when valid location is selected
      } else if (place.hasOwnProperty('name')) {
        setLocation(prev => ({ ...prev, lat: null, lng: null, address: place.name }));
        setSearchLocation(null);
      } else {
        setLocation({ lat: null, lng: null, address: autocompleteRef.current.getPlace().name || '' });
        setSearchLocation(null);
      }
    } else {
      setLocation({ lat: null, lng: null, address: '' });
      setSearchLocation(null);
    }
  }, 1500);

  const handleAddressInputChange = (e) => {
    const address = e.target.value;
    setLocation(prev => ({ ...prev, address }));
    debouncedPlaceChanged();
  };

  // Add this new function to handle marker drag updates
  const handleMarkerDrag = (newAddress, lat, lng) => {
    console.log('SearchDrawer: Updating address from marker drag:', { newAddress, lat, lng });
    setLocation({ address: newAddress, lat, lng });
    setLocationError(''); // Clear location error when location is selected via marker
  };

  useEffect(() => {
    return () => { debouncedPlaceChanged.cancel(); };
  }, [debouncedPlaceChanged]);

  const handlePlaceChanged = () => {
    debouncedPlaceChanged();
  };

  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          // Use Google's Geocoding service to get address from coordinates
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat, lng } },
            (results, status) => {
              if (status === 'OK' && results[0]) {
                setLocation({
                  address: results[0].formatted_address,
                  lat,
                  lng
                });
                setLocationError('');
                setSearchLocation({ lat, lng });
                // Update the autocomplete input field
                if (autocompleteRef.current && autocompleteRef.current.input) {
                  autocompleteRef.current.input.value = results[0].formatted_address;
                }
              } else {
                setLocation({
                  address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                  lat,
                  lng
                });
                setLocationError('');
                setSearchLocation({ lat, lng });
                // Update the autocomplete input field
                if (autocompleteRef.current && autocompleteRef.current.input) {
                  autocompleteRef.current.input.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                }
              }
            }
          );
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError('Unable to get your location. Please enter manually.');
        }
      );
    } else {
      setLocationError('Geolocation is not supported by this browser.');
    }
  };

  const handleSearch = async () => {
    // Reset all error states
    setDateRangeError('');
    setCategoryError('');
    setLocationError('');
    
    // Validate form inputs
    let hasErrors = false;
    
    if (selectedCategories.length === 0) {
      setCategoryError('Please select at least one category.');
      hasErrors = true;
    }
    
    if (!location.lat || !location.lng) {
      setLocationError('Please select a location.');
      hasErrors = true;
    }
    
    if (hasErrors) {
      return;
    }
    // Keep notifyMeParams and searchResults for now, clear them after fetching

    try {
      let dateFrom = null;
      let dateTo = null;
      if (startDate) {
        const year = startDate.getFullYear();
        const month = String(startDate.getMonth() + 1).padStart(2, '0');
        const day = String(startDate.getDate()).padStart(2, '0');
        dateFrom = `${year}-${month}-${day}`;
      }
      if (endDate) {
        const year = endDate.getFullYear();
        const month = String(endDate.getMonth() + 1).padStart(2, '0');
        const day = String(endDate.getDate()).padStart(2, '0');
        dateTo = `${year}-${month}-${day}`;
      }

      const categoriesString = selectedCategories.join(',');

      const response = await axios.get(`${baseUrl}events/search`, {
        params: {
          categories: categoriesString,
          lat: location.lat,
          lng: location.lng,
          dateFrom: dateFrom,
          dateTo: dateTo
        }
      });
      console.log('Search Results:', response.data);
      setSearchResults(response.data);
      setSearchLocation(null); // Clear blue location marker when search results are shown
      // Set the active search query for the results drawer
      setActiveSearchQuery({
        categories: selectedCategories,
        address: location.address,
        lat: location.lat,
        lng: location.lng,
        dateFrom: startDate,
        dateTo: endDate,
      });
      setNotifyMePayload({
        categories: selectedCategories,
        lat: location.lat,
        lng: location.lng,
      });
      setActiveDrawer('results');

    } catch (error) {
      console.error('Error searching events:', error);
      if (error.response && error.response.status === 404) {
        console.log('Search received 404. Displaying No Record found and Notify Me option.');
        setSearchResults({ status: 404 });
        setSearchLocation(null); // Clear blue location marker when search results are shown
        // Set the active search query for the results drawer even when 404 occurs
        setActiveSearchQuery({
          categories: selectedCategories,
          address: location.address,
          lat: location.lat,
          lng: location.lng,
          dateFrom: startDate,
          dateTo: endDate,
        });
        setNotifyMePayload({
          categories: selectedCategories,
          lat: location.lat,
          lng: location.lng,
        });
        setActiveDrawer('results');
      } else {
        console.error('An unexpected error occurred during search:', error);
      }
    }
  };

  const handleNotifyMe = async () => {
      console.log('Notify Me button clicked.');
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (user && token && notifyMeParams) {
          console.log('User authenticated. Calling notify-me API.');
          try {
              const response = await axios.post(`${baseUrl}events/notify-me`, notifyMeParams, {
                  headers: {
                      'Authorization': `Bearer ${token}`
                  }
              });
              if (response.status === 201) {
                  toast.success('Notification request successful! We will notify you if events match your criteria.');
                  setNotifyMeParams(null);
                  setSearchResults(null);
              } else {
                   toast.error('Failed to subscribe for notifications.');
              }
          } catch (error) {
               console.error('Error calling notify-me API:', error);
               toast.error(error.response?.data?.message || 'Failed to subscribe for notifications.');
          }
      } else {
          console.log('User not authenticated. Opening login modal.');
          setShowLoginModal(true);
      }
  };

  return (
    <div
      ref={drawerRef}
      className={` pt-26 fixed top-0 left-0 h-screen z-[100] bg-white shadow-lg transition-all duration-500 ease-in-out ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      style={{
        left: `${leftPx}px`,
        width: `${drawerWidthPx + 10}px`,
        boxShadow: isOpen ? '0 0 24px 0 rgba(0,0,0,0.12)' : 'none',
      }}
    >
      <div className={`${isMobile ? 'px-4 pt-4' : 'px-6 pt-6 pb-4'} flex justify-between items-center border-b`}>
        <h2 className={`${isMobile ? 'text-base' : 'text-2xl'} text-black font-semibold`}>Search</h2>
        <X onClick={onClose} className="text-gray-600 hover:text-black cursor-pointer" />
      </div>
      <div className={`overflow-y-auto h-[calc(100vh-4rem)] ${isMobile ? 'px-4 pb-4 pt-2' : 'px-6 pb-6 pt-3'} scrollbar-hide`}>
        {/* Categories Field - now a grid, not a dropdown */}
        <div className="mb-4">
          <label className={`block text-gray-800 font-semibold ${isMobile ? 'mb-1.5 text-sm' : 'mb-2'}`}>Select Categories</label>
          <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-3 gap-4'}`}>
            {categoryOptions.map((item) => {
              const cleanedLabel = item.label.replace(' & ', '');
              const isSelected = selectedCategories.includes(cleanedLabel);
              return (
                <div
                  key={item.label}
                  onClick={() => {
                    setSelectedCategories(prev => {
                      if (isSelected) {
                        setCategoryError('');
                        return prev.filter(cat => cat !== cleanedLabel);
                      } else {
                        setCategoryError('');
                        if (prev.length < 2) {
                          return [...prev, cleanedLabel];
                        } else {
                          // Remove the first (oldest) selection and add the new one
                          return [prev[1], cleanedLabel];
                        }
                      }
                    });
                  }}
                  className={`relative flex flex-col items-center justify-center ${isMobile ? 'p-1.5' : 'p-2'} rounded-lg cursor-pointer transition-colors duration-200
                    ${isSelected ? 'opacity-100' : selectedCategories.length >= 2 ? 'opacity-40 grayscale hover:bg-gray-100' : 'opacity-80 hover:bg-gray-100'}
                  `}
                >
                  <div className={`${isMobile ? 'w-10 h-10' : 'w-14 h-14'}`}>
                    <img src={item.icon.props.src} alt={item.icon.props.alt} className="w-full h-full" />
                  </div>
                  <span className={`${isMobile ? 'text-xs mt-0.5' : 'text-s mt-1'} ${isSelected ? `text-gray-700 ${item.textClass}` : selectedCategories.length >= 2 ? 'text-gray-400' : `text-gray-700 ${item.textClass}`}`}>{item.label}</span>
                </div>
              );
            })}
          </div>
          {categoryError && <p className="text-red-500 text-sm mt-1">{categoryError}</p>}
        </div>
        {/* Where Field */}
        {isLoaded && (
          <div className="relative">
             <Autocomplete
               onLoad={ref => (autocompleteRef.current = ref)}
               onPlaceChanged={handlePlaceChanged}
             >
               <input
                 type="text"
                 placeholder="Where"
                 value={location.address}
                 onChange={handleAddressInputChange}
                 className={`w-full ${isMobile ? 'p-2.5 text-sm' : 'p-2'} rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 border-gray-500 mb-1`}
               />
             </Autocomplete>
             <button
                type="button"
                onClick={handleMyLocation}
                className="absolute -bottom-6 right-0 px-2 py-1 text-xs bg-transparent text-blue-500 underline cursor-pointer flex items-center gap-1"
              >
                <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                My Location
              </button>
           </div>
        )}
        {locationError && <p className="text-red-500 text-sm mb-4">{locationError}</p>}
        {!locationError && <div className="mb-4"></div>}
        {/* When Field */}
        <div className="relative mb-4">
          <DatePicker
            selected={startDate}
            onChange={(update) => {
              const [start, end] = update;
              if (start && end) {
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > 7) {
                  setDateRangeError('Please select a date range of maximum 7 days.');
                  setStartDate(start);
                  setEndDate(null);
                  return;
                } else {
                  setDateRangeError('');
                }
              } else if (startDate || endDate) {
                setDateRangeError('');
              }
              setStartDate(start);
              setEndDate(end);
            }}
            startDate={startDate}
            endDate={endDate}
            selectsRange
            placeholderText={isMobile ? "Date range (max 7 days)" : "Select a date range (max 7 days)"}
            className={`w-full ${isMobile ? 'p-2.5 text-sm' : 'p-3'} rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 border-gray-500 text-sm`}
            dateFormat="MMM d, yyyy"
            isClearable
            showPopperArrow={false}
            maxDate={new Date()}
            wrapperClassName="w-full"
            filterDate={(date) => {
              const today = new Date();
              
              // If no start date is selected, allow all dates up to today
              if (!startDate) {
                return date <= today;
              }
              
              // Allow all past dates without restriction
              if (date < startDate) {
                return date <= today;
              }
              
              // For future dates from start date, apply 7-day limit
              const diffTime = date - startDate;
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays <= 7 && date <= today;
            }}
          />
          {dateRangeError && <p className="text-red-500 text-sm mt-1">{dateRangeError}</p>}
        </div>
        <button
          onClick={handleSearch}
          className={`w-full bg-[#0868a8] text-white ${isMobile ? 'py-2.5 text-sm' : 'py-2'} rounded hover:cursor-pointer transition-colors hover:bg-[#0756a0]`}
        >
          Search
        </button>
      </div>
    </div>
  );
}