import { useEffect, useState, useRef } from 'react';
import { X, SquareActivity, PawPrint, Camera, Bike, MapPin, DollarSign, Check, Star, Video, Trash2 } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { useMap } from '../../../contexts/MapContext';
import toast from 'react-hot-toast';

export default function LocationDrawer({ isOpen, onClose, onSwitchDrawer }) {
  const [uploads, setUploads] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEventType, setSelectedEventType] = useState('Accident');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [isExclusive, setIsExclusive] = useState(false);
  const [address, setAddress] = useState('');
  const [fileError, setFileError] = useState('');
  const [formError, setFormError] = useState('');
  const drawerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [mainMediaIndex, setMainMediaIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState([]);

  const baseUrl = import.meta.env.VITE_API_URL;

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const { triggerRefreshEvents, setSearchLocation, setSetSearchAddressFn, isSidebarExpanded, setShowLoginModal } = useMap();

  // Sidebar widths in px (match layout/sidebar)
  const collapsedSidebarWidthPx = 56;
  const expandedSidebarWidthPx = 256;
  const drawerWidthPx = 500; // w-96

  // Calculate left position based on sidebar state
  const leftPx = isSidebarExpanded ? expandedSidebarWidthPx : collapsedSidebarWidthPx;

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

  // Define the category options with icons for the grid
  const categoryOptions = [
    { label: 'Accident', icon: <img src="/accident.svg" alt="Accident" className="w-14 h-14" />, textClass: 'text-red-600' },
    { label: 'Pet', icon: <img src="/pet.svg" alt="Pet" className="w-14 h-14" />, textClass: '' },
    { label: 'Lost & Found', icon: <img src="/lost.svg" alt="Lost and Found" className="w-14 h-14" />, textClass: '' },
    { label: 'Crime', icon: <img src="/crime.svg" alt="Crime" className="w-14 h-14" />, textClass: 'text-red-600' },
    { label: 'People', icon: <img src="/people.svg" alt="People" className="w-14 h-14" />, textClass: '' },
    { label: 'Other', icon: <img src="/others.svg" alt="Other" className="w-14 h-14" />, textClass: '' },
  ];

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
      setUploads([]);
      setSelectedDate(null);
      setSelectedEventType('Accident');
      setDescription('');
      setPrice('');
      setIsFree(false);
      setIsExclusive(false);
      setFileError('');
      setFormError('');
      setMainMediaIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!uploads || uploads.length === 0) {
      setPreviews([]);
      return;
    }

    const objectUrls = uploads.map(file => ({
        url: URL.createObjectURL(file),
        type: file.type.split('/')[0],
    }));
    setPreviews(objectUrls);

    return () => {
        objectUrls.forEach(p => URL.revokeObjectURL(p.url));
    };
  }, [uploads]);

  const handleFileChange = (e) => {
    setFileError('');
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Check total file count
    if (uploads.length + files.length > 10) { // Check total count including existing
      setFileError('You can upload a maximum of 10 files (images or videos).');
      e.target.value = null; // Clear the input
      return;
    }

    // Validate file types (allow images and videos, reject others)
    const supportedFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (supportedFiles.length !== files.length) {
      setFileError('Some selected files are not supported. Please upload only images or videos.');
      e.target.value = null; // Clear the input
      return;
    }

    setUploads(prevUploads => [...prevUploads, ...supportedFiles]); // Append new files
    e.target.value = null; // Clear the input after processing
  };

  const removeUpload = (index) => {
    const newUploads = [...uploads];
    newUploads.splice(index, 1);
    setUploads(newUploads);

    // Adjust mainMediaIndex if the removed item was before it or was the main item itself
    if (mainMediaIndex === index) {
      setMainMediaIndex(0); // Reset to first item
    } else if (mainMediaIndex > index) {
      setMainMediaIndex(prev => prev - 1); // Shift index if an item before it was removed
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
    let loadingToastId = null;
    try {
      setLoading(true);
      loadingToastId = toast.loading('Creating event...');

      const filesToUploadDetails = uploads.map(file => ({
        fileName: file.name.replace(/\.[^/.]+$/, ''),
        fileType: file.type,
      }));

      const presignedUrlsRes = await axios.post(`${baseUrl}events/presigned-urls`, {
        files: filesToUploadDetails,
      });

      let uploadedMediaData = [];

      if (presignedUrlsRes.data && Array.isArray(presignedUrlsRes.data)) {
        const uploadPromises = presignedUrlsRes.data.map(async (presignedData, index) => {
          const file = uploads[index];
          await axios.put(presignedData.url, file, {
            headers: {
              'Content-Type': file.type,
            },
          });
          return {
            url: presignedData.imageUrl,
            type: presignedData.type === 'images' ? 'image' : 'video',
          };
        });
        uploadedMediaData = await Promise.all(uploadPromises);
      } else {
        throw new Error('Invalid response format from presigned-urls endpoint.');
      }

      const createEventPayload = {
        title: `${selectedEventType} Incident`,
        description,
        category: selectedEventType,
        address,
        media: uploadedMediaData,
        mainMediaIndex: String(mainMediaIndex),
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
        toast.success('Event uploaded successfully!', { id: loadingToastId });
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
        setMainMediaIndex(0);
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
      if (err.response && err.response.status === 401) {
        toast.error('Please login.', { id: loadingToastId });
        setShowLoginModal(true);
      } else {
        toast.error('Something went wrong, try again.', { id: loadingToastId });
      }
    } finally {
      setLoading(false);
    }
  };

  // Reset mainMediaIndex when uploads change or drawer closes
  useEffect(() => {
    if (!isOpen || uploads.length === 0) {
      setMainMediaIndex(0);
    } else if (mainMediaIndex >= uploads.length) {
      setMainMediaIndex(0);
    }
  }, [isOpen, uploads, mainMediaIndex]);

  return (
    <div
      ref={drawerRef}
      className={`fixed top-0 left-0 h-screen z-[100] bg-white shadow-lg transition-all duration-500 ease-in-out ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      style={{
        left: `${leftPx}px`,
        width: `${drawerWidthPx}px`,
        boxShadow: isOpen ? '0 0 24px 0 rgba(0,0,0,0.12)' : 'none',
      }}
    >
      <div className="pt-12 px-6 flex justify-between items-center border-b">
        <h2 className="text-lg font-semibold"></h2>
        <X onClick={onClose} className="text-gray-600 hover:text-black cursor-pointer" />
      </div>
      <div className="overflow-y-auto h-[calc(100vh-4rem)] px-6 pb-6 scrollbar-hide flex flex-col space-y-2">
        <img src="/brandLogo.png" alt="Poing Logo" className="w-25 object-contain mx-auto mb-4" />

        <div className="space-y-4">
          {/* Preview Grid */}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {previews.map((preview, index) => {
                const isMainMedia = mainMediaIndex === index;
                return (
                  <div key={index} className="relative">
                    <div className={`relative group aspect-square bg-gray-100 rounded-md flex items-center justify-center overflow-hidden border-2 ${isMainMedia ? 'border-yellow-400' : 'border-transparent'}`}>
                      {preview.type === 'image' ? (
                        <img src={preview.url} alt="upload preview" className="object-cover w-full h-full" />
                      ) : (
                        <video src={preview.url} className="object-cover w-full h-full" muted playsInline />
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); removeUpload(index); }}
                        className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        title="Remove"
                      >
                        <Trash2 size={24} className="text-white" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={e => { e.preventDefault(); setMainMediaIndex(index); }}
                      className={`absolute -top-2 -right-2 bg-white rounded-full p-1 border ${isMainMedia ? 'border-yellow-400' : 'border-gray-300'} shadow transition-all duration-200 z-20`}
                      title={isMainMedia ? 'Main Media' : 'Set as Main'}
                    >
                      <Star size={18} className={isMainMedia ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'} fill={isMainMedia ? '#facc15' : 'none'} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Dropzones */}
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col items-center justify-center w-full h-24 p-2 transition bg-gray-50 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-gray-400">
              <Camera className="w-8 h-8 text-gray-500" />
              <span className="mt-2 text-sm font-medium text-gray-600">Add Photos</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
            </label>
            <label className="flex flex-col items-center justify-center w-full h-24 p-2 transition bg-gray-50 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-gray-400">
              <Video className="w-8 h-8 text-gray-500" />
              <span className="mt-2 text-sm font-medium text-gray-600">Add Videos</span>
              <input type="file" accept="video/*" multiple className="hidden" onChange={handleFileChange} />
            </label>
          </div>
        </div>

        {fileError && <p className="text-red-500 text-sm mb-4">{fileError}</p>}
        {formError && <p className="text-red-500 text-sm mt-2 mb-4">{formError}</p>}

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

        {/* Category Selection - Now a Grid */}
        <div>
          <label className="block text-gray-800 font-semibold mb-2">Select Category</label>
          <div className="grid grid-cols-3 gap-4">
            {categoryOptions.map((item) => {
              const isSelected = selectedEventType === item.label;
              return (
                <div
                  key={item.label}
                  onClick={() => {
                    setSelectedEventType(item.label.replace(' & ',''));
                  }}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-colors duration-200
                    ${isSelected ? 'opacity-100' : 'opacity-40 grayscale hover:bg-gray-100'}
                  `}
                >
                  {item.icon}
                  <span className={`text-s mt-1 text-gray-700 ${item.textClass}`}>{item.label}</span>
                </div>
              );
            })}
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

        <button onClick={handleSubmit} className="w-1/3 py-2 hover:bg-gray-300 rounded-xl bg-gray-200 text-gray-800 border-dotted border border-gray-500 cursor-pointer flex items-center justify-center space-x-2 mx-auto" disabled={loading}>
          <img src="/brandLogo.png" alt="Map Marker" className="w-20 h-12 text-blue-600" />
          {loading && (
            <svg className="animate-spin h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
