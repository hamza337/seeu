import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Camera, Lock, SquareActivity, PawPrint, Bike, Users, MapPin, Glasses, X, ChevronLeft, ChevronRight, Bell, ShoppingBag, Plus, Edit, Trash2, Share2, Twitter, Facebook } from 'lucide-react';
import BackButton from '../../components/backBtn/backButton'
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import EditEventModal from '../../components/modals/EditEventModal';
import { useNavigate } from 'react-router-dom';
import { useMap } from '../../contexts/MapContext';
import { useModal } from '../../contexts/ModalContext';
import { toast } from 'react-hot-toast';
import { useNotification } from '../../contexts/notificationcontext';

// Social Media Sharing Functions
const shareToTwitter = (event) => {
  const text = `Check out this ${event.category} event: ${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}`;
  const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
  const url = `${baseUrl}?eventId=${event.id}&lat=${event.latitude}&lng=${event.longitude}`;
  const hashtags = `SeeU,${event.category.replace(/\s+/g, '')}`;
  
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(hashtags)}`;
  window.open(twitterUrl, '_blank', 'width=600,height=400');
};

const shareToFacebook = (event) => {
  const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;
  const url = `${baseUrl}?eventId=${event.id}&lat=${event.latitude}&lng=${event.longitude}`;
  const quote = `Check out this ${event.category} event: ${event.description.substring(0, 200)}${event.description.length > 200 ? '...' : ''}`;
  
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(quote)}`;
  window.open(facebookUrl, '_blank', 'width=600,height=400');
};



const MediaGallery = ({ media, isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentIndex(0);
      setIsLoading(true);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    // Reset loading state when media changes
    setIsLoading(true);
  }, [currentIndex]);

  if (!isOpen || !media || media.length === 0) return null;

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') handlePrev(e);
    if (e.key === 'ArrowRight') handleNext(e);
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const preventDownload = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const currentMedia = media[currentIndex];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
      onClick={onClose}
      onContextMenu={preventDownload}
      onDragStart={preventDownload}
    >
      <button 
        className="absolute top-4 right-4 text-white hover:text-gray-300"
        onClick={onClose}
      >
        <X size={24} />
      </button>
      
      <button 
        className="absolute left-4 text-white hover:text-gray-300"
        onClick={handlePrev}
      >
        <ChevronLeft size={32} />
      </button>

      <div className="relative max-w-4xl max-h-[80vh] mx-16">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white">Loading...</div>
          </div>
        )}
        
        {currentMedia.type === 'video' ? (
          <video
            src={currentMedia.url}
            className="max-w-full max-h-[80vh] object-contain"
            controls={false}
            playsInline
            muted
            loop
            autoPlay
            onContextMenu={preventDownload}
            onDragStart={preventDownload}
            onLoadedData={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
          />
        ) : (
          <img
            src={currentMedia.url}
            alt="Event media"
            className="max-w-full max-h-[80vh] object-contain"
            onContextMenu={preventDownload}
            onDragStart={preventDownload}
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
          />
        )}
      </div>

      <button 
        className="absolute right-4 text-white hover:text-gray-300"
        onClick={handleNext}
      >
        <ChevronRight size={32} />
      </button>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
        {currentIndex + 1} / {media.length}
      </div>
    </div>
  );
};

