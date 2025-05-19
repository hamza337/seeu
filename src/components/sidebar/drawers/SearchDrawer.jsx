import { X, SquareActivity, PawPrint, Bike, Camera, Users, MapPin, Glasses, Lock } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import axios from 'axios';

const ResultsDrawer = ({ results, onClose, onEventClick }) => {

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

  return (
    <div className="fixed top-0 left-80 h-[80vh] w-1/2 bg-white shadow-lg z-50 mt-[10vh] rounded-lg overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="text-lg text-black font-semibold">Search Results</h2>
        <X onClick={onClose} className="text-gray-600 hover:text-black cursor-pointer" />
      </div>
      <div className="overflow-y-auto h-[calc(80vh-4rem)] p-4 scrollbar-hide">
        {results && results.message === "No events found. Search marker saved." ? (
          <div className="text-center text-gray-600 mt-8">
            <p className="text-lg font-semibold mb-2">No events found.</p>
            <p>Your search criteria have been saved as a search marker.</p>
            {results.searchMarker && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left">
                <p className="font-medium">Saved Search Marker:</p>
                <p className="text-sm">Category: {results.searchMarker.label}</p>
                <p className="text-sm">Lat: {results.searchMarker.lat}, Lng: {results.searchMarker.lng}</p>
              </div>
            )}
          </div>
        ) : (
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

export default function SearchDrawer({ isOpen, onClose, selectedEventType, setSelectedEventType, onEventClick }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [location, setLocation] = useState({ lat: null, lng: null, address: '' });
  const [searchResults, setSearchResults] = useState(null);
  const autocompleteRef = useRef(null);
  const baseUrl = import.meta.env.VITE_API_URL;

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  useEffect(() => {
    if (!isOpen) {
      console.log('SearchDrawer: Clearing state due to isOpen becoming false.');
      setSelectedEventType(null);
      setSelectedDate(null);
      setLocation({ lat: null, lng: null, address: '' });
      setSearchResults(null);
      if (autocompleteRef.current) {
        setLocation(prev => ({ ...prev, address: '' }));
      }
    }
  }, [isOpen, setSelectedEventType, setSelectedDate, setLocation, setSearchResults]);


  const handleDropdownToggle = () => setIsDropdownOpen(!isDropdownOpen);

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        console.log('Selected Location Coordinates:', { lat, lng });
        setLocation({
          lat,
          lng,
          address: place.formatted_address
        });
      }
    }
  };

  const handleSearch = async () => {
    if (!selectedEventType || !location.lat || !location.lng) {
      console.log('Please select an event type and location');
      return;
    }

    try {
      let formattedDate = '';
      if (selectedDate) {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      }

      const response = await axios.get(`${baseUrl}events/search`, {
        params: {
          query: selectedEventType,
          lat: location.lat,
          lng: location.lng,
          date: formattedDate
        }
      });
      console.log('Search Results:', response.data);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching events:', error);
    }
  };

  return (
    <>
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-lg z-60 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-14' : '-translate-x-full'
        } w-64`}
      >
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-lg text-black font-semibold">Search</h2>
          <X onClick={onClose} className="text-gray-600 hover:text-black cursor-pointer" />
        </div>
        <div className="p-4 space-y-12">
          {isLoaded && (
            <Autocomplete
              onLoad={ref => (autocompleteRef.current = ref)}
              onPlaceChanged={handlePlaceChanged}
            >
              <input
                type="text"
                placeholder="Where"
                value={location.address}
                onChange={(e) => setLocation(prev => ({ ...prev, address: e.target.value }))}
                className="w-full p-2 rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 border-gray-500"
              />
            </Autocomplete>
          )}
          <div className="relative">
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              placeholderText="When"
              className="w-full p-2 rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 border-gray-500"
              dateFormat="MMMM d, yyyy"
              isClearable
              showPopperArrow={false}
            />
          </div>
          <div className="relative">
            <button
              onClick={handleDropdownToggle}
              className="w-full p-3 rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 border-gray-500 flex justify-between items-center"
            >
              <span className='text-gray-800'>{selectedEventType || 'Select an Event Type'}</span>
              <span>{isDropdownOpen ? '▲' : '▼'}</span>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isDropdownOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
              } absolute top-full left-0 w-full bg-white border border-black rounded-lg shadow-md mt-1 z-50`}
            >
              {[{ label: 'Accident', icon: <img src="/accident.svg" alt="Accident" className="w-4 h-4" /> },
                { label: 'Pet', icon: <img src="/pet.svg" alt="Pet" className="w-4 h-4" /> },
                { label: 'Lost & Found', icon: <img src="/lost.svg" alt="Lost and Found" className="w-4 h-4" /> },
                { label: 'Crime', icon: <img src="/crime.svg" alt="Crime" className="w-4 h-4" /> },
                { label: 'People', icon: <img src="/people.svg" alt="People" className="w-4 h-4" /> },
                { label: 'Other', icon: <img src="/other.svg" alt="Other" className="w-4 h-4" color="black" /> }].map((item) => (
                <div
                  key={item.label}
                  onClick={() => {
                    setSelectedEventType(item.label);
                    setIsDropdownOpen(false);
                  }}
                  className="py-1 px-3 text-black hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                >
                  <span>{item.label}</span>
                  <span>{item.icon}</span>
                </div>
              ))}
            </div>
          </div>
          <button 
            onClick={handleSearch}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            Search
          </button>
        </div>
      </div>
      {searchResults && (
        <ResultsDrawer 
          results={searchResults} 
          onClose={onClose}
          onEventClick={onEventClick} 
        />
      )}
    </>
  );
}
