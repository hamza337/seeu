import { useEffect, useState, useRef } from 'react';
import { X, SquareActivity, PawPrint, Camera, Bike, MapPin, DollarSign, Check } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { useMap } from '../../../contexts/MapContext';

export default function LocationDrawer({ isOpen, onClose, onSwitchDrawer }) {
  const [uploads, setUploads] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEventType, setSelectedEventType] = useState('Accident');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [isExclusive, setIsExclusive] = useState(false);
  const [address, setAddress] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [fileError, setFileError] = useState('');
  const [formError, setFormError] = useState('');
  const drawerRef = useRef(null);
  const autocompleteRef = useRef(null);

  const baseUrl = import.meta.env.VITE_API_URL;

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const { triggerRefreshEvents, setSearchLocation, setSetSearchAddressFn, isSidebarExpanded } = useMap();

  // Define collapsed and expanded sidebar widths in pixels
  const collapsedSidebarWidthPx = 12; // Corresponding to w-14
  const expandedSidebarWidthPx = 28; // Corresponding to w-64

  // Calculate dynamic translation for the drawer when open
  const openTranslateX = isSidebarExpanded ? expandedSidebarWidthPx : collapsedSidebarWidthPx;

  const categoryPlaceholders = {
    'Accident': "Hi, I was driving down highway 95 southbound and witnessed your accident by the exit around 9PM . attached is my dash cam footage from that night. P.S- I'm only asking for a small fee to cover the time uploading the content and the equipment that helped in capturing it.",
    'Pet': "Hi. I just found this sweet dog on Tuesday morning at the grand park. the tag is very blurry . come and get it.",
    'Lost & Found': "Hi. I found these glasses on a seat in the stadium last night after the concert. attached are some photos, if it's your reach out with description and you can receive them from me. Sorry for the small charge to cover the time involved",
    'Crime': "Hi, My security camera captured this bike theft in front of the movie theater, I don't know who's bike it is but here is a video of the guy who cut the lock.",
    'People': "Hi, we started chatting last week at the event and made plans to meet but I never took your number, hopefully you recognize us in the photo and reach out.",
    'Other': "Hi, I walked down the street last night and witnessed this fireball falling out of the sky."
  };

  const recommendedPrices = {
    'Accident': 10,
    'Pet': 20,
    'Lost & Found': 30,
    'Crime': 40,
    'People': 50,
    'Other': 60,
  };

  // Set up the search address function in context
  useEffect(() => {
    setSetSearchAddressFn(() => (newAddress, lat, lng) => {
      console.log('LocationDrawer: Setting location from map:', { newAddress, lat, lng });
      setAddress(newAddress);
    });
    return () => setSetSearchAddressFn(null);
  }, [setSetSearchAddressFn]);

  // Clear state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setAddress('');
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      const drawerNode = drawerRef.current;
      const autocompleteNode = autocompleteRef.current?.input;
      const dropdownNode = document.querySelector('.location-dropdown-container');

      // Check if the clicked element is inside the Google Autocomplete suggestions container
      const isClickInsideAutocompleteSuggestions = event.target.closest('.pac-container');
      
      // Check if the clicked element is inside the Google Map container
      const isClickInsideMap = event.target.closest('.gm-style');

      const isClickInsideDrawer = drawerNode && drawerNode.contains(event.target);
      const isClickInsideAutocomplete = autocompleteNode && autocompleteNode.contains(event.target);
      const isClickInsideDropdown = dropdownNode && dropdownNode.contains(event.target);

      // Close drawer only if the click is outside the drawer, autocomplete input, dropdown, autocomplete suggestions, AND the map
      if (!isClickInsideDrawer && !isClickInsideAutocomplete && !isClickInsideDropdown && !isClickInsideAutocompleteSuggestions && !isClickInsideMap) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Separate effect for dropdown click-outside handling
  useEffect(() => {
    function handleDropdownClickOutside(event) {
      const dropdownNode = document.querySelector('.location-dropdown-container');
      const dropdownButton = document.querySelector('.location-dropdown-button');
      
      if (dropdownNode && !dropdownNode.contains(event.target) && 
          dropdownButton && !dropdownButton.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleDropdownClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleDropdownClickOutside);
    };
  }, [isDropdownOpen]);

  const handleDropdownToggle = () => setIsDropdownOpen(!isDropdownOpen);

  const handleFileChange = (e) => {
    setFileError('');
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check total file count
    if (files.length > 10) {
      setFileError('You can upload a maximum of 10 files (images or videos).');
      setUploads([]);
      e.target.value = null; // Clear the input
      return;
    }

    // Validate file types (allow images and videos, reject others)
    const supportedFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (supportedFiles.length !== files.length) {
      setFileError('Some selected files are not supported. Please upload only images or videos.');
      setUploads([]);
      e.target.value = null; // Clear the input
      return;
    }

    // Allow both images and videos, no separate checks for just one type
    setUploads(supportedFiles);
    e.target.value = null; // Clear the input after processing
  };

  const removeUpload = (index) => {
    const newUploads = [...uploads];
    newUploads.splice(index, 1);
    setUploads(newUploads);
    // Re-evaluate file errors after removal if needed, though the main check is on adding.
    if (newUploads.length > 10) {
         setFileError('You can upload a maximum of 10 files (images or videos).');
     } else {
         setFileError('');
     }
  };

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      console.log('LocationDrawer: Place selected:', place);
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        console.log('LocationDrawer: Setting search location:', { lat, lng });
        setSearchLocation({ lat, lng });
        setAddress(place.formatted_address);
      } else if (place.hasOwnProperty('name')) {
        console.log('LocationDrawer: Place has no geometry, using name only');
        setAddress(place.name);
        setSearchLocation(null);
      } else {
        console.log('LocationDrawer: Place has no geometry or name');
        setAddress(autocompleteRef.current.getPlace().name || '');
        setSearchLocation(null);
      }
    } else {
      console.log('LocationDrawer: No autocomplete reference');
      setAddress('');
      setSearchLocation(null);
    }
  };    

  const handleSubmit = async () => {
    setFormError('');
    if (uploads.length === 0) {
      setFormError('Please upload at least one image or video.');
      return;
    }
    if (!address.trim()) {
      setFormError('Please enter the location address.');
      return;
    }
    if (!selectedDate) {
      setFormError('Please select a date for the incident.');
      return;
    }
    if (selectedEventType === 'Select cateogry' || !selectedEventType) {
      setFormError('Please select an event category.');
      return;
    }
    if (!description.trim()) {
      setFormError('Please enter a description for the incident.');
      return;
    }
    if (!isFree && (!price.trim() || isNaN(Number(price)) || Number(price) < 0)) {
      setFormError('Please enter a valid price, or check "Make it Free".');
      return;
    }

    try {
      const filesToUploadDetails = uploads.map(file => ({
        fileName: file.name.replace(/\.[^/.]+$/, ''),
        fileType: file.type,
      }));

      const presignedUrlsRes = await axios.post(`${baseUrl}events/presigned-urls`, {
        files: filesToUploadDetails,
      });

      const uploadedMediaData = [];

      if (presignedUrlsRes.data && Array.isArray(presignedUrlsRes.data)) {
        await Promise.all(
          presignedUrlsRes.data.map(async (presignedData, index) => {
            const file = uploads[index];
            await axios.put(presignedData.url, file, {
              headers: {
                'Content-Type': file.type,
              },
            });
            uploadedMediaData.push({
              url: presignedData.imageUrl,
              type: presignedData.type === 'images' ? 'image' : 'video',
            });
          })
        );
      } else {
        throw new Error('Invalid response format from presigned-urls endpoint.');
      }

      const createEventPayload = {
        title: `${selectedEventType} Incident`,
        description,
        category: selectedEventType,
        address,
        media: uploadedMediaData,
        isExclusive,
        isFree,
        price: isFree ? 0 : Number(price),
        date: selectedDate.toISOString(),
      };

      const createEventRes = await axios.post(`${baseUrl}events/create-event`, createEventPayload, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (createEventRes.status === 201 || createEventRes.status === 200) {
        alert('Event uploaded successfully!');
        onClose();
        setUploads([]);
        setSelectedDate(null);
        setSelectedEventType('Accident');
        setDescription('');
        setPrice('');
        setIsFree(false);
        setIsExclusive(false);
        setAddress('');
        setFileError('');
        setFormError('');
        if (autocompleteRef.current && typeof autocompleteRef.current.setVal === 'function') {
            autocompleteRef.current.setVal('');
        } else {
            const input = document.querySelector('input[placeholder="Where"]');
            if(input) input.value = '';
        }
        triggerRefreshEvents(); // Trigger map refresh
      }
    } catch (err) {
      console.error('Upload process failed:', err);
      setFormError(err.response?.data?.message || err.message || 'Failed to upload event. Please try again.');
    }
  };

  return (
    <div
      ref={drawerRef}
      className={`fixed top-0 left-0 h-full bg-white shadow-lg z-70 transition-transform duration-300 ease-in-out w-1/3 flex flex-col`}
      style={{
        transform: `translateX(${isOpen ? openTranslateX : -100}%)` // Use dynamic translation
      }}
    >
      <div className="px-4 pt-11 pb-0 flex justify-between items-center border-b flex-shrink-0">
        <h2 className="text-lg font-semibold"></h2>
        <X onClick={onClose} className="text-gray-600 hover:text-black cursor-pointer" />
      </div>

      <div className="flex flex-col px-4 pb-4 pt-0 space-y-2 overflow-y-auto custom-scrollbar flex-grow min-h-0 h-0">
        <img src="/brandLogo.png" alt="Poing Logo" className="w-25 object-contain self-center" />

        <label className="block w-full p-4 rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 border-gray-500 text-center cursor-pointer">
          <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileChange} />
          {uploads.length === 0 && 'Drag or upload item here'}
          {uploads.length > 0 && (
            <div className="flex flex-wrap justify-center items-center gap-2 mt-2">
              {uploads.map((file, index) => (
                <div key={index} className="relative flex items-center bg-gray-100 p-2 rounded">
                  <span className="text-sm text-black truncate max-w-xs">{file.name}</span>
                  <button 
                    onClick={(e) => { 
                        e.preventDefault(); // Prevent label click
                        removeUpload(index); 
                        const fileInput = e.target.closest('label').querySelector('input[type="file"]');
                        if(fileInput) fileInput.value = null; // Reset file input
                    }}
                    className="ml-2 text-red-500 hover:text-red-700 font-bold"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </label>
        {fileError && <p className="text-red-500 text-sm">{fileError}</p>}
        {formError && <p className="text-red-500 text-sm mt-2">{formError}</p>}

        <div className="flex gap-2">
        {isLoaded && (
            <Autocomplete 
              onLoad={ref => (autocompleteRef.current = ref)} 
              onPlaceChanged={handlePlaceChanged}
            >
              <input
                type="text"
                placeholder="Where"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="p-2 rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 border-gray-500 w-full"
              />
            </Autocomplete>
          )}
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            className="w-full p-2 rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 border-gray-500"
            placeholderText="When"
            maxDate={new Date()}
          />
        </div>

        <div className="relative">
          <button
            onClick={handleDropdownToggle}
            className="w-3/4 p-3 pl-4 pr-4 rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 border-gray-500 flex justify-between items-center location-dropdown-button"
          >
            <div className="flex items-center gap-2 text-black">
              {[{ label: 'Accident', icon: <img src="/accident.svg" alt="Accident" className="w-5 h-5" /> },
              { label: 'Pet', icon: <img src="/pet.svg" alt="Pet" className="w-5 h-5" /> },
              { label: 'Lost & Found', icon: <img src="/lost.svg" alt="Lost and Found" className="w-5 h-5" /> },
              { label: 'Crime', icon: <img src="/crime.svg" alt="Crime" className="w-5 h-5" /> },
              { label: 'People', icon: <img src="/people.svg" alt="People" className="w-5 h-5" /> },
              { label: 'Other', icon: <img src="/others.svg" alt="Other" className="w-5 h-5" /> },
            ].find(item => item.label.replace(' & ','') === selectedEventType)?.icon}
              <span className="whitespace-nowrap">{selectedEventType === 'Select cateogry' ? 'Select an Event Type' : selectedEventType}</span>
            </div>
            <span className="text-black">{isDropdownOpen ? '▲' : '▼'}</span>
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out location-dropdown-container ${
              isDropdownOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
            } absolute top-full left-0 w-3/4 bg-white border border-black rounded-lg shadow-md mt-1 z-50`}
          >
            <div className="grid grid-cols-3 gap-4 p-4">
              {[{ label: 'Accident', icon: <img src="/accident.svg" alt="Accident" className="w-10 h-10" /> },
                { label: 'Pet', icon: <img src="/pet.svg" alt="Pet" className="w-10 h-10" /> },
                { label: 'Lost & Found', icon: <img src="/lost.svg" alt="Lost and Found" className="w-10 h-10" /> },
                { label: 'Crime', icon: <img src="/crime.svg" alt="Crime" className="w-10 h-10" /> },
                { label: 'People', icon: <img src="/people.svg" alt="People" className="w-10 h-10" /> },
                { label: 'Other', icon: <img src="/others.svg" alt="Other" className="w-10 h-10" /> },
              ].map((item) => (
                <div
                  key={item.label}
                  onClick={() => {
                    setSelectedEventType(item.label.replace(' & ',''));
                    setIsDropdownOpen(false);
                  }}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-colors duration-200 ${
                    selectedEventType === item.label.replace(' & ','') ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  {selectedEventType === item.label.replace(' & ','') && (
                     <Check size={16} className="absolute top-1 right-1 text-blue-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <textarea
          placeholder={selectedEventType && selectedEventType !== 'Select cateogry' ? categoryPlaceholders[selectedEventType] : 'Description'}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 border-gray-500 custom-scrollbar min-h-[120px]"
          rows={4}
        />

        <div className="relative">
          <span className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400">
            <DollarSign size={16} />
          </span>
          <input
            type="number"
            value={isFree ? "0" : price}
            onChange={(e) => setPrice(e.target.value)}
            onWheel={(e) => e.target.blur()}
            placeholder="Price"
            className={`pl-10 w-full p-2 rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 border-gray-500 custom-number-input ${isFree ? 'bg-gray-100' : ''}`}
            disabled={isFree}
          />
        </div>

        {selectedEventType !== 'Select cateogry' && recommendedPrices[selectedEventType] !== undefined && (
          <p className="text-gray-600 text-sm mt-1">
            Recommended price for {selectedEventType} event is {recommendedPrices[selectedEventType]} USD.
          </p>
        )}

        <label className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={isFree} 
            onChange={() => {
              setIsFree(!isFree);
              if (!isFree) {
                setIsExclusive(false);
              }
            }}
            disabled={isExclusive}
            className={`${isExclusive ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          <span className={`text-black ${isExclusive ? 'opacity-50' : ''}`}>Make it Free</span>
        </label>

        <label className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={isExclusive} 
            onChange={() => {
              setIsExclusive(!isExclusive);
              if (!isExclusive) {
                setIsFree(false);
              }
            }}
            disabled={isFree}
            className={`${isFree ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          <span className={`text-black ${isFree ? 'opacity-50' : ''}`}>Make it Exclusive</span>
        </label>

        <button onClick={handleSubmit} className="w-1/3 py-2 hover:bg-gray-300 rounded-xl bg-gray-200 text-gray-800 border-dotted border border-gray-500 cursor-pointer flex items-center justify-center space-x-2 self-center">
          <img src="/brandLogo.png" alt="Map Marker" className="w-20 h-12 text-blue-600" />
        </button>
      </div>
    </div>
  );
}