const MyEvents = () => {
  const [activeTab, setActiveTab] = useState('claimed');
  const [claimedEvents, setClaimedEvents] = useState([]);
  const [createdEvents, setCreatedEvents] = useState([]);
  const [notificationAlerts, setNotificationAlerts] = useState([]);
  const { newEventNotifications, clearNotifications, NewEventNotificationCard, markNotificationsAsViewed } = useNotification();
  const [previousTab, setPreviousTab] = useState(null);
  const navigate = useNavigate();
  const { focusMapFn, setMapFocusLocation } = useMap();
  const { setModalEventId } = useModal();
  const [loading, setLoading] = useState({ claimed: false, created: false, alerts: false });
  const [error, setError] = useState({ claimed: null, created: null, alerts: null });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    eventId: null
  });
  const [editModal, setEditModal] = useState({
    isOpen: false,
    event: null
  });
  const baseUrl = import.meta.env.VITE_API_URL;

  const categoryIcons = {
    'Accident': <img src="/accidentM.svg" alt="Accident" className="w-5 h-5" />,
    'Pet': <img src="/petM.svg" alt="Pet" className="w-5 h-5" />,
    'Lost & Found': <img src="/lostM.svg" alt="Lost and Found" className="w-5 h-5" />,
    'Crime': <img src="/crimeM.svg" alt="Crime" className="w-5 h-5" />,
    'People': <img src="/peopleM.svg" alt="People" className="w-5 h-5" />,
    'Other': <img src="/othersM.svg" alt="Other" className="w-5 h-5" />
  };

  const handleTabChange = (tab) => {
    // Clear notifications when leaving the alerts tab
    if (previousTab === 'alerts' && tab !== 'alerts' && newEventNotifications.length > 0) {
      markNotificationsAsViewed();
    }
    
    setPreviousTab(activeTab);
    setActiveTab(tab);
  };

  const tabs = [
    { id: 'claimed', label: 'Claimed', icon: <ShoppingBag size={18} /> },
    { id: 'created', label: 'Created', icon: <Plus size={18} /> },
    { id: 'alerts', label: 'Notification Alerts', icon: <Bell size={18} /> }
  ];

  const fetchClaimedEvents = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError(prev => ({ ...prev, claimed: 'Please log in to view your purchased events.' }));
      return;
    }

    setLoading(prev => ({ ...prev, claimed: true }));
    try {
      const response = await axios.get(`${baseUrl}stripe/me/my-purchases`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      // Filter out null values and process the data
      const validEvents = response.data.filter(item => item !== null);
      const processedEvents = validEvents.map(item => ({
        ...item,
        purchasedAt: item?.purchasedAt
      }));
      
      setClaimedEvents(processedEvents);
      setError(prev => ({ ...prev, claimed: null }));
    } catch (err) {
      console.error('Error fetching claimed events:', err);
      setError(prev => ({ ...prev, claimed: err.response?.data?.message || 'Failed to fetch claimed events.' }));
    } finally {
      setLoading(prev => ({ ...prev, claimed: false }));
    }
  };

  const fetchCreatedEvents = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError(prev => ({ ...prev, created: 'Please log in to view your created events.' }));
      return;
    }

    setLoading(prev => ({ ...prev, created: true }));
    try {
      const response = await axios.get(`${baseUrl}stripe/me/my-events`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      setCreatedEvents(response.data);
      setError(prev => ({ ...prev, created: null }));
    } catch (err) {
      console.error('Error fetching created events:', err);
      setError(prev => ({ ...prev, created: err.response?.data?.message || 'Failed to fetch created events.' }));
    } finally {
      setLoading(prev => ({ ...prev, created: false }));
    }
  };

  const fetchNotificationAlerts = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError(prev => ({ ...prev, alerts: 'Please log in to view your notification alerts.' }));
      return;
    }

    setLoading(prev => ({ ...prev, alerts: true }));
    try {
      const response = await axios.get(`${baseUrl}events/my-marker`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      setNotificationAlerts(response.data.markers || []);
      setError(prev => ({ ...prev, alerts: null }));
    } catch (err) {
      console.error('Error fetching notification alerts:', err);
      setError(prev => ({ ...prev, alerts: err.response?.data?.message || 'Failed to fetch notification alerts.' }));
    } finally {
      setLoading(prev => ({ ...prev, alerts: false }));
    }
  };



  const deleteEvent = (eventId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to delete events.');
      return;
    }

    // Open confirmation modal
    setConfirmationModal({ isOpen: true, eventId });
  };

  const handleConfirmDelete = async () => {
    const { eventId } = confirmationModal;
    const token = localStorage.getItem('token');
    
    // Close modal first
    setConfirmationModal({ isOpen: false, eventId: null });
    
    let loadingToastId = null;
    try {
      loadingToastId = toast.loading('Deleting event...');
      
      await axios.delete(`${baseUrl}events/event/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      // Remove the deleted event from the state
      setCreatedEvents(prev => prev.filter(event => event.id !== eventId));
      toast.success('Event deleted successfully!', { id: loadingToastId });
    } catch (err) {
      console.error('Error deleting event:', err);
      toast.error(err.response?.data?.message || 'Failed to delete event.', { id: loadingToastId });
    }
  };

  const handleCancelDelete = () => {
    setConfirmationModal({ isOpen: false, eventId: null });
  };

  const handleEditEvent = (event) => {
    setEditModal({ isOpen: true, event });
  };

  const handleCloseEditModal = () => {
    setEditModal({ isOpen: false, event: null });
  };

  const handleSaveEvent = (updatedEventData) => {
    console.log('Event updated successfully:', updatedEventData);
    toast.success('Event updated successfully!');
    // Refresh the created events list to show the updated data
    fetchCreatedEvents();
  };

  // Handler for viewing event from notifications
  const handleViewEvent = (event) => {
    // Set modal event ID to open the event details
    setModalEventId(event.id);
    
    // Navigate to home page
    navigate('/');
    
    // Focus map on event location with smooth transition
    if (event.latitude && event.longitude && focusMapFn) {
      // Small delay to ensure navigation completes before focusing map
      setTimeout(() => {
        focusMapFn(event.latitude, event.longitude);
      }, 100);
    }
  };

  // Handler for viewing event location on map from notifications
  const handleViewLocation = (event) => {
    // Set map focus location before navigation to prevent interference
    if (event.latitude && event.longitude) {
      setMapFocusLocation({ lat: event.latitude, lng: event.longitude });
    }
    
    // Navigate to home page
    navigate('/');
  };

  useEffect(() => {
    if (activeTab === 'claimed') {
      fetchClaimedEvents();
    } else if (activeTab === 'created') {
      fetchCreatedEvents();
    } else if (activeTab === 'alerts') {
      fetchNotificationAlerts();
    }
  }, [activeTab, baseUrl]);

  // Clear notifications when component unmounts if user was on alerts tab
  useEffect(() => {
    return () => {
      if (activeTab === 'alerts' && newEventNotifications.length > 0) {
        markNotificationsAsViewed();
      }
    };
  }, [activeTab, newEventNotifications.length, markNotificationsAsViewed]);



  const preventDownload = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  // Event Detail Modal Component
  const EventDetailModal = ({ event, type, isOpen, onClose }) => {
    if (!isOpen || !event) return null;
    return (
      <div className="fixed inset-0 bg-transparent flex items-center justify-center z-[200] p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          {/* Modal Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">{event.category}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            {/* Media Gallery Slider - First */}
            {event.media && event.media.length > 0 && (
              <div className='mb-6 relative'>
                <div className='aspect-video bg-gray-100 rounded-lg overflow-hidden relative'>
                  {/* Current Media Display */}
                  {event.media[currentIndex] && (
                    event.media[currentIndex].type === 'video' ? (
                      <video
                        src={event.media[currentIndex].url}
                        className="w-full h-full object-contain bg-black"
                        controls
                        playsInline
                      />
                    ) : (
                      <img
                        src={event.media[currentIndex].url}
                        alt={`Media ${currentIndex + 1}`}
                        className="w-full h-full object-contain bg-white"
                      />
                    )
                  )}
                  
                  {/* Navigation Arrows */}
                  {event.media.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentIndex(prev => prev === 0 ? event.media.length - 1 : prev - 1)}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={() => setCurrentIndex(prev => prev === event.media.length - 1 ? 0 : prev + 1)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full transition-all"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                  
                  {/* Media Counter */}
                  {event.media.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white text-sm px-3 py-1 rounded-full">
                      {currentIndex + 1} / {event.media.length}
                    </div>
                  )}
                </div>
                
                {/* Thumbnail Navigation */}
                {event.media.length > 1 && (
                  <div className='flex gap-2 mt-3 overflow-x-auto pb-2'>
                    {event.media.map((media, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          index === currentIndex ? 'border-blue-500' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {media.type === 'video' ? (
                          <video
                            src={media.url}
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <img
                            src={media.url}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Category and Event Information - Second */}
            <div className='flex items-center gap-3 mb-4'>
              <div className='p-3 bg-gray-50 rounded-lg'>
                {categoryIcons[event.category] || <SquareActivity className="w-6 h-6 text-gray-600" />}
              </div>
              <div>
                <h3 className='text-lg font-semibold text-gray-900'>{event.category}</h3>
                <span className='text-sm text-gray-500'>Listings ID: {event.eventCode}</span>
              </div>
            </div>

            {/* Address */}
            {event.address && (
              <div className='flex items-center gap-2 mb-4'>
                <MapPin size={18} className='text-gray-400' />
                <p className='text-gray-700'>{event.address}</p>
              </div>
            )}

            {/* Event Details */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
              {/* Price and Status */}
              <div>
                <h4 className='font-semibold text-gray-900 mb-2'>Price & Status</h4>
                <div className='space-y-2'>
                  {type === 'claimed' ? (
                    event.price !== undefined && (
                      <span className='inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium'>
                        {event.isFree ? 'Free' : `$${event.price}`}
                      </span>
                    )
                  ) : (
                    <>
                      <span className='inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium mr-2'>
                        {event.isFree ? 'Free' : `$${event.price}`}
                      </span>
                      {event.isExclusive && (
                        <span className='inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mr-2'>
                          <Lock size={12} className='inline mr-1' />
                          Exclusive
                        </span>
                      )}
                      {event.isSold && (
                        <span className='inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium'>
                          Sold
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div>
                <h4 className='font-semibold text-gray-900 mb-2'>Important Dates</h4>
                <div className='space-y-1 text-sm text-gray-600'>
                  <p>Event Date: {formatDate(event.date)}</p>
                  {type === 'claimed' && event.purchasedAt && (
                    <p>Purchased: {formatDateTime(event.purchasedAt)}</p>
                  )}
                  {type === 'created' && event.createdAt && (
                    <p>Posted: {formatDateTime(event.createdAt)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Event Code for created events */}
            {type === 'created' && event.eventCode && (
              <div className='mb-4'>
                <h4 className='font-semibold text-gray-900 mb-2'>Event Code</h4>
                <span className='inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-mono'>
                  #{event.eventCode}
                </span>
              </div>
            )}

            {/* Seller Information for claimed events */}
            {type === 'claimed' && event.seller && (
              <div className='mb-6'>
                <h4 className='font-semibold text-gray-900 mb-2'>Seller Information</h4>
                <div className='bg-gray-50 rounded-lg p-4 space-y-2'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium text-gray-700'>Name:</span>
                    <span className='text-gray-900'>{event.seller.name}</span>
                  </div>
                  {event.seller.shareEmail && (
                    <div className='flex items-center gap-2'>
                      <span className='font-medium text-gray-700'>Email:</span>
                      <span className='text-gray-900'>{event.seller.email}</span>
                    </div>
                  )}
                  {event.seller.sharePhone && (
                    <div className='flex items-center gap-2'>
                      <span className='font-medium text-gray-700'>Contact:</span>
                      <span className='text-gray-900'>{event.seller.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div className='mb-6'>
              <h4 className='font-semibold text-gray-900 mb-2'>Description</h4>
              <p className='text-gray-700 leading-relaxed'>{event.description}</p>
            </div>

            {/* Social Media Share - Only for created events */}
            {type === 'created' && (
              <div className='mb-6'>
                <h4 className='font-semibold text-gray-900 mb-3 flex items-center gap-2'>
                  <Share2 size={18} />
                  Share Event
                </h4>
                <div className='flex gap-3'>
                  <button
                    onClick={() => shareToTwitter(event)}
                    className='flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors'
                  >
                    <Twitter size={16} />
                    Twitter
                  </button>
                  <button
                    onClick={() => shareToFacebook(event)}
                    className='flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition-colors'
                  >
                    <Facebook size={16} />
                    Facebook
                  </button>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };



  const AlertCard = ({ alert }) => {
    const [address, setAddress] = useState('');
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);

    const formatDate = (dateString) => {
      if (!dateString) return 'No date specified';
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const reverseGeocode = async (lat, lng) => {
      if (!lat || !lng) return;
      
      setIsLoadingAddress(true);
      try {
        const geocoder = new window.google.maps.Geocoder();
        const response = await new Promise((resolve, reject) => {
          geocoder.geocode(
            { location: { lat: parseFloat(lat), lng: parseFloat(lng) } },
            (results, status) => {
              if (status === 'OK') {
                resolve(results);
              } else {
                reject(new Error(`Geocoding failed: ${status}`));
              }
            }
          );
        });
        
        if (response && response[0]) {
          setAddress(response[0].formatted_address);
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error);
        setAddress('Address not available');
      } finally {
        setIsLoadingAddress(false);
      }
    };

    useEffect(() => {
      if (alert.latitude && alert.longitude && window.google && window.google.maps) {
        reverseGeocode(alert.latitude, alert.longitude);
      }
    }, [alert.latitude, alert.longitude]);

    const getCategoryIcon = (category) => {
      const iconMap = {
        'Accident': SquareActivity,
        'Pet': PawPrint,
        'Crime': Lock,
        'LostFound': Glasses,
        'People': Users,
        'Other': MapPin
      };
      return iconMap[category] || Bell;
    };

    return (
      <div className='border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white'>
        <div className='flex items-start space-x-4'>
          {/* Alert Icon */}
          <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            {alert.categories && alert.categories.length > 0 ? (
              React.createElement(getCategoryIcon(alert.categories[0]), {
                size: 24,
                className: "text-blue-600"
              })
            ) : (
              <Bell size={24} className="text-blue-600" />
            )}
          </div>

          {/* Alert Details */}
          <div className='flex-1 min-w-0'>
            <div className='flex items-start justify-between mb-2'>
              <h3 className='text-lg font-semibold text-gray-900 truncate'>
                {alert.categories && alert.categories.length > 0 
                  ? `${alert.categories.join(', ')} Alert`
                  : 'Notification Alert'
                }
              </h3>
              <div className='flex items-center space-x-2 ml-4'>
                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                  Active
                </span>
              </div>
            </div>

            <div className='space-y-2 text-sm text-gray-600'>
              {alert.keyword && (
                <div className='flex items-center space-x-2'>
                  <span className='font-medium'>Keyword:</span>
                  <span>{alert.keyword}</span>
                </div>
              )}
              
              <div className='flex items-center space-x-2'>
                 <MapPin size={16} className='text-gray-400' />
                 <div className='flex-1'>
                   {isLoadingAddress ? (
                     <span className='text-gray-500'>Loading address...</span>
                   ) : address ? (
                     <span>{address}</span>
                   ) : (
                     <span>Lat: {alert.latitude?.toFixed(4)}, Lng: {alert.longitude?.toFixed(4)}</span>
                   )}
                 </div>
               </div>
              
              {alert.date && (
                <div className='flex items-center space-x-2'>
                  <span className='font-medium'>Target Date:</span>
                  <span>{formatDate(alert.date)}</span>
                </div>
              )}
              
              <div className='flex items-center space-x-2'>
                <span className='font-medium'>Created:</span>
                <span>{formatDate(alert.createdAt)}</span>
              </div>
              
              <div className='flex items-center space-x-2'>
                <span className='font-medium'>Expires:</span>
                <span>{formatDate(alert.expiresAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const EventCard = ({ event, type = 'claimed' }) => (
    <div className='border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white relative'>
      <div 
        className='cursor-pointer'
        onClick={() => {
           setSelectedEvent(event);
           setCurrentIndex(0);
           setIsModalOpen(true);
         }}
      >
        <div className='flex items-start space-x-4'>
          {/* Media Preview */}
          <div className="w-32 h-32 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 relative group">
            {event.previewImage ? (
              <>
                <img
                  src={event.previewImage}
                  alt={event.title || event.category}
                  className="w-full h-full object-cover"
                />
                {/* Video indicator if it's a video */}
                {event.media && event.media[0] && event.media[0].type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                    <div className="w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[6px] border-l-gray-800 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-1"></div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <Camera size={24} className="text-gray-400" />
              </div>
            )}
            {event.media && event.media.length > 0 && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                {event.media.length}
              </div>
            )}
          </div>

          {/* Event Details */}
          <div className='flex-1'>
            <div className='flex items-center gap-3 mb-2'>
              <div className='p-2 bg-gray-50 rounded-lg'>
                {categoryIcons[event.category] || <SquareActivity className="w-5 h-5 text-gray-600" />}
              </div>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>{event.category}</h2>
              </div>
            </div>
            
            {/* Only show address for claimed events */}
            {type === 'claimed' && event.address && (
              <div className='flex items-center gap-2 mb-3'>
                <MapPin size={16} className='text-gray-400' />
                <p className='text-sm text-gray-600'>{event.address}</p>
              </div>
            )}
            
            <p className='text-gray-700 mb-4 text-sm leading-relaxed line-clamp-2'>{event.description}</p>
            
            {/* Only show price and other details for claimed events */}
            {type === 'claimed' && (
              <div className='flex items-center gap-4 mb-3'>
                {event.price !== undefined && (
                  <span className='text-lg font-semibold text-green-600'>
                    {event.isFree ? 'Free' : `$${event.price}`}
                  </span>
                )}
              </div>
            )}
            
            {/* Only show status badges for created events */}
            {type === 'created' && (
              <div className='flex items-center gap-4 mb-3'>
                {event.isExclusive && (
                  <span className='flex items-center gap-1 text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded-full'>
                    <Lock size={12} />
                    Exclusive
                  </span>
                )}
                {event.isSold && (
                  <span className='text-sm text-red-600 bg-red-50 px-2 py-1 rounded-full font-medium'>
                    Sold
                  </span>
                )}
              </div>
            )}
            
            {/* Only show dates for claimed events */}
            {type === 'claimed' && (
              <div className='space-y-1'>
                <p className='text-xs text-gray-500'>Event Date: {formatDate(event.date)}</p>
                {event.purchasedAt && (
                  <p className='text-xs text-gray-500'>Purchased: {formatDateTime(event.purchasedAt)}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Edit and Delete icons for created events */}
      {type === 'created' && (
        <div className='absolute top-4 right-4 flex gap-2'>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditEvent(event);
            }}
            className='p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full transition-colors'
            title='Edit Event'
          >
            <Edit size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteEvent(event.id);
            }}
            className='p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors'
            title='Delete Event'
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'claimed':
        if (loading.claimed) {
          return (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading claimed events...</p>
              </div>
            </div>
          );
        }
        
        if (error.claimed) {
          return (
            <div className="text-center py-16">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-red-600">{error.claimed}</p>
              </div>
            </div>
          );
        }
        
        if (claimedEvents.length === 0) {
          return (
            <div className="text-center py-16">
              <ShoppingBag size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No claimed events yet</h3>
              <p className="text-gray-600">Events you purchase will appear here.</p>
            </div>
          );
        }
        
        return (
          <div className='space-y-6'>
            {claimedEvents.map((event) => (
              <EventCard key={event.id} event={event} type="claimed" />
            ))}
          </div>
        );
        
      case 'created':
        if (loading.created) {
          return (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading created events...</p>
              </div>
            </div>
          );
        }
        
        if (error.created) {
          return (
            <div className="text-center py-16">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-red-600">{error.created}</p>
              </div>
            </div>
          );
        }
        
        if (createdEvents.length === 0) {
          return (
            <div className="text-center py-16">
              <Plus size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No created events yet</h3>
              <p className="text-gray-600">Events you create will appear here.</p>
            </div>
          );
        }
        
        return (
          <div className='space-y-6'>
            {createdEvents.map((event) => (
              <EventCard key={event.id} event={event} type="created" />
            ))}
          </div>
        );
        
      case 'alerts':
        if (loading.alerts) {
          return (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading notification alerts...</p>
              </div>
            </div>
          );
        }
        
        if (error.alerts) {
          return (
            <div className="text-center py-16">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-red-600">{error.alerts}</p>
              </div>
            </div>
          );
        }
        
        if (notificationAlerts.length === 0 && newEventNotifications.length === 0) {
           return (
             <div className="text-center py-16">
               <Bell size={48} className="text-gray-300 mx-auto mb-4" />
               <h3 className="text-lg font-medium text-gray-900 mb-2">No notification alerts yet</h3>
               <p className="text-gray-600">Your notification alerts and new event matches will appear here.</p>
             </div>
           );
         }
        
        return (
          <div className='space-y-6'>
            {/* New Event Notifications */}
            {newEventNotifications.length > 0 && (
              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  <Bell size={20} className='text-green-600' />
                  New Event Matches
                  <span className='bg-red-500 text-white text-xs px-2 py-1 rounded-full'>
                    {newEventNotifications.length}
                  </span>
                </h3>
                <div className='space-y-4 mb-8'>
                  {newEventNotifications.map((notification, index) => (
                    <NewEventNotificationCard 
                      key={index} 
                      notification={notification} 
                      onViewEvent={handleViewEvent}
                      onViewLocation={handleViewLocation}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Existing Notification Alerts */}
            {notificationAlerts.length > 0 && (
              <div>
                <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
                  <Bell size={20} className='text-blue-600' />
                  Active Notification Alerts
                </h3>
                <div className='space-y-4'>
                  {notificationAlerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className='py-4 px-4 md:px-16 text-black min-h-screen bg-gray-50'>
      <BackButton heading='My Events' />
      
      {/* Tab Navigation */}
      <div className="mt-6 mb-8">
        <div className="border-b border-gray-200 bg-white rounded-t-lg">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center gap-2 transition-all duration-200 rounded-t-lg relative`}
              >
                {tab.icon}
                {tab.label}
                {tab.id === 'alerts' && newEventNotifications.length > 0 && (
                  <div className='absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full'></div>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm min-h-96">
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>

      {/* Event Detail Modal */}
      <EventDetailModal 
        event={selectedEvent}
        type={activeTab === 'claimed' ? 'claimed' : 'created'}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Edit Event Modal */}
      <EditEventModal
        isOpen={editModal.isOpen}
        onClose={handleCloseEditModal}
        event={editModal.event}
        onSave={handleSaveEvent}
      />

    </div>
  );
};

export default MyEvents;