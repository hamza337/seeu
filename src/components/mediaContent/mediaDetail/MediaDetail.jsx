import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Clock, MapPin, DollarSign, Lock, ChevronLeft, ChevronRight, Share2, Twitter, Facebook } from 'lucide-react';
import BackButton from '../../../components/backBtn/backButton';
import moment from 'moment'; // Import moment for date formatting
import toast from 'react-hot-toast';
import { useModal } from '../../../contexts/ModalContext';

// Helper function to parse media JSON
const parseMedia = (mediaData) => {
  // If it's already a valid array, just return it.
  if (Array.isArray(mediaData)) {
    return mediaData;
  }

  // If it's a string, try to parse it.
  if (typeof mediaData === 'string') {
    try {
      const mediaArray = JSON.parse(mediaData);
      return Array.isArray(mediaArray) ? mediaArray : [];
    } catch (e) {
      console.error('Failed to parse media JSON string:', mediaData, e);
    }
  }

  // If it's neither, or parsing fails, return an empty array.
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



const EventDetail = ({ eventId, isModal, onClose }) => {
  const { id: routeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { openReportModal } = useModal();
  const id = eventId || routeId;
  const [event, setEvent] = useState(location.state?.event || null);
  const [loading, setLoading] = useState(!location.state?.event);
  const [error, setError] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
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
  }, [id, baseUrl, event]);

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
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      if (!token || !user.id) {
          console.log('User not authenticated. Cannot proceed with purchase.');
          toast.error('Please login to purchase this event.');
          return;
      }

      try {
          if (event.isFree) {
              // For free events, check if category has flat fee
              const categoryFeesResponse = await axios.get(`${baseUrl}admin/category-fees`);
              const categoryFees = categoryFeesResponse.data;
              
              // Find the category fee for this event's category
              const categoryFee = categoryFees.find(fee => fee.category === event.category);
              
              if (categoryFee && categoryFee.flatFee > 0) {
                  // Category has flat fee, use flat-fee-checkout API
                  // const flatFeeResponse = await axios.post(`${baseUrl}stripe/flat-fee-checkout`, {
                  //     eventId: event.id,
                  //     buyerId: user.id
                  // }, {
                  //     headers: {
                  //         'Authorization': `Bearer ${token}`
                  //     }
                  // });
                  
                  // console.log('Flat fee checkout response:', flatFeeResponse.data);
                  
                  // // Redirect to Stripe checkout for flat fee payment
                  // if (flatFeeResponse.data) {
                  //     window.location.href = flatFeeResponse.data;
                  // } else {
                  //     toast.error('Failed to get Stripe checkout URL for flat fee.');
                  // }
                  navigate('/buy-now', { state: { eventId: event.id, category: event.category, isFree: event.isFree } });
              } else {
                  // No flat fee, use original free purchase API
                  const response = await axios.post(`${baseUrl}stripe/purchase/free/${event.id}`, {}, {
                      headers: {
                          'Authorization': `Bearer ${token}`
                      }
                  });
                  
                  console.log('Free purchase API response:', response.data);
                  toast.success(response.data.message || 'Event added to your purchases successfully!');
                  navigate('/my-events');
              }
          } else {
              // For paid events, use regular purchase API
            //   const response = await axios.post(`${baseUrl}stripe/purchase/${event.id}`, {}, {
            //       headers: {
            //           'Authorization': `Bearer ${token}`
            //       }
            //   });
              
            //   console.log('Paid purchase API response:', response.data);
              
            //   // Redirect to Stripe checkout for paid events
            //   if (response.data && response.data.url) {
            //       window.location.href = response.data.url;
            //   } else {
            //       toast.error('Failed to get Stripe checkout URL from API.');
            //   }
            navigate('/buy-now', { state: { eventId: event.id, category: event.category, isFree: event.isFree } });
          }

      } catch (error) {
          console.error('Error calling purchase API:', error);
          toast.error(error.response?.data?.message || 'Failed to initiate purchase. Please try again.');
          if (error.response && error.response.status === 401) {
              toast.error('Your session has expired. Please login again.');
          }
      }
  };

  // Function to close modal or navigate back
  const handleClose = () => {
    if (onClose) onClose();
    else navigate('/');
  };

  // Navigation functions will be defined after media parsing

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
  
  // Check if current user owns this event
  const isOwner = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id && event.seller.id && user.id === event.seller.id;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return false;
    }
  };
  
  const userOwnsEvent = isOwner();
  
  // Navigation functions
  const handleNextMedia = () => {
    if (event && media && media.length > 1) {
      setCurrentMediaIndex((prevIndex) => (prevIndex + 1) % media.length);
    }
  };

  const handlePrevMedia = () => {
    if (event && media && media.length > 1) {
      setCurrentMediaIndex((prevIndex) => (prevIndex - 1 + media.length) % media.length);
    }
  };
  const handleCopyShareLink = async () => {
    try {
      const base = import.meta.env.VITE_APP_URL || window.location.origin;
      const latRaw = event?.latitude ?? event?.lat;
      const lngRaw = event?.longitude ?? event?.lng;
      const lat = typeof latRaw === 'string' ? parseFloat(latRaw) : latRaw;
      const lng = typeof lngRaw === 'string' ? parseFloat(lngRaw) : lngRaw;
      const shareLink = `${base}?lat=${lat}&lng=${lng}&eventId=${event?.id}`;

      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareLink);
      } else {
        const ta = document.createElement('textarea');
        ta.value = shareLink;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      toast.success('Link copied to clipboard');
    } catch (e) {
      console.error('Share link copy failed:', e);
      toast.error('Failed to copy link');
    }
  };

  if (isModal) {
    return (
        <div className="bg-white rounded-lg shadow-xl w-full p-6 relative">
          <button
            className="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl"
            onClick={handleClose}
            aria-label="Close"
          >
            &times;
          </button>
          {/* Event Details Content (copied from below) */}
          {(userOwnsEvent && media.length > 0) ? (
             <div className="media-container relative w-full h-72 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                <div key={currentMediaIndex} className="media-item relative w-full h-full flex items-center justify-center">
                   {currentMedia && currentMedia.type === 'image' ? (
                      <img src={currentMedia.url} alt={`Event Media ${currentMediaIndex + 1}`} className="w-full h-full object-contain" onContextMenu={(e) => e.preventDefault()} draggable="false"/>
                   ) : currentMedia && (
                      <video src={currentMedia.url} className="w-full h-full object-contain" controls controlsList="nodownload" disablePictureInPicture onContextMenu={(e) => e.preventDefault()}/>
                   )}
                </div>
                {userOwnsEvent && media.length > 1 && (
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
                      {/* Media Counter */}
                       <div className="absolute bottom-4 right-4 bg-black bg-opacity-40 text-white px-3 py-1 rounded-full text-sm z-20">
                          {currentMediaIndex + 1} of {media.length}
                       </div>
                   </>
                )}
             </div>
          ) : event.previewImage ? (
             <div className="w-full h-72 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
                <img src={event.previewImage} alt="Event Preview" className="w-full h-full object-contain" />
             </div>
          ) : (
             <div className="w-full h-72 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">No media available</span>
             </div>
          )}
          <div className="mt-4 flex items-center justify-between">
            <h3 className="font-bold text-lg text-black">{event.category === 'LostFound' ? 'Lost & Found' : event.category || 'Unknown'}</h3>
            <button
              onClick={handleCopyShareLink}
              className="w-6 h-6 rounded hover:opacity-80 focus:outline-none"
              title="Share"
            >
              <img src="/share.png" alt="Share" className="w-6 h-6" />
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-3 text-black">
             <div className="text-gray-600 text-sm">
                Listings ID: {event.eventCode}
             </div>
             <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                   <span className=' font-semibold'>Category:</span>
                   <span className="text-gray-600 italic">{event.category || 'Unknown'}</span>
                </div>
                 <div className="flex items-center gap-2">
                   <span className=' font-semibold'>Location:</span>
                   <span className="text-gray-600 italic">{event.address || 'No address'}</span>
                 </div>
             </div>
             <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                   <span className=' font-semibold'>Event Date:</span>
                   <span className="text-gray-600 italic">{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                   <span className=' font-semibold'>Posted On:</span>
                   <span className="text-gray-600 italic">{formatDate(event.createdAt)}</span>
                </div>
             </div>
             <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                   {event.isFree ? (
                      <span className="text-green-600 font-semibold">Free</span>
                   ) : ( event.price !== undefined && event.price !== null && (
                      <span className="text-green-600 font-semibold"><DollarSign size={16} className="inline-block mr-1" />{event.price}</span>
                   ))}
                 </div>
                 {event.isExclusive && (
                     <span className="flex items-center gap-1 text-purple-600 font-semibold"><Lock size={16} /> Exclusive</span>
                  )}
             </div>
          </div>
          <p className="mt-6 text-black">{event.description || 'No description'}</p>
          <div className="flex gap-3">
            <button
               onClick={() => handleBuyNow() && handleClose()}
               className=" flex-1 bg-[#0a9bf7] text-white rounded-lg py-3 mt-6 text-xl font-semibold hover:bg-[#0a9bf7] transition"
            >
               Claim
            </button>
            <button
               onClick={() => openReportModal(event.id)}
               className="flex-1 bg-red-500 text-white rounded-lg py-3 mt-6 text-xl font-semibold hover:bg-red-600 transition"
            >
                  Report
            </button>
         </div>
        </div>
    );
  }
  // Fallback: render as a normal page if not modal
  return (
    <div className="px-6 sm:px-10 lg:px-20 py-6 flex flex-col gap-6">
      <button onClick={handleClose} className="flex items-center text-blue-600 hover:underline mb-4">
         &larr; Back to Home
      </button>
      {/* Event Details Content */}
      <div className="w-full">
        {/* Media Slider */}
        {(userOwnsEvent && media.length > 0) ? (
           <div className="media-container relative w-full h-72 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center"> {/* Use flex for slider */}
              <div key={currentMediaIndex} className="media-item relative w-full h-full flex items-center justify-center"> {/* Added media-item class */}
                 {currentMedia && currentMedia.type === 'image' ? (
                    <img src={currentMedia.url} alt={`Event Media ${currentMediaIndex + 1}`} className="w-full h-full object-contain" onContextMenu={(e) => e.preventDefault()} draggable="false"/>
                 ) : currentMedia && (
                    <video src={currentMedia.url} className="w-full h-full object-contain" controls controlsList="nodownload" disablePictureInPicture onContextMenu={(e) => e.preventDefault()}/>
                 )}
              </div>

              {/* Slider Navigation Buttons */}
              {userOwnsEvent && media.length > 1 && (
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
                    {/* Media Counter */}
                     <div className="absolute bottom-4 right-4 bg-black bg-opacity-40 text-white px-3 py-1 rounded-full text-sm z-20">
                        {currentMediaIndex + 1} of {media.length}
                     </div>
                 </>
              )}
           </div>
        ) : event.previewImage ? (
           <div className="w-full h-72 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
              <img src={event.previewImage} alt="Event Preview" className="w-full h-full object-contain" />
           </div>
        ) : (
           <div className="w-full h-72 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">No media available</span>
           </div>
        )}

        {/* Title */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold text-black">{event.category === 'LostFound' ? 'Lost & Found' : event.category || ''}</h2>
          {userOwnsEvent && (
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full border border-blue-200">
              Creator
            </span>
          )}
          </div>
          <button
            onClick={handleCopyShareLink}
            className="w-6 h-6 rounded hover:opacity-80 focus:outline-none"
            title="Share"
          >
            <img src="/share.png" alt="Share" className="w-6 h-6" />
          </button>
        </div>

        {/* Info Rows */}
        <div className="mt-4 flex flex-col gap-3 text-black"> {/* Use flex-col and gap for rows */}
           {/* Row 1: Listing ID */}
           <div className="text-gray-600 text-sm">
              Listing ID: {event.eventCode}
           </div>

           {/* Row 2: Category and Address */}
           <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                 <span className='font-semibold'>Category:</span>
                 <span className="text-gray-500 italic">{event.category || 'Unknown'}</span>
              </div>
               <div className="flex items-center gap-2">
                 <span className='font-semibold'>Location:</span>
                 <span className="text-gray-500 italic">{event.address || 'No address'}</span>
               </div>
           </div>

           {/* Row 3: Date, Price/Exclusivity */}
           <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                 <span className='font-semibold'>Event Date:</span>
                 <span className="text-gray-500 italic">{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                 <span className='font-semibold'>Posted On:</span>
                 <span className="text-gray-500 italic">{formatDate(event.createdAt)}</span>
              </div>
           </div>
           <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                 {event.isFree ? (
                    <span className="text-green-600 font-semibold">Free</span>
                 ) : ( event.price !== undefined && event.price !== null && (
                    <span className="text-green-600 font-semibold"><DollarSign size={16} className="inline-block mr-1" />{event.price}</span>
                 ))}
              </div>
              {event.isExclusive && (
                 <span className="flex items-center gap-1 text-purple-600 font-semibold"><Lock size={16} /> Exclusive</span>
               )}
           </div>
        </div>

        {/* Description */}
        <p className="mt-6 text-black">{event.description || 'No description'}</p>
        
        {/* Social Media Share - Only for user's own events */}
        {userOwnsEvent && (
          <div className='mt-6'>
            <h4 className='font-semibold text-gray-900 mb-3 flex items-center gap-2'>
              <Share2 size={18} />
              Share Event
            </h4>
            <div className='flex gap-3'>
              <button
                onClick={() => shareToTwitter(event)}
                className='flex items-center gap-2 px-4 py-2 bg-[#0a9bf7] hover:bg-[#0a9bf7] text-white rounded-lg transition-colors'
              >
                <Twitter size={16} />
                Twitter
              </button>
              <button
                onClick={() => shareToFacebook(event)}
                className='flex items-center gap-2 px-4 py-2 bg-[#0a9bf7] hover:bg-[#0a9bf7] text-white rounded-lg transition-colors'
              >
                <Facebook size={16} />
                Facebook
              </button>

            </div>
          </div>
        )}
        
        {!userOwnsEvent && (
          <div className="flex gap-3 mt-6">
            <button
                onClick={handleBuyNow}
                className="flex-1 bg-[#0a9bf7] text-white rounded-lg py-3 text-xl font-semibold hover:bg-[#0a9bf7] transition"
            >
                Claim
            </button>
            <button
                onClick={() => openReportModal(event.id)}
                className="flex-1 bg-red-500 text-white rounded-lg py-3 text-xl font-semibold hover:bg-red-600 transition"
            >
                Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetail;
