import { useEffect, useState, useRef } from 'react';
import { X, SquareActivity, PawPrint, Camera, Bike, MapPin, DollarSign } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';

export default function LocationDrawer({ isOpen, onClose, onSwitchDrawer }) {
  const [uploads, setUploads] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEventType, setSelectedEventType] = useState('Select cateogry');
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

  useEffect(() => {
    function handleClickOutside(event) {
      const drawerNode = drawerRef.current;
      const autocompleteSuggestions = autocompleteRef.current
  
      const isClickInsideDrawer = drawerNode && drawerNode.contains(event.target);
      const isClickInsideAutocomplete = autocompleteSuggestions && autocompleteSuggestions.contains(event.target);
  
      if (!isClickInsideDrawer && !isClickInsideAutocomplete) {
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
  

  const handleDropdownToggle = () => setIsDropdownOpen(!isDropdownOpen);

  const handleFileChange = (e) => {
    setFileError('');
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const containsVideo = files.some(file => file.type.startsWith('video/'));
    const containsImage = files.some(file => file.type.startsWith('image/'));

    if (containsVideo && containsImage) {
      setFileError('You can upload either videos or images, not both.');
      setUploads([]);
      e.target.value = null;
      return;
    }

    if (containsVideo) {
      if (files.length > 1) {
        setFileError('You can only upload one video at a time.');
        setUploads([]);
        e.target.value = null;
        return;
      }
      if (!files[0].type.startsWith('video/')) {
        setFileError('Invalid file type. Please select a video.');
        setUploads([]);
        e.target.value = null;
        return;
      }
      setUploads(files);
    } else if (containsImage) {
      if (files.length > 10) {
        setFileError('You can upload a maximum of 10 images.');
        setUploads([]);
        e.target.value = null;
        return;
      }
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      if (imageFiles.length !== files.length) {
          setFileError('All selected files must be images.');
          setUploads([]);
          e.target.value = null;
          return;
      }
      setUploads(imageFiles);
    } else {
      setFileError('Please upload supported file types (images or videos).');
      setUploads([]);
      e.target.value = null;
    }
  };

  const removeUpload = (index) => {
    const newUploads = [...uploads];
    newUploads.splice(index, 1);
    setUploads(newUploads);
  };

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place && place.formatted_address) {
        setAddress(place.formatted_address);
      }
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

      const createEventRes = await axios.post(`${baseUrl}events/create-event`, createEventPayload);

      if (createEventRes.status === 201 || createEventRes.status === 200) {
        alert('Event uploaded successfully!');
        onClose();
        setUploads([]);
        setSelectedDate(null);
        setSelectedEventType('Select cateogry');
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
      }
    } catch (err) {
      console.error('Upload process failed:', err);
      setFormError(err.response?.data?.message || err.message || 'Failed to upload event. Please try again.');
    }
  };

  return (
    <div
      ref={drawerRef}
      className={`fixed top-0 left-0 h-full bg-white shadow-lg z-70 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-14' : '-translate-x-full'
      } w-2/3`}
    >
      <div className="px-4 pt-4 pb-0 flex justify-between items-center border-b">
        <h2 className="text-lg font-semibold"></h2>
        <X onClick={onClose} className="text-gray-600 hover:text-black cursor-pointer" />
      </div>

      <div className="p-4 space-y-4 overflow-y-auto">
        <img src="/PoingLogo.svg" alt="Poing Logo" className="w-40 justify-self-center object-contain" />

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
            <Autocomplete onLoad={ref => (autocompleteRef.current = ref)} onPlaceChanged={handlePlaceChanged}>
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
            className="w-full p-2 border rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 border-gray-500"
            placeholderText="When"
          />
        </div>

        <div className="relative">
          <button
            onClick={handleDropdownToggle}
            className="w-full p-3 pl-4 pr-4 rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 border-gray-500 flex justify-between items-center"
          >
            <span className="text-black">{selectedEventType || 'Select an Event Type'}</span>
            <span className="text-black">{isDropdownOpen ? '▲' : '▼'}</span>
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isDropdownOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
            } absolute top-full left-0 w-full bg-white border border-black rounded-lg shadow-md mt-1 z-50`}
          >
            {[{ label: 'Accident', icon: <SquareActivity size={16} /> },
              { label: 'People', icon: <PawPrint size={16} /> },
              { label: 'Pet', icon: <Bike size={16} /> },
              { label: 'Crime', icon: <Camera size={16} /> },
              { label: 'Other', icon: <MapPin size={16} color="black" /> },
            ].map((item) => (
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

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 border-gray-500"
          rows={4}
        />

        <div className="relative">
          <span className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400">
            <DollarSign size={16} />
          </span>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onWheel={(e) => e.target.blur()}
            placeholder="Price"
            className={`pl-10 w-full p-2 rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 border-gray-500 custom-number-input ${isFree ? 'bg-gray-100' : ''}`}
            disabled={isFree}
          />
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isFree} onChange={() => setIsFree(!isFree)} />
          <span className='text-black'>Make it Free</span>
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isExclusive} onChange={() => setIsExclusive(!isExclusive)} />
          <span className='text-black'>Make it Exclusive</span>
        </label>

        {/* <button onClick={handleSubmit} className="w-1/3 justify-self-center ml-50 py-2  hover:bg-gray-300 rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 border-gray-500 cursor-pointer">
          Post It
        </button> */}
        <button onClick={handleSubmit} className="w-1/3 justify-self-center py-2 hover:bg-gray-300 rounded-xl bg-gray-200 text-gray-800 border-dotted border border-gray-500 cursor-pointer flex items-center justify-center space-x-2">
          <span>
            <span className="text-blue-600 text-3xl">P</span>
            <span className="text-gray-800 text-3xl">oing It</span>
          </span>
          <img src="/marker.svg" alt="Map Marker" className="w-10 h-10 text-blue-600" />
        </button>
      </div>
    </div>
  );
}
