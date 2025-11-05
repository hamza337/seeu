import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Camera, Video, MapPin, Calendar, DollarSign, Mail, Phone, ChevronDown, Navigation, Globe, Star, Trash2 } from 'lucide-react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import toast from 'react-hot-toast';

const EditEventModal = ({ isOpen, onClose, event, onSave }) => {
  const autocompleteRef = useRef(null);
  
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });
  

  const [formData, setFormData] = useState({
    photos: [],
    videos: [],
    location: '',
    latitude: '',
    longitude: '',
    date: '',
    category: '',
    description: '',
    price: '',
    isFree: false,
    isExclusive: false,
    shareEmail: false,
    sharePhone: false
  });
  const [isContactDropdownOpen, setIsContactDropdownOpen] = useState(false);
  const [locationMode, setLocationMode] = useState('address'); // 'address' or 'coordinates'
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [mediaList, setMediaList] = useState([]);
  const [mainMediaIndex, setMainMediaIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const categories = [
    { id: 'Accident', name: 'Accident', icon: '/accident.svg' },
    { id: 'Pet', name: 'Pet', icon: '/pet.svg' },
    { id: 'LostFound', name: 'Lost & Found', icon: '/lost.svg' },
    { id: 'Crime', name: 'Crime', icon: '/crime.svg' },
    { id: 'People', name: 'People', icon: '/people.svg' },
    { id: 'Other', name: 'Other', icon: '/others.svg' }
  ];

  useEffect(() => {
    if (event && isOpen) {
      // Map category to the correct case-sensitive ID
      let categoryId = 'Accident'; // Default to Accident
      if (event.category) {
        if (event.category.includes('Lost') || event.category.includes('lost')) {
          categoryId = 'LostFound';
        } else if (event.category === 'Accident' || event.category.toLowerCase() === 'accident') {
          categoryId = 'Accident';
        } else if (event.category.toLowerCase() === 'pet') {
          categoryId = 'Pet';
        } else if (event.category.toLowerCase() === 'crime') {
          categoryId = 'Crime';
        } else if (event.category.toLowerCase() === 'people') {
          categoryId = 'People';
        } else if (event.category.toLowerCase() === 'other') {
          categoryId = 'Other';
        } else {
          // For other categories, use as is or find matching category
          const matchingCategory = categories.find(cat => 
            cat.name.toLowerCase() === event.category.toLowerCase() || 
            cat.id.toLowerCase() === event.category.toLowerCase());
          if (matchingCategory) {
            categoryId = matchingCategory.id;
          }
        }
      }
      
      // Determine initial location mode based on available data
      const hasCoordinates = event.latitude && event.longitude;
      const hasAddress = event.address;
      const initialMode = hasCoordinates && !hasAddress ? 'coordinates' : 'address';
      
      // Process media and find main media index
      const media = event.media || [];
      setMediaList(media);
      
      // Find main media index based on previewImage
      let mainIndex = 0;
      if (event.previewImage && media.length > 0) {
        const foundIndex = media.findIndex(item => item.url === event.previewImage);
        if (foundIndex !== -1) {
          mainIndex = foundIndex;
        }
      }
      setMainMediaIndex(mainIndex);
      
      setLocationMode(initialMode);
      setFormData({
        photos: event.photos || [],
        videos: event.videos || [],
        location: event.address || '',
        latitude: event.latitude ? event.latitude.toString() : '',
        longitude: event.longitude ? event.longitude.toString() : '',
        date: event.date ? new Date(event.date) : null,
        category: categoryId,
        description: event.description || '',
        price: event.price || '',
        isFree: event.isFree || false,
        isExclusive: event.isExclusive || false,
        shareEmail: event.shareEmail || false,
        sharePhone: event.sharePhone || false
      });
    }
  }, [event, isOpen]);

  const handleInputChange = (field, value) => {
    if (field === 'coordinates') {
      // Parse comma-separated coordinates
      const coords = value.split(',').map(coord => coord.trim());
      const lat = coords[0] || '';
      const lng = coords[1] || '';
      
      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng
      }));
      
      // Trigger reverse geocoding when both lat and lng are valid
      if (locationMode === 'coordinates' && lat && lng) {
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        
        if (!isNaN(latNum) && !isNaN(lngNum) && latNum !== 0 && lngNum !== 0) {
          performReverseGeocoding(latNum, lngNum);
        }
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };
  
  const performReverseGeocoding = async (lat, lng) => {
    setIsReverseGeocoding(true);
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      
      const data = await response.json();
      
      if (response.ok && data.status === 'OK') {
        let address = '';
        
        // Try to get address from plus_code.compound_code first
        if (data.results && data.results.length > 0) {
          address = data.results[0].formatted_address;
        }
        
        else if (data.plus_code && data.plus_code.compound_code) {
          address = data.plus_code.compound_code;
        }
        // Fallback to formatted_address from first result
        
        if (address) {
          setFormData(prev => ({
            ...prev,
            location: address
          }));

        }
      } else {
        console.error('Reverse geocoding failed:', data.status, data.error_message);
        // Show toast error for invalid coordinates
        if (data.status === 'INVALID_REQUEST' || data.status === 'ZERO_RESULTS') {
          // You can replace this with your toast implementation
          alert('Invalid coordinates. Please enter valid latitude and longitude values.');
        }
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      alert('Failed to fetch address for the provided coordinates.');
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setFormData(prev => ({
          ...prev,
          location: place.formatted_address,
          latitude: lat.toString(),
          longitude: lng.toString()
        }));
      } else if (place.hasOwnProperty('name')) {
        setFormData(prev => ({
          ...prev,
          location: place.name
        }));
      }
    }
  };

  const handleCategorySelect = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      category: categoryId
    }));
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map(file => ({
      type: 'image',
      url: URL.createObjectURL(file),
      file: file // Store the actual file for later upload
    }));
    
    setMediaList(prev => [...prev, ...newPhotos]);
    console.log('Photos uploaded:', files);
    
    // Clear the input to allow selecting the same files again
    e.target.value = '';
  };

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newVideos = files.map(file => ({
      type: 'video',
      url: URL.createObjectURL(file),
      file: file // Store the actual file for later upload
    }));
    
    setMediaList(prev => [...prev, ...newVideos]);
    console.log('Videos uploaded:', files);
    
    // Clear the input to allow selecting the same files again
    e.target.value = '';
  };

  const handleStarClick = (index) => {
    setMainMediaIndex(index);
  };

  const handleDeleteMedia = (index) => {
    const newMediaList = mediaList.filter((_, i) => i !== index);
    setMediaList(newMediaList);
    
    // Adjust mainMediaIndex if necessary
    if (index === mainMediaIndex) {
      // If deleting the main media, set to first item or -1 if no items left
      setMainMediaIndex(newMediaList.length > 0 ? 0 : -1);
    } else if (index < mainMediaIndex) {
      // If deleting an item before the main media, adjust the index
      setMainMediaIndex(mainMediaIndex - 1);
    }
    // If deleting an item after the main media, no adjustment needed
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const baseUrl = import.meta.env.VITE_API_URL;
      
      // Check if we have new media files that need to be uploaded
      const newMediaFiles = mediaList.filter(media => media.file);
      let uploadedMediaData = [];
      
      // If we have new files, upload them using presigned URLs
      if (newMediaFiles.length > 0) {
        const filesToUploadDetails = newMediaFiles.map(media => ({
          fileName: media.file.name.replace(/\.[^/.]+$/, ''),
          fileType: media.file.type,
        }));

        const presignedUrlsRes = await fetch(`${baseUrl}events/presigned-urls`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ files: filesToUploadDetails })
        });

        if (!presignedUrlsRes.ok) {
          throw new Error('Failed to get presigned URLs');
        }

        const presignedUrlsData = await presignedUrlsRes.json();

        if (presignedUrlsData && Array.isArray(presignedUrlsData)) {
          const uploadPromises = presignedUrlsData.map(async (presignedData, index) => {
            const file = newMediaFiles[index].file;
            const uploadResponse = await fetch(presignedData.url, {
              method: 'PUT',
              headers: {
                'Content-Type': file.type,
              },
              body: file
            });
            
            if (!uploadResponse.ok) {
              throw new Error(`Failed to upload file: ${file.name}`);
            }
            
            return {
              url: presignedData.imageUrl,
              type: presignedData.type === 'images' ? 'image' : 'video',
            };
          });
          uploadedMediaData = await Promise.all(uploadPromises);
        } else {
          throw new Error('Invalid response format from presigned-urls endpoint.');
        }
      }
      
      // Combine existing media (without file property) and newly uploaded media
      const existingMedia = mediaList.filter(media => !media.file).map(media => ({
        type: media.type,
        url: media.url
      }));
      
      const mediaData = [...existingMedia, ...uploadedMediaData];
      
      // Check if media has actually changed by comparing with original event media
      const hasMediaChanged = !event.media || 
        mediaData.length !== event.media.length ||
        mediaData.some((item, index) => {
          const origItem = event.media[index];
          return !origItem || item.type !== origItem.type || item.url !== origItem.url;
        });
      
      // Check if mainMediaIndex has changed
      const hasMainMediaIndexChanged = mainMediaIndex !== event.mainMediaIndex;
      
      // Prepare data with only the changed fields
      const eventData = {
        // Include only fields that have changed or are required
        ...(formData.title !== event.title && { title: formData.title }),
        ...(formData.description !== event.description && { description: formData.description }),
        ...(formData.category !== event.category && { category: formData.category }),
        ...(formData.isFree !== event.isFree && { isFree: formData.isFree, price: '0' }),
        ...(formData.isExclusive !== event.isExclusive && { isExclusive: formData.isExclusive }),
        ...(!formData.isFree && formData.price !== event.price && { price: formData.price }),
        ...(formData.shareEmail !== event.shareEmail && { shareEmail: formData.shareEmail }),
        ...(formData.sharePhone !== event.sharePhone && { sharePhone: formData.sharePhone }),
        
        // Date needs special handling since it's a Date object
        ...(formData.date && formData.date.toISOString() !== event.date && { 
          date: formData.date.toISOString() 
        }),
        
        // Handle location based on mode - only if changed
        ...(locationMode === 'coordinates' && (
          parseFloat(formData.latitude) !== event.latitude || 
          parseFloat(formData.longitude) !== event.longitude
        ) && {
          latitude: parseFloat(formData.latitude) || null,
          longitude: parseFloat(formData.longitude) || null
        }),
        ...(locationMode === 'address' && formData.location !== event.address && {
          address: formData.location,
          // Include lat/lng if available, even in address mode
          ...(formData.latitude && formData.longitude && {
            latitude: parseFloat(formData.latitude) || null,
            longitude: parseFloat(formData.longitude) || null
          })
        }),
        
        // Include media only if it has truly changed
        ...(hasMediaChanged && { media: mediaData }),
        
        // Include mainMediaIndex only if it has changed
        ...(hasMainMediaIndexChanged && { mainMediaIndex })
      };
      
      // Get the auth token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Log the payload for debugging
      console.log('Event data being sent:', eventData);
      console.log('Original media:', event.media);
      console.log('New media data:', mediaData);
      console.log('Has media changed?', hasMediaChanged);
      console.log('Has mainMediaIndex changed?', hasMainMediaIndexChanged);
      console.log('Is Free?', formData.isFree, 'Price:', formData.price);
      console.log('Location mode:', locationMode, 'Address:', formData.location, 'Lat:', formData.latitude, 'Lng:', formData.longitude);
      
      // Make the API call
      const response = await fetch(`${baseUrl}events/event/${event.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update event');
      }
      
      const updatedEvent = await response.json();
      console.log('Event updated successfully:', updatedEvent);
      
      toast.success('Event updated successfully!');
      
      // Call the onSave callback with the updated event
      onSave(updatedEvent);
      onClose();
    } catch (error) {
      console.error('Error updating event:', error);
      if (error.message.includes('401') || error.message.includes('Authentication')) {
        toast.error('Please login again.');
      } else {
        toast.error(error.message || 'Failed to update event. Please try again.');
      }
      setError(error.message || 'An error occurred while updating the event');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

 const modalContent = (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center p-4 z-50" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-auto relative max-h-[90vh] overflow-y-auto" style={{ borderRadius: '10px', border: '1px solid #8080804a' }}>
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10"
        >
          <X size={24} />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Event</h2>

          {/* Media Section */}
          <div className="mb-6">
            {mediaList.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Media</h3>
                <div className="grid grid-cols-5 gap-2 mb-4">
                   {mediaList.map((media, index) => (
                     <div key={index} className="relative border-2 border-gray-300 rounded-lg overflow-hidden w-20 h-20 group">
                       {/* Delete button - appears on hover */}
                       <button
                         onClick={() => handleDeleteMedia(index)}
                         className="absolute top-0.5 left-0.5 z-10 p-0.5 rounded-full bg-red-500 bg-opacity-80 hover:bg-opacity-100 transition-all opacity-0 group-hover:opacity-100"
                       >
                         <Trash2
                           size={12}
                           className="text-white"
                         />
                       </button>
                       
                       {/* Star indicator */}
                       <button
                         onClick={() => handleStarClick(index)}
                         className="absolute top-0.5 right-0.5 z-10 p-0.5 rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 transition-all"
                       >
                         <Star
                            size={16}
                            className={`${
                              index === mainMediaIndex
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-400'
                            }`}
                          />
                       </button>
                       
                       {/* Media content */}
                       {media.type === 'image' ? (
                         <img
                           src={media.url}
                           alt={`Media ${index + 1}`}
                           className="w-full h-full object-cover"
                         />
                       ) : (
                         <video
                           src={media.url}
                           className="w-full h-full object-cover"
                           muted
                         />
                       )}
                     </div>
                   ))}
                </div>
                
                {/* Add more media buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <Camera size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600 font-medium text-sm">Add More Photos</p>
                    </label>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                      id="video-upload"
                    />
                    <label htmlFor="video-upload" className="cursor-pointer">
                      <Video size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600 font-medium text-sm">Add More Videos</p>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Media</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Add Photos */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <Camera size={48} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600 font-medium">Add Photos</p>
                    </label>
                  </div>

                  {/* Add Videos */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      multiple
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                      id="video-upload"
                    />
                    <label htmlFor="video-upload" className="cursor-pointer">
                      <Video size={48} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600 font-medium">Add Videos</p>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Location Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Location</h3>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setLocationMode('address')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    locationMode === 'address'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <MapPin size={16} className="mr-2" />
                  Address
                </button>
                <button
                  type="button"
                  onClick={() => setLocationMode('coordinates')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    locationMode === 'coordinates'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Navigation size={16} className="mr-2" />
                  Coordinates
                </button>
              </div>
            </div>
            
            {locationMode === 'address' ? (
              <div className="relative">
                <Globe className="absolute left-3 top-3 text-gray-400" size={20} />
                {isLoaded ? (
                  <Autocomplete
                    onLoad={ref => (autocompleteRef.current = ref)}
                    onPlaceChanged={handlePlaceChanged}
                    options={{
                      types: ['geocode', 'establishment'],
                      componentRestrictions: { country: [] },
                      fields: ['formatted_address', 'geometry', 'name', 'place_id']
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Enter address or search location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full text-black pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      style={{ position: 'relative', zIndex: 1 }}
                    />
                  </Autocomplete>
                ) : (
                  <input
                    type="text"
                    placeholder="Loading Google Maps..."
                    disabled
                    className="w-full text-black pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-100"
                  />
                )}
                <div className="text-xs text-gray-500 mt-1 ml-1">
                  {isLoaded ? 'Search and select from Google Places suggestions' : 'Loading Google Maps API...'}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Navigation className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="LATITUDE,LONGITUDE"
                    value={formData.latitude && formData.longitude ? `${formData.latitude},${formData.longitude}` : ''}
                    onChange={(e) => handleInputChange('coordinates', e.target.value)}
                    className="w-full text-black pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1 ml-1">
                  Enter coordinates as: latitude,longitude (e.g., 31.4660561,74.4481662)
                </div>
                
                {/* Show reverse geocoded address */}
                {locationMode === 'coordinates' && formData.location && (
                  <div className="mt-3">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                      <div className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 text-sm">
                        {isReverseGeocoding ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                            Fetching address...
                          </div>
                        ) : (
                          formData.location
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 ml-1">
                      {isReverseGeocoding ? 'Getting address from coordinates...' : 'Address from coordinates (auto-filled)'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date */}
          <div className="mb-6">
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-gray-400 z-10" size={20} />
              <DatePicker
                selected={formData.date}
                onChange={(date) => handleInputChange('date', date)}
                dateFormat="MMMM d, yyyy"
                placeholderText="Select date"
                maxDate={new Date()}
                className="w-full text-black pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                wrapperClassName="w-full"
              />
            </div>
          </div>

          {/* Category Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Category</h3>
            <div className="grid grid-cols-3 gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className="transition-all flex flex-col items-center hover:bg-gray-50"
                >
                  <img 
                    src={category.icon} 
                    alt={category.name}
                    className={`w-16 h-16 mb-3 ${
                      formData.category === category.id ? 'opacity-100' : 'opacity-30'
                    }`}
                  />
                  <p className={`text-sm font-medium ${
                    formData.category === category.id 
                      ? (category.id === 'accident' || category.id === 'crime' ? 'text-red-600' : 'text-black')
                      : 'text-gray-400'
                  }`}>{category.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <textarea
              placeholder="Event description..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full p-4 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={1000}
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {formData.description.length}/1000 characters
            </div>
          </div>

          {/* Price Section */}
          <div className="mb-6">
            <div className="relative mb-4">
              <DollarSign className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="number"
                placeholder="Price"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                disabled={formData.isFree}
                className={`w-full pl-10 pr-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formData.isFree ? 'bg-gray-100 text-gray-500' : ''
                }`}
              />
            </div>
            
            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFree}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleInputChange('isFree', true);
                      handleInputChange('isExclusive', false);
                      handleInputChange('price', '0');
                    } else {
                      handleInputChange('isFree', false);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">Make it Free</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isExclusive}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleInputChange('isExclusive', true);
                      handleInputChange('isFree', false);
                    } else {
                      handleInputChange('isExclusive', false);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">Make it Exclusive</span>
              </label>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Share Contact Information</h3>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsContactDropdownOpen(!isContactDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-left text-gray-600 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <span className="flex items-center space-x-2">
                  {formData.shareEmail && formData.sharePhone && (
                    <>
                      <Mail size={16} className="text-gray-500" />
                      <Phone size={16} className="text-gray-500" />
                      <span>Email & Phone</span>
                    </>
                  )}
                  {formData.shareEmail && !formData.sharePhone && (
                    <>
                      <Mail size={16} className="text-gray-500" />
                      <span>Email only</span>
                    </>
                  )}
                  {!formData.shareEmail && formData.sharePhone && (
                    <>
                      <Phone size={16} className="text-gray-500" />
                      <span>Phone only</span>
                    </>
                  )}
                  {!formData.shareEmail && !formData.sharePhone && (
                    <span>Select contact options</span>
                  )}
                </span>
                <ChevronDown 
                  size={20} 
                  className={`transform transition-transform ${
                    isContactDropdownOpen ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              
              {isContactDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                  <div className="p-4 space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.shareEmail}
                        onChange={(e) => handleInputChange('shareEmail', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Mail size={20} className="text-gray-500" />
                      <span className="text-gray-700">Share Email Address</span>
                    </label>
                    
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.sharePhone}
                        onChange={(e) => handleInputChange('sharePhone', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <Phone size={20} className="text-gray-500" />
                      <span className="text-gray-700">Share Phone Number</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={`px-6 py-2 bg-[#0a9bf7] text-white rounded-lg transition-colors flex items-center justify-center ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#0a9bf7]'}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default EditEventModal;