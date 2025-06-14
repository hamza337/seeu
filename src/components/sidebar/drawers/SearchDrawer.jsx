import { X, SquareActivity, PawPrint, Bike, Camera, Users, MapPin, Glasses, Lock, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import axios from 'axios';
import { debounce } from 'lodash';
import { useMap } from '../../../contexts/MapContext';

const ResultsDrawer = ({ results, onClose, onEventClick, notifyMeParams, onNotifyMeClick, isSidebarExpanded, collapsedSidebarWidthPx, expandedSidebarWidthPx, leftPx, drawerWidthPx }) => {

  const categoryIcons = {
    'Accident': <img src="/accident.svg" alt="Accident" className="w-5 h-5" />,
    'Pet': <img src="/pet.svg" alt="Pet" className="w-5 h-5" />,
    'Lost & Found': <img src="/lostnfound.svg" alt="Lost and Found" className="w-5 h-5" />,
    'Crime': <img src="/crime.svg" alt="Crime" className="w-5 h-5" />,
    'People': <img src="/people.svg" alt="People" className="w-5 h-5" />,
    'Other': <img src="/other.svg" alt="Other" className="w-5 h-5" />
  };

  const frontendCategories = ['within 1 mile', 'within 3 miles', 'within 5 miles', 'within 6-200 miles'];
  const [categorizedResults, setCategorizedResults] = useState(() => 
    frontendCategories.reduce((acc, category) => ({ ...acc, [category]: [] }), {})
  );

  useEffect(() => {
    const newCategorizedResults = frontendCategories.reduce((acc, category) => ({ ...acc, [category]: [] }), {});

    if (results && typeof results === 'object' && !results.message) {
      // Iterate through all distance groups from the API response
      Object.values(results).forEach(eventList => {
        if (Array.isArray(eventList)) {
          eventList.forEach(event => {
            const distance = event.distanceMiles;
            if (typeof distance === 'number') {
              if (distance <= 1) {
                newCategorizedResults['within 1 mile'].push(event);
              } else if (distance <= 3) {
                newCategorizedResults['within 3 miles'].push(event);
              } else if (distance <= 5) {
                newCategorizedResults['within 5 miles'].push(event);
              } else { // Distance > 5 miles (including anything above 200 miles based on your requirement)
                newCategorizedResults['within 6-200 miles'].push(event);
              }
            }
          });
        }
      });
    }
    
    setCategorizedResults(newCategorizedResults);
  }, [results]);

  const { showLoginModal } = useMap();

  const resultsGapPx = 4;
  const resultsWidthPx = 480;

  return (
    <div className={`fixed top-0 h-[80vh] bg-white shadow-lg z-[110] mt-[10vh] rounded-xl overflow-hidden transition-opacity duration-300`}
      style={{
        left: `${leftPx + drawerWidthPx + resultsGapPx}px`,
        width: `${resultsWidthPx}px`,
        borderRadius: '18px',
        boxShadow: '0 4px 32px 0 rgba(0,0,0,0.12)',
      }}
    >
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="text-lg text-black font-semibold">Search Results</h2>
        <X onClick={onClose} className="text-gray-600 hover:text-black cursor-pointer" />
      </div>
      <div className="overflow-y-auto h-[calc(80vh-4rem)] p-4 scrollbar-hide">
        {/* Notify Me Section (always visible when params are available) */}
        {notifyMeParams && ( // Check if notifyMeParams exist
           <div className="text-center text-gray-600 mt-2 mb-6 p-4 bg-gray-100 rounded-lg">
             <p className="text-lg font-semibold mb-2">Can't find what you are looking for?</p>
             <button
               onClick={onNotifyMeClick}
               className="mt-2 w-auto bg-[#0868a8] text-white py-2 px-4 rounded hover:cursor-pointer"
             >
               Notify Me
             </button>
           </div>
        )}

        {/* Display based on search results */}
        {results && results.status === 404 ? (
          <div className="text-center text-gray-600 mt-8">
            <p className="text-lg font-semibold mb-2">No Record found.</p>
            {/* Notify Me button is now handled in the section above */}
          </div>
        ) : results && results.message === "No events found. Search marker saved." ? (
          <div className="text-center text-gray-600 mt-8">
            <p className="text-lg font-semibold mb-2">No events found.</p>
            {results.searchMarker && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
                <p className="font-medium">Saved Search Marker:</p>
                <p className="text-sm">Category: {results.searchMarker.label}</p>
                <p className="text-sm">Lat: {results.searchMarker.lat}, Lng: {results.searchMarker.lng}</p>
              </div>
            )}
          </div>
        ) : ( /* Display search results categories */
          frontendCategories.map(category => (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{category}</h3>
              {categorizedResults[category] && categorizedResults[category].length > 0 ? (
                <div className="space-y-4">
                  {categorizedResults[category].map((event) => (
                    <div 
                      key={event.id} 
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        console.log('Event card clicked:', event.id, event.latitude, event.longitude);
                        onEventClick(event.latitude, event.longitude);
                        onClose();
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
                            <Camera size={24} className="text-gray-500" />
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
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-600 mt-8">
                  <p className="text-lg font-semibold mb-2">No events found.</p>
                  <p>No events found in this category.</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default function SearchDrawer({ isOpen, onClose, onEventClick }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [location, setLocation] = useState({ lat: null, lng: null, address: '' });
  const [searchResults, setSearchResults] = useState(null);
  const [dateRangeError, setDateRangeError] = useState('');
  const [categoryError, setCategoryError] = useState('');
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
    isSidebarExpanded
  } = useMap();

  // Sidebar widths in px (match layout/sidebar)
  const collapsedSidebarWidthPx = 56;
  const expandedSidebarWidthPx = 256;
  const drawerWidthPx = 384; // w-96

  // Calculate left position based on sidebar state
  const leftPx = isSidebarExpanded ? expandedSidebarWidthPx : collapsedSidebarWidthPx;

  useEffect(() => {
    if (!isOpen) {
      console.log('SearchDrawer: Clearing state due to isOpen becoming false.');
      setSelectedCategories([]);
      setNotifyMeParams(null);
      setSearchResults(null);
    }
  }, [isOpen, setSelectedCategories, setNotifyMeParams, setSearchResults]);

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
    { label: 'Accident', icon: <img src="/accident.svg" alt="Accident" className="w-10 h-10" /> },
    { label: 'Pet', icon: <img src="/pet.svg" alt="Pet" className="w-10 h-10" /> },
    { label: 'Lost & Found', icon: <img src="/lost.svg" alt="Lost and Found" className="w-10 h-10" /> },
    { label: 'Crime', icon: <img src="/crime.svg" alt="Crime" className="w-10 h-10" /> },
    { label: 'People', icon: <img src="/people.svg" alt="People" className="w-10 h-10" /> },
    { label: 'Other', icon: <img src="/others.svg" alt="Other" className="w-10 h-10" /> },
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
  };

  useEffect(() => {
    return () => { debouncedPlaceChanged.cancel(); };
  }, [debouncedPlaceChanged]);

  const handlePlaceChanged = () => {
    debouncedPlaceChanged();
  };

  const handleSearch = async () => {
    if (selectedCategories.length === 0 || !location.lat || !location.lng) {
      console.log('Please select at least one category and a location');
      return;
    }

    setDateRangeError('');
    setCategoryError('');
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

      // Always set notifyMeParams after a search
      setNotifyMeParams({
          lng: location.lng,
          categories: selectedCategories,
          lat: location.lat,
      });

      const newCategorizedResults = {};
      const frontendCategories = ['within 1 mile', 'within 3 miles', 'within 5 miles', 'within 6-200 miles'];
      frontendCategories.forEach(category => newCategorizedResults[category] = []);

      if (response.data && typeof response.data === 'object' && !response.data.message) {
        Object.values(response.data).forEach(eventList => {
          if (Array.isArray(eventList)) {
            eventList.forEach(event => {
              const distance = event.distanceMiles;
              if (typeof distance === 'number') {
                if (distance <= 1) {
                  newCategorizedResults['within 1 mile'].push(event);
                } else if (distance <= 3) {
                  newCategorizedResults['within 3 miles'].push(event);
                } else if (distance <= 5) {
                  newCategorizedResults['within 5 miles'].push(event);
                } else { // Distance > 5 miles
                  newCategorizedResults['within 6-200 miles'].push(event);
                }
              }
            });
          }
        });
      }

      setCategorizedSearchResults(newCategorizedResults);

    } catch (error) {
      console.error('Error searching events:', error);
      if (error.response && error.response.status === 404) {
        console.log('Search received 404. Displaying No Record found and Notify Me option.');
        setSearchResults({ status: 404 });
        setNotifyMeParams({
            lng: location.lng,
            categories: selectedCategories,
            lat: location.lat,
        });
        setCategorizedSearchResults(null);
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
                  alert('Notification request successful! We will notify you if events match your criteria.');
                  setNotifyMeParams(null);
                  setSearchResults(null);
              } else {
                   alert('Failed to subscribe for notifications.');
              }
          } catch (error) {
               console.error('Error calling notify-me API:', error);
               alert(error.response?.data?.message || 'Failed to subscribe for notifications.');
          }
      } else {
          console.log('User not authenticated. Opening login modal.');
          setShowLoginModal(true);
      }
  };

  return (
    <div
      ref={drawerRef}
      className={` pt-8 fixed top-0 left-0 h-screen z-[100] bg-white shadow-lg transition-all duration-500 ease-in-out ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      style={{
        left: `${leftPx}px`,
        width: `${drawerWidthPx}px`,
        boxShadow: isOpen ? '0 0 24px 0 rgba(0,0,0,0.12)' : 'none',
      }}
    >
      <div className="p-6 flex justify-between items-center border-b">
        <h2 className="text-lg text-black font-semibold">Search</h2>
        <X onClick={onClose} className="text-gray-600 hover:text-black cursor-pointer" />
      </div>
      <div className="overflow-y-auto h-[calc(100vh-4rem)] p-6 scrollbar-hide">
        {/* Categories Field - now a grid, not a dropdown */}
        <div className="mb-4">
          <label className="block text-gray-800 font-semibold mb-2">Select Categories</label>
          <div className="grid grid-cols-3 gap-4">
            {categoryOptions.map((item) => {
              const isSelected = selectedCategories.includes(item.label);
              const maxSelected = selectedCategories.length >= 2;
              const isDisabled = maxSelected && !isSelected;
              return (
                <div
                  key={item.label}
                  onClick={() => {
                    if (isDisabled) return;
                    setSelectedCategories(prev => {
                      if (isSelected) {
                        setCategoryError('');
                        return prev.filter(cat => cat !== item.label);
                      } else {
                        if (prev.length < 2) {
                          setCategoryError('');
                          return [...prev, item.label];
                        } else {
                          setCategoryError('You can select a maximum of 2 categories.');
                          return prev;
                        }
                      }
                    });
                  }}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-colors duration-200
                    ${isSelected ? 'opacity-100' :
                      isDisabled ? 'opacity-40 grayscale cursor-not-allowed' : 'opacity-80 hover:bg-gray-100'}
                  `}
                >
                  {item.icon}
                  <span className="text-xs mt-1 text-gray-700">{item.label}</span>
                </div>
              );
            })}
          </div>
          {categoryError && <p className="text-red-500 text-sm mt-1">{categoryError}</p>}
        </div>
        {/* Where Field */}
        {isLoaded && (
          <Autocomplete
            onLoad={ref => (autocompleteRef.current = ref)}
            onPlaceChanged={handlePlaceChanged}
          >
            <input
              type="text"
              placeholder="Where"
              value={location.address}
              onChange={handleAddressInputChange}
              className="w-full p-2 rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 border-gray-500 mb-4"
            />
          </Autocomplete>
        )}
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
            placeholderText="Select a date range (max 7 days)"
            className="w-full p-2 rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 border-gray-500"
            dateFormat="MMMM d, yyyy"
            isClearable
            showPopperArrow={false}
            maxDate={new Date()}
          />
          {dateRangeError && <p className="text-red-500 text-sm mt-1">{dateRangeError}</p>}
        </div>
        <button
          onClick={handleSearch}
          className="w-full bg-[#0868a8] text-white py-2 rounded hover:cursor-pointer"
        >
          Search
        </button>
      </div>
      {searchResults && searchResults.status !== 404 && (
        <ResultsDrawer 
          results={searchResults} 
          onClose={onClose}
          onEventClick={onEventClick} 
          notifyMeParams={notifyMeParams}
          onNotifyMeClick={handleNotifyMe}
          isSidebarExpanded={isSidebarExpanded}
          collapsedSidebarWidthPx={collapsedSidebarWidthPx}
          expandedSidebarWidthPx={expandedSidebarWidthPx}
          leftPx={leftPx}
          drawerWidthPx={drawerWidthPx}
        />
      )}
      {searchResults && searchResults.status === 404 && (
        <ResultsDrawer 
          results={searchResults}
          onClose={onClose}
          onEventClick={onEventClick}
          notifyMeParams={notifyMeParams}
          onNotifyMeClick={handleNotifyMe}
          isSidebarExpanded={isSidebarExpanded}
          collapsedSidebarWidthPx={collapsedSidebarWidthPx}
          expandedSidebarWidthPx={expandedSidebarWidthPx}
          leftPx={leftPx}
          drawerWidthPx={drawerWidthPx}
        />
      )}
    </div>
  );
}
