import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Camera, Lock, SquareActivity, PawPrint, Bike, Users, MapPin, Glasses, X, ChevronLeft, ChevronRight } from 'lucide-react';
import BackButton from '../../components/backBtn/backButton'
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
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const baseUrl = import.meta.env.VITE_API_URL;

  const categoryIcons = {
    'Accident': <img src="/accident.svg" alt="Accident" className="w-5 h-5" />,
    'Pet': <img src="/pet.svg" alt="Pet" className="w-5 h-5" />,
    'Lost & Found': <img src="/lostnfound.svg" alt="Lost and Found" className="w-5 h-5" />,
    'Crime': <img src="/crime.svg" alt="Crime" className="w-5 h-5" />,
    'People': <img src="/people.svg" alt="People" className="w-5 h-5" />,
    'Other': <img src="/other.svg" alt="Other" className="w-5 h-5" />
  };

  useEffect(() => {
    const fetchMyEvents = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view your purchased events.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${baseUrl}stripe/me/my-purchases`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        console.log('Purchased Events API Response:', response.data);
        // Keep both event and purchasedAt information
        const purchasedEvents = response.data.map(item => ({
          ...item.event,
          purchasedAt: item.purchasedAt
        }));
        console.log('Processed Events:', purchasedEvents);
        setEvents(purchasedEvents);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching my events:', err);
        setError(err.response?.data?.message || 'Failed to fetch purchased events.');
        setLoading(false);
      }
    };

    fetchMyEvents();
  }, [baseUrl]);

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

  if (loading) {
    return <div className="text-black p-16">Loading purchased events...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-16">Error: {error}</div>;
  }

  if (events.length === 0) {
    return <div className="text-gray-600 p-16">You have not purchased any events yet.</div>;
  }

  return (
    <div className='py-4 px-16 text-black'>
      <BackButton heading='My Events' />
      <div className='space-y-6 mt-6'>
        {events.map((event) => (
          <div key={event.id} className='border rounded-lg p-4 shadow-sm'>
            <div className='flex items-start space-x-4'>
              {/* Media Display - Hiding direct download options */}
              <div 
                className="w-32 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 relative group cursor-pointer"
                onClick={() => {
                  console.log('Opening gallery for event:', event.id);
                  console.log('Event media:', event.media);
                  setSelectedEvent(event);
                }}
                onContextMenu={preventDownload}
                onDragStart={preventDownload}
              >
                {event.media && event.media[0] ? (
                  event.media[0].type === 'video' ? (
                    <video
                      src={event.media[0].url}
                      className="w-full h-full object-cover"
                      controls={false}
                      playsInline
                      muted
                      loop
                      onContextMenu={preventDownload}
                      onDragStart={preventDownload}
                    />
                  ) : (
                    <img
                      src={event.media[0].url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onContextMenu={preventDownload}
                      onDragStart={preventDownload}
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300">
                    <Camera size={24} className="text-gray-500" />
                  </div>
                )}
                {/* Overlay to block right-click and selection */}
                <div 
                  className="absolute inset-0 bg-transparent"
                  onContextMenu={preventDownload}
                  onDragStart={preventDownload}
                />
                {event.media && event.media.length > 1 && (
                  <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    +{event.media.length - 1}
                  </div>
                )}
              </div>

              {/* Event Details */}
              <div className='flex-1'>
                <div className='flex items-center gap-2 mb-1'>
                  {categoryIcons[event.category] || <SquareActivity className="w-5 h-5 text-gray-600" />}
                  <h2 className='text-lg font-semibold'>{event.title}</h2>
                </div>
                <p className='text-sm text-gray-600 mb-2'>{event.address}</p>
                <p className='text-gray-700 mb-2 text-sm leading-relaxed'>{event.description}</p>
                <div className='flex items-center gap-2'>
                  {!event.isFree && (
                    <span className='text-sm font-medium text-green-600'>${event.price}</span>
                  )}
                  {event.isExclusive && (
                    <span className='flex items-center gap-1 text-sm text-purple-600'>
                      <Lock size={14} />
                      Exclusive
                    </span>
                  )}
                </div>
                <p className='text-xs text-gray-500 mt-2'>Date: {formatDate(event.date)}</p>
                <p className='text-xs text-gray-500'>Purchased At: {formatDateTime(event.purchasedAt)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Gallery */}
      {selectedEvent && selectedEvent.media && selectedEvent.media.length > 0 && (
        <MediaGallery
          media={selectedEvent.media}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};

export default MyEvents;