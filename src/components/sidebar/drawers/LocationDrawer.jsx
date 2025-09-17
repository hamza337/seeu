import React,{ useEffect, useState, useRef } from 'react';
import { X, SquareActivity, PawPrint, Camera, Bike, MapPin, DollarSign, Check, Star, Video, Trash2, Info, Mail, Phone, ChevronDown } from 'lucide-react';
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
  const [addressError, setAddressError] = useState('');
  const [dateError, setDateError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [priceError, setPriceError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const drawerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const sharingDropdownRef = useRef(null);
  const [mainMediaIndex, setMainMediaIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [showExclusiveTooltip, setShowExclusiveTooltip] = useState(false);
  const [shareEmail, setShareEmail] = useState(true);
  const [sharePhone, setSharePhone] = useState(false);
  const [showSharingDropdown, setShowSharingDropdown] = useState(false);
  const [sharingError, setSharingError] = useState('');

  const baseUrl = import.meta.env.VITE_API_URL;

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const { triggerRefreshEvents, setSearchLocation, searchLocation, setSetSearchAddressFn, isSidebarExpanded, setShowLoginModal } = useMap();

  // Sidebar widths in px (match layout/sidebar)
  const collapsedSidebarWidthPx = 56;
  const expandedSidebarWidthPx = 256;
  
  // Responsive drawer width and positioning
  const drawerWidthPx = isMobile ? Math.min(window.innerWidth - 80, 380) : 500; // Mobile: leave space for sidebar, Desktop: 500px
  const leftPx = isSidebarExpanded ? expandedSidebarWidthPx : collapsedSidebarWidthPx;
  
  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle click outside to close sharing dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sharingDropdownRef.current && !sharingDropdownRef.current.contains(event.target)) {
        setShowSharingDropdown(false);
      }
    };

    if (showSharingDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSharingDropdown]);

  const categoryPlaceholders = {
    'Accident': "Hi, I was driving down highway 95 southbound and witnessed your accident by the exit around 9PM . attached is my dash cam footage from that night. P.S- I'm only asking for a small fee to cover the time uploading the content and the equipment that helped in capturing it.",
    'Pet': "Hi. I just found this sweet dog on Tuesday morning at the grand park. the tag is very blurry . come and get it.",
    'LostFound': "Hi. I found these glasses on a seat in the stadium last night after the concert. attached are some photos, if it's your reach out with description and you can receive them from me. Sorry for the small charge to cover the time involved",
    'Crime': "Hi, My security camera captured this bike theft in front of the movie theater, I don't know who's bike it is but here is a video of the guy who cut the lock.",
    'People': "Hi, we started chatting last week at the event and made plans to meet but I never took your number, hopefully you recognize us in the photo and reach out.",
    'Other': "Hi, I walked down the street last night and witnessed this fireball falling out of the sky."
  };

  const [recommendedPrice, setRecommendedPrice] = useState(null);
  const [recommendedCategory, setRecommendedCategory] = useState('');
  const [categoryFees, setCategoryFees] = useState([]);
  const [currentCategoryFee, setCurrentCategoryFee] = useState(null);

  // Fetch category fees when drawer opens
  const fetchCategoryFees = async () => {
    try {
      const response = await axios.get(`${baseUrl}admin/category-fees`);
      if (response.data && Array.isArray(response.data)) {
        setCategoryFees(response.data);
        // Set initial category fee for default selected category
        const initialFee = response.data.find(fee => fee.category === selectedEventType);
        setCurrentCategoryFee(initialFee || null);
      }
    } catch (error) {
      console.error('Error fetching category fees:', error);
      setCategoryFees([]);
      setCurrentCategoryFee(null);
    }
  };

  // Fetch recommended price when category changes
  const fetchRecommendedPrice = async (category) => {
    try {
      const response = await axios.get(`${baseUrl}admin/recommended-prices/${category}`);
      if (response.data) {
        setRecommendedPrice(response.data.price);
        setRecommendedCategory(response.data.category);
      }
    } catch (error) {
      console.error('Error fetching recommended price:', error);
      setRecommendedPrice(null);
      setRecommendedCategory('');
    }
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

  // Fetch category fees and recommended price when drawer opens
  useEffect(() => {
    if (isOpen) {
      fetchCategoryFees();
      if (selectedEventType) {
        fetchRecommendedPrice(selectedEventType);
      }
    }
  }, [isOpen]);

  // Clear state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setAddress('');
      setUploads([]);
      setSelectedDate(null);
      setSelectedEventType('Accident');
      setDescription('');
      setPrice('');
      setRecommendedPrice(null);
      setRecommendedCategory('');
      setCategoryFees([]);
      setCurrentCategoryFee(null);
      setIsFree(false);
      setIsExclusive(false);
      setAddress('');
      setFileError('');
      setFormError('');
      setAddressError('');
      setDateError('');
      setDescriptionError('');
      setPriceError('');
      setMainMediaIndex(0);
      setShareEmail(true);
      setSharePhone(false);
      setShowSharingDropdown(false);
      setSharingError('');
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
    
    // Clear file error if files are removed
    if (fileError) setFileError('');

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
        setAddressError(''); // Clear error when valid address is selected
      } else if (place.hasOwnProperty('name')) {
        console.log('LocationDrawer: Place has no geometry, using name only');
        setAddress(place.name);
        setSearchLocation(null);
        setAddressError(''); // Clear error when address is provided
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
                setAddress(results[0].formatted_address);
                setSearchLocation({ lat, lng });
                setAddressError('');
                console.log('LocationDrawer: My location set:', { lat, lng, address: results[0].formatted_address });
              } else {
                setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                setSearchLocation({ lat, lng });
                setAddressError('');
                console.log('LocationDrawer: My location set with coordinates:', { lat, lng });
              }
            }
          );
        },
        (error) => {
          console.error('Error getting location:', error);
          setAddressError('Unable to get your location. Please enter manually.');
        }
      );
    } else {
      setAddressError('Geolocation is not supported by this browser.');
    }
  };

  // Comprehensive form validation function
  const validateForm = () => {
    let isValid = true;
    
    // Clear all previous errors
    setFileError('');
    setAddressError('');
    setDateError('');
    setDescriptionError('');
    setPriceError('');
    setFormError('');
    setSharingError('');

    // Validate file uploads
    if (uploads.length === 0) {
      setFileError('Please upload at least one photo or video.');
      isValid = false;
    }

    // Validate address
    if (!address.trim()) {
      setAddressError('Please enter a location.');
      isValid = false;
    }

    // Validate date
    if (!selectedDate) {
      setDateError('Please select a date.');
      isValid = false;
    } else if (selectedDate > new Date()) {
      setDateError('Date cannot be in the future.');
      isValid = false;
    }

    // Validate description
    if (!description.trim()) {
      setDescriptionError('Please provide a description.');
      isValid = false;
    } else if (description.trim().length < 10) {
      setDescriptionError('Description must be at least 10 characters long.');
      isValid = false;
    } else if (description.trim().length > 1000) {
      setDescriptionError('Description cannot exceed 1000 characters.');
      isValid = false;
    }

    // Validate price (only if not free)
    if (!isFree) {
      if (!price || price.trim() === '') {
        setPriceError('Please enter a price or mark as free.');
        isValid = false;
      } else {
        const priceNum = parseFloat(price);
        if (isNaN(priceNum) || priceNum < 0) {
          setPriceError('Please enter a valid price (0 or greater).');
          isValid = false;
        } else if (priceNum > 10000) {
          setPriceError('Price cannot exceed $10,000.');
          isValid = false;
        }
      }
    }

    // Validate contact sharing
    if (!shareEmail && !sharePhone) {
      setSharingError('Please select at least one contact sharing option.');
      isValid = false;
    }

    return isValid;
  };    

  const handleSubmit = async () => {
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    // Check phone number if user wants to share it
    if (sharePhone) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.phoneNumber) {
        toast.error('Please update your profile with a phone number to share it with buyers.');
        return;
      }
    }

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
        ...(searchLocation && {
          latitude: String(searchLocation.lat),
          longitude: String(searchLocation.lng)
        }),
        media: uploadedMediaData,
        mainMediaIndex: String(mainMediaIndex),
        isExclusive,
        isFree,
        price: isFree ? 0 : Number(price),
        date: selectedDate.toISOString(),
        shareEmail,
        sharePhone,
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
        setShareEmail(true);
        setSharePhone(false);
        setShowSharingDropdown(false);
        setSharingError('');
        if (autocompleteRef.current && typeof autocompleteRef.current.setVal === 'function') {
            autocompleteRef.current.setVal('');
        } else {
            const input = document.querySelector('input[placeholder="Where"]');
            if(input) input.value = '';
        }
        setSearchLocation(null); // Clear the blue location marker
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
      className={`fixed top-0 left-0 h-screen z-[1
      00] bg-white shadow-lg transition-all duration-500 ease-in-out ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      style={{
        left: `${leftPx}px`,
        width: `${drawerWidthPx}px`,
        boxShadow: isOpen ? '0 0 24px 0 rgba(0,0,0,0.12)' : 'none',
      }}
    >
      <div className={`${isMobile ? 'pt-8 px-4' : 'pt-12 px-6'} flex justify-between items-center border-b`}>
        <h2 className="text-lg font-semibold"></h2>
        <X onClick={onClose} className="text-gray-600 hover:text-black cursor-pointer" />
      </div>
      <div className={`overflow-y-auto h-[calc(100vh-4rem)] ${isMobile ? 'px-4 pb-4' : 'px-6 pb-6'} scrollbar-hide flex flex-col space-y-2`}>
        <img src="/brandLogoFinal.png" alt="Poing Logo" className={`${isMobile ? 'w-20 mb-2' : 'w-25 mb-4'} object-contain mx-auto`} />

        <div className={`${isMobile ? 'space-y-3' : 'space-y-4'}`}>
          {/* Preview Grid */}
          {previews.length > 0 && (
            <div className={`grid ${isMobile ? 'grid-cols-3 gap-2' : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4'}`}>
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
          <div className={`grid grid-cols-2 ${isMobile ? 'gap-2' : 'gap-4'}`}>
            <label className={`flex flex-col items-center justify-center w-full ${isMobile ? 'h-20 p-1.5' : 'h-24 p-2'} transition bg-gray-50 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-gray-400`}>
              <Camera className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-gray-500`} />
              <span className={`${isMobile ? 'mt-1 text-xs' : 'mt-2 text-sm'} font-medium text-gray-600`}>Add Photos</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
            </label>
            <label className={`flex flex-col items-center justify-center w-full ${isMobile ? 'h-20 p-1.5' : 'h-24 p-2'} transition bg-gray-50 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-gray-400`}>
              <Video className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-gray-500`} />
              <span className={`${isMobile ? 'mt-1 text-xs' : 'mt-2 text-sm'} font-medium text-gray-600`}>Add Videos</span>
              <input type="file" accept="video/*" multiple className="hidden" onChange={handleFileChange} />
            </label>
          </div>
        </div>

        {fileError && <p className="text-red-500 text-sm mb-4">{fileError}</p>}
        {formError && <p className="text-red-500 text-sm mt-2 mb-4">{formError}</p>}

        <div className="space-y-2">
          <div className="flex gap-2">
            {isLoaded && (
              <div className="flex-1 relative">
                 <Autocomplete 
                   onLoad={ref => (autocompleteRef.current = ref)} 
                   onPlaceChanged={handlePlaceChanged}
                 >
                   <input
                     type="text"
                     placeholder="Where"
                     value={address}
                     onChange={(e) => {
                       setAddress(e.target.value);
                       if (addressError) setAddressError('');
                     }}
                     className={`${isMobile ? 'p-2 text-sm' : 'p-2'} rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 ${addressError ? 'border-red-500' : 'border-gray-500'} w-full`}
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
                 {addressError && <p className="text-red-500 text-xs mt-1">{addressError}</p>}
               </div>
            )}
            <div className="flex-1">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  if (dateError) setDateError('');
                }}
                className={`w-full ${isMobile ? 'p-2 text-sm' : 'p-2'} rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 ${dateError ? 'border-red-500' : 'border-gray-500'}`}
                placeholderText="When"
                maxDate={new Date()}
              />
              {dateError && <p className="text-red-500 text-xs mt-1">{dateError}</p>}
            </div>
          </div>
        </div>

        {/* Category Selection - Now a Grid */}
        <div>
          <label className={`block text-gray-800 font-semibold ${isMobile ? 'mb-1 text-sm' : 'mb-2'}`}>Select Category</label>
          <div className={`grid grid-cols-3 ${isMobile ? 'gap-2' : 'gap-4'}`}>
            {categoryOptions.map((item) => {
              const isSelected = selectedEventType === item.label.replace(' & ','');
              return (
                <div
                  key={item.label}
                  onClick={() => {
                    const newCategory = item.label.replace(' & ','');
                    setSelectedEventType(newCategory);
                    fetchRecommendedPrice(newCategory);
                    // Update current category fee
                    const categoryFee = categoryFees.find(fee => fee.category === newCategory);
                    setCurrentCategoryFee(categoryFee || null);
                  }}
                  className={`relative flex flex-col items-center justify-center ${isMobile ? 'p-1' : 'p-2'} rounded-lg cursor-pointer transition-colors duration-200
                    ${isSelected ? 'opacity-100' : 'opacity-40 grayscale hover:bg-gray-100'}
                  `}
                >
                  <div className={`${isMobile ? 'w-10 h-10' : 'w-14 h-14'}`}>
                    {React.cloneElement(item.icon, { className: `${isMobile ? 'w-10 h-10' : 'w-14 h-14'}` })}
                  </div>
                  <span className={`${isMobile ? 'text-xs' : 'text-s'} mt-1 text-gray-700 ${item.textClass}`}>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <textarea
            placeholder={selectedEventType && selectedEventType !== 'Select cateogry' ? categoryPlaceholders[selectedEventType] : 'Description'}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (descriptionError) setDescriptionError('');
            }}
            className={`w-full ${isMobile ? 'p-2 text-sm' : 'p-2'} rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 ${descriptionError ? 'border-red-500' : 'border-gray-500'} custom-scrollbar ${isMobile ? 'min-h-[120px]' : 'min-h-[140px]'}`}
            rows={isMobile ? 3 : 4}
          />
          {descriptionError && <p className="text-red-500 text-xs mt-1">{descriptionError}</p>}
          <div className="text-right text-xs text-gray-500 mt-1">
            {description.length}/1000 characters
          </div>
        </div>

        <div>
          <div className="relative">
            <span className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400">
              <DollarSign size={16} />
            </span>
            <input
              type="number"
              value={isFree ? "0" : price}
              onChange={(e) => {
                setPrice(e.target.value);
                if (priceError) setPriceError('');
              }}
              onWheel={(e) => e.target.blur()}
              placeholder="Price"
              className={`pl-10 w-full ${isMobile ? 'p-2 text-sm' : 'p-2'} rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 ${priceError ? 'border-red-500' : 'border-gray-500'} custom-number-input ${isFree ? 'bg-gray-100' : ''}`}
              disabled={isFree}
            />
          </div>
          {priceError && <p className="text-red-500 text-xs mt-1">{priceError}</p>}
        </div>

        {recommendedPrice !== null && recommendedCategory && (
          <p className="text-gray-600 text-sm mt-1">
            Recommended price for {recommendedCategory} event is {recommendedPrice} USD.
          </p>
        )}

        {/* Platform Fee Information */}
        {currentCategoryFee && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
            <p className="text-blue-800 text-sm font-medium">
              {isFree 
                ? `Poing charges ${currentCategoryFee.flatFee} USD on free ${currentCategoryFee.category} events.`
                : `Poing charges ${currentCategoryFee.platformFee}% on ${currentCategoryFee.category} events.`
              }
            </p>
          </div>
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
              // Clear price error when toggling free option
              if (priceError) setPriceError('');
            }}
            disabled={isExclusive}
            className={`${isExclusive ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
          <span className={`text-black ${isExclusive ? 'opacity-50' : ''}`}>Make it Free</span>
        </label>

        <label className="flex items-center gap-2 relative">
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
          <div className="relative">
            <Info 
              size={16} 
              className={`text-gray-400 hover:text-gray-600 cursor-help ${isFree ? 'opacity-50' : ''}`}
              onMouseEnter={() => setShowExclusiveTooltip(true)}
              onMouseLeave={() => setShowExclusiveTooltip(false)}
            />
            {showExclusiveTooltip && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 p-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg z-50">
                <div className="relative">
                  By selecting this option you agree to the terms and conditions and surrender the rights of ownership, publishing or selling this media to the new owner. After purchase the media will be erased from your Que. This contract is between you and the buyer.
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>
              </div>
            )}
          </div>
        </label>

        {/* Contact Sharing Preferences */}
        <div className="space-y-2">
          <label className="block text-gray-800 font-semibold text-sm">Share Contact Information</label>
          <div className="relative" ref={sharingDropdownRef}>
            <button
              type="button"
              onClick={() => setShowSharingDropdown(!showSharingDropdown)}
              className={`w-full ${isMobile ? 'p-2 text-sm' : 'p-2'} rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 border-gray-500 flex items-center justify-between hover:bg-gray-300 transition-all duration-200`}
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {shareEmail && <Mail size={16} className="text-gray-600" />}
                  {sharePhone && <Phone size={16} className="text-gray-600" />}
                </div>
                <span className="text-gray-700 text-sm">
                  {!shareEmail && !sharePhone ? 'Select contact options' : 
                   shareEmail && sharePhone ? 'Email & Phone' :
                   shareEmail ? 'Email only' : 'Phone only'}
                </span>
              </div>
              <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 ${showSharingDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showSharingDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border-dotted border-1 border-gray-500 rounded-xl shadow-lg z-50">
                <div className="p-2 space-y-1">
                  <label className="flex items-center gap-3 p-2 rounded transition-colors opacity-75">
                    <input
                      type="checkbox"
                      checked={shareEmail}
                      disabled={true}
                      className="w-4 h-4 text-gray-600 rounded focus:ring-gray-500 cursor-not-allowed"
                    />
                    <Mail size={16} className="text-gray-600" />
                    <span className="text-sm text-gray-700">Share Email Address (Required)</span>
                  </label>
                  <label className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={sharePhone}
                      onChange={(e) => setSharePhone(e.target.checked)}
                      className="w-4 h-4 text-gray-600 rounded focus:ring-gray-500"
                    />
                    <Phone size={16} className="text-gray-600" />
                    <span className="text-sm text-gray-700">Share Phone Number</span>
                  </label>
                </div>
              </div>
            )}
          </div>
          {sharingError && (
            <p className="text-red-500 text-xs mt-1">{sharingError}</p>
          )}
        </div>

        <button onClick={handleSubmit} className={`${isMobile ? 'w-1/2 py-2 text-sm' : 'w-1/3 py-2'} hover:bg-gray-300 rounded-xl bg-gray-200 text-gray-800 border-dotted border border-gray-500 cursor-pointer flex items-center justify-center space-x-2 mx-auto`} disabled={loading}>
          <img src="/brandLogoFinal.png" alt="Map Marker" className="w-24 h-12 text-blue-600" />
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
