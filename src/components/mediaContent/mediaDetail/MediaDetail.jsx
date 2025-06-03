import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Clock, MapPin, DollarSign, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import BackButton from '../../../components/backBtn/backButton';
import moment from 'moment'; // Import moment for date formatting

// Helper function to parse media JSON
const parseMedia = (mediaJson) => {
  try {
    const mediaArray = JSON.parse(mediaJson);
    return Array.isArray(mediaArray) ? mediaArray : [];
  } catch (e) {
    console.error('Failed to parse media JSON:', mediaJson, e);
  }
  return [];
};

// Helper function to format date and time
const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = moment(dateString);
    return date.isValid() ? date.format('YYYY-MM-DD HH:mm') : 'Invalid Date';
};

// Helper function to format date only
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = moment(dateString);
    return date.isValid() ? date.format('YYYY-MM-DD') : 'Invalid Date';
};

const EventDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [event, setEvent] = useState(location.state?.event || null); // Get event from state
  const [loading, setLoading] = useState(!location.state?.event); // Set loading based on whether event is in state
  const [error, setError] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0); // State for current media item in slider
  const baseUrl = import.meta.env.VITE_API_URL;

  // If event is not available in state, fetch it (fallback)
  useEffect(() => {
      if (!event && id) {
          const fetchEvent = async () => {
              setLoading(true);
              setError(null);
              try {
                  const token = localStorage.getItem('token');
                  const response = await axios.get(`${baseUrl}events/event/${id}`, { 
                      headers: {
                          'Authorization': token ? `Bearer ${token}` : ''
                      } 
                  });
                  setEvent(response.data);
                  console.log('Fetched event details (fallback):', response.data);
              } catch (err) {
                  console.error('Error fetching event details (fallback):', err);
                  setError(err.response?.data?.message || 'Failed to fetch event details.');
              } finally {
                  setLoading(false);
              }
          };
          fetchEvent();
      } else if (event) {
          setLoading(false);
      }
  }, [id, baseUrl, event]); // Add event to dependency array


  // Apply media protection
  useEffect(() => {
    // Disable right-click on images and videos within .media-item
    const disableRightClick = (e) => {
      e.preventDefault();
    };

    // Add an overlay div to cover media elements and block interactions
    const addMediaOverlay = () => {}; // Empty function

    // Remove event listeners and overlays
    const removeMediaProtection = () => {
       const mediaElements = document.querySelectorAll('.media-item img, .media-item video');
        mediaElements.forEach(element => {
             element.removeEventListener('contextmenu', disableRightClick);
             if (element.tagName === 'IMG') {
               element.draggable = true;
             }
             if (element.tagName === 'VIDEO') {
                element.controls = true;
                element.removeAttribute('controlsList');
                element.removeAttribute('disablePictureInPicture');
             }
        });
        // Remove overlays - REMOVED overlay removal
    };

    // Apply protection initially and re-apply if event changes
    addMediaOverlay(); // Still call, but it does nothing now
    const mediaElements = document.querySelectorAll('.media-item img, .media-item video');
     mediaElements.forEach(element => {
       element.addEventListener('contextmenu', disableRightClick);
       if (element.tagName === 'IMG') {
         element.draggable = false;
       }
       if (element.tagName === 'VIDEO') {
          element.controls = true;
          element.setAttribute('controlsList', 'nodownload');
          element.setAttribute('disablePictureInPicture', true);
       }
     });

    return () => {
      removeMediaProtection();
    };

  }, [event, currentMediaIndex]); // Re-apply protection when event or current media changes


  const handleBuyNow = async () => {
      if (!event?.id) return;

      const token = localStorage.getItem('token');

      if (!token) {
          console.log('User not authenticated. Cannot proceed with purchase.');
           alert('Please login to purchase this event.');
          return;
      }

      const purchaseUrl = `${baseUrl}stripe/purchase/${event.id}`;

      try {
          const response = await axios.post(purchaseUrl, {}, {
              headers: {
                  'Authorization': `Bearer ${token}`
              }
          });

          console.log('Stripe purchase API response:', response.data);

          if (response.data && response.data.url) {
              window.location.href = response.data.url;
          } else {
              alert('Failed to get Stripe checkout URL from API.');
          }

      } catch (error) {
          console.error('Error calling Stripe purchase API:', error);
          alert(error.response?.data?.message || 'Failed to initiate purchase. Please try again.');
           if (error.response && error.response.status === 401) {
               alert('Your session has expired. Please login again.');
           }
      }
  };

    // Function to navigate back to the home page
    const goHome = () => {
        navigate('/');
    };

    const handleNextMedia = () => {
        if (media && media.length > 1) {
            setCurrentMediaIndex((prevIndex) => (prevIndex + 1) % media.length);
        }
    };

    const handlePrevMedia = () => {
        if (media && media.length > 1) {
            setCurrentMediaIndex((prevIndex) => (prevIndex - 1 + media.length) % media.length);
        }
    };


  if (loading) {
    return <div className="text-center text-gray-600 mt-8">Loading event details...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600 mt-8">Error: {error}</div>;
  }

  if (!event) {
    return <div className="text-center text-gray-600 mt-8">Event not available.</div>;
  }

  const media = parseMedia(event.media);
  const currentMedia = media[currentMediaIndex];

  return (
    <div className="px-6 sm:px-10 lg:px-20 py-6 flex flex-col gap-6">
      {/* Custom Back Button to Home */}
      <button onClick={goHome} className="flex items-center text-blue-600 hover:underline mb-4">
         &larr; Back to Home
      </button>

      {/* Event Details Content */}
      <div className="w-full">
        {/* Media Slider */}
        {media.length > 0 ? (
           <div className="media-container relative w-full h-96 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center"> {/* Use flex for slider */}
              <div key={currentMediaIndex} className="media-item relative w-full h-full flex items-center justify-center"> {/* Added media-item class */}
                 {currentMedia.type === 'image' ? (
                    <img src={currentMedia.url} alt={`Event Media ${currentMediaIndex + 1}`} className="w-full h-full object-contain" onContextMenu={(e) => e.preventDefault()} draggable="false"/> // object-contain for images in slider
                 ) : (
                    <video src={currentMedia.url} className="w-full h-full object-contain" controls controlsList="nodownload" disablePictureInPicture onContextMenu={(e) => e.preventDefault()}/> // object-contain for videos in slider
                 )}
              </div>

              {/* Slider Navigation Buttons */}
              {media.length > 1 && (
                 <>
                    <button
                       onClick={handlePrevMedia}
                       className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full z-20 hover:bg-opacity-75 focus:outline-none"
                       aria-label="Previous media"
                    >
                       <ChevronLeft size={24} />
                    </button>
                    <button
                       onClick={handleNextMedia}
                       className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full z-20 hover:bg-opacity-75 focus:outline-none"
                       aria-label="Next media"
                    >
                       <ChevronRight size={24} />
                    </button>
                 </>
              )}
           </div>
        ) : (
           <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">No media available</span>
           </div>
        )}

        {/* Title */}
        <h2 className="text-3xl font-bold mt-6 text-black">{event.title || 'No Title'}</h2>

        {/* Info Rows */}
        <div className="mt-4 flex flex-col gap-3 text-black"> {/* Use flex-col and gap for rows */}
           {/* Row 1: Listing ID */}
           <div className="text-gray-600 text-sm">
              Listing ID: {event.id}
           </div>

           {/* Row 2: Category and Address */}
           <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                 <span>Category:</span>
                 <span className="font-semibold">{event.category || 'Unknown'}</span>
              </div>
               <div className="flex items-center gap-2">
                 <MapPin size={16} />
                 <span>{event.address || 'No address'}</span>
               </div>
           </div>

           {/* Row 3: Date, Price/Exclusivity */}
           <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                 <Calendar size={16} />
                 <span>{formatDate(event.date)}</span>
              </div>
               <div className="flex items-center gap-2">
                 {event.isFree ? (
                    <span className="text-green-600 font-semibold">Free</span>
                 ) : event.isExclusive ? (
                    <span className="flex items-center gap-1 text-purple-600 font-semibold"><Lock size={16} /> Exclusive</span>
                 ) : ( event.price !== undefined && event.price !== null && (
                    <span className="text-green-600 font-semibold"><DollarSign size={16} className="inline-block mr-1" />{event.price}</span>
                 ))}
              </div>
           </div>
        </div>

        {/* Description */}
        <p className="mt-6 text-black">{event.description || 'No description'}</p>

        {/* Buy Now Button */}
        {!event.isFree && !event.isSold && ( // Only show Buy Now if not free and not already sold
            <button
                onClick={handleBuyNow}
                className="bg-blue-600 text-white rounded-lg py-3 mt-6 w-full text-xl font-semibold hover:bg-blue-700 transition"
            >
                Buy Now
            </button>
        )}

      </div>
    </div>
  );
};

export default EventDetail;
