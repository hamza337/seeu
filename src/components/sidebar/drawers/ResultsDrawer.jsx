import React from 'react';
import { X, Camera, Lock } from 'lucide-react';
import axios from 'axios';
import { useMap } from '../../../contexts/MapContext';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ResultsDrawer({
  results,
  onClose,
  onEventClick,
  notifyMeParams,
  onNotifyMeClick,
  isSidebarExpanded,
  collapsedSidebarWidthPx,
  expandedSidebarWidthPx,
  leftPx,
  drawerWidthPx
}) {
  const { setHoveredEventId, activeSearchQuery, setShowLoginModal, triggerRefreshEvents, notifyMePayload, setAnimatedMarkerId } = useMap();
  const [modalEventId, setModalEventId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const baseUrl = import.meta.env.VITE_API_URL;
  
  // Responsive drawer width and positioning
  const responsiveDrawerWidthPx = isMobile ? Math.min(window.innerWidth - 80, 350) : (drawerWidthPx || 415);
  const responsiveLeftPx = isSidebarExpanded ? (expandedSidebarWidthPx || 256) : (collapsedSidebarWidthPx || 56);
  
  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const categoryIcons = {
    'Accident': <img src="/accident.svg" alt="Accident" className="w-5 h-5" />,
    'Pet': <img src="/pet.svg" alt="Pet" className="w-5 h-5" />,
    'Lost & Found': <img src="/lostnfound.svg" alt="Lost and Found" className="w-5 h-5" />,
    'Crime': <img src="/crime.svg" alt="Crime" className="w-5 h-5" />,
    'People': <img src="/people.svg" alt="People" className="w-5 h-5" />,
    'Other': <img src="/other.svg" alt="Other" className="w-5 h-5" />
  };

  const frontendCategories = ['within 1 mile', 'within 3 miles', 'within 5 miles', 'within 6-200 miles'];

  // Function to transform API response to frontend categories
  const transformResultsToFrontendCategories = (apiResults) => {
    if (!apiResults || apiResults.status === 404) return apiResults;
    
    const transformedResults = {
      'within 1 mile': [],
      'within 3 miles': [],
      'within 5 miles': [],
      'within 6-200 miles': []
    };
    
    // Map API categories to frontend categories
    Object.keys(apiResults).forEach(apiCategory => {
      if (Array.isArray(apiResults[apiCategory])) {
        const events = apiResults[apiCategory];
        
        // Determine which frontend category this API category maps to
        let targetCategory;
        if (apiCategory === 'within 1 mile') {
          targetCategory = 'within 1 mile';
        } else if (apiCategory === 'within 3 miles') {
          targetCategory = 'within 3 miles';
        } else if (apiCategory === 'within 5 miles') {
          targetCategory = 'within 5 miles';
        } else {
          // Any other distance category (like "within 10 miles", "within 20 miles", etc.) goes to 6-200 miles
          targetCategory = 'within 6-200 miles';
        }
        
        transformedResults[targetCategory] = [...transformedResults[targetCategory], ...events];
      }
    });
    
    return transformedResults;
  };

  // Transform results for display
  const displayResults = transformResultsToFrontendCategories(results);

  // Notify Me handler
  const handleNotifyMe = async () => {
    if (!notifyMePayload) return;
    const token = localStorage.getItem('token');
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    try {
      const payload = notifyMePayload;
      if (payload.lat == null || payload.lng == null) {
        toast.error('Location data missing for Notify Me.');
        return;
      }
      await axios.post(`${baseUrl}events/notify-me`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success('Notification request generated successfully!');
      triggerRefreshEvents();
    } catch (error) {
      console.error('Error calling notify-me API:', error);
      toast.error(error.response?.data?.message || 'Failed to subscribe for notifications.');
      if (error.response && error.response.status === 401) {
        setShowLoginModal(true);
      }
    }
  };

  if (!results) {
    return (
      <div 
        className="fixed top-0 h-screen z-[100] bg-white shadow-lg rounded-xl flex items-center justify-center" 
        style={{ 
          width: `${responsiveDrawerWidthPx}px`,
          left: `${responsiveLeftPx}px`,
          paddingTop: isMobile ? '2rem' : '2rem'
        }}
      >
        <div className={`absolute top-8 right-0 ${isMobile ? 'p-3' : 'p-4'}`}>
          <X onClick={onClose} className="text-gray-600 hover:text-black cursor-pointer" />
        </div>
        <div className="text-center w-full">
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold mb-4`}>Search Results</h2>
          <p className={`text-gray-500 ${isMobile ? 'text-sm' : ''}`}>No search performed yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed top-0 h-screen z-[100] bg-white shadow-lg transition-all duration-500 ease-in-out rounded-xl ${results ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 pointer-events-none'}`}
      style={{
        width: `${responsiveDrawerWidthPx}px`,
        left: `${responsiveLeftPx}px`,
        paddingTop: isMobile ? '2rem' : '2rem',
        borderRadius: '18px',
        boxShadow: '0 0 24px 0 rgba(0,0,0,0.12)',
      }}
    >
      <div className={`${isMobile ? 'px-4 pt-4 pb-3' : 'px-6 pt-6 pb-4'} flex justify-between items-center border-b bg-white sticky top-0 z-10`}>
        <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} text-black font-bold`}>Search Results</h2>
        <X onClick={onClose} className="text-gray-600 hover:text-black cursor-pointer" />
      </div>
      <div className={`flex flex-col h-[calc(100vh-4.5rem)] overflow-y-auto ${isMobile ? 'px-4 pb-4 pt-2' : 'px-6 pb-6 pt-3'} scrollbar-hide`}>
        {activeSearchQuery && (
          <div className={`${isMobile ? 'pt-3 pb-3 mb-3' : 'pt-4 pb-4 mb-4'} border-b`}>
            <div className={`flex items-center gap-2 mb-2 ${isMobile ? 'text-xs' : 'text-sm'} text-gray-700`}>
              <span className="font-semibold">Categories:</span>
              <span>{activeSearchQuery.categories.join(', ') || 'Any'}</span>
            </div>
            <div className={`flex items-center gap-2 mb-2 ${isMobile ? 'text-xs' : 'text-sm'} text-gray-700`}>
              <span className="font-semibold">Where:</span>
              <span className="truncate">{activeSearchQuery.address || 'Anywhere'}</span>
            </div>
            {activeSearchQuery.dateFrom && (
              <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'} text-gray-700`}>
                <span className="font-semibold">When:</span>
                <span>
                  {activeSearchQuery.dateFrom.toLocaleDateString()} - {activeSearchQuery.dateTo ? activeSearchQuery.dateTo.toLocaleDateString() : 'Present'}
                </span>
              </div>
            )}
          </div>
        )}
        {/* Always show Notify Me box after a search */}
        {activeSearchQuery && (
          <div className={`text-center text-gray-600 ${isMobile ? 'mb-4 p-3' : 'mb-6 p-4'} bg-gray-100 rounded-lg`}>
            <p className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold ${isMobile ? 'mb-1' : 'mb-2'}`}>We aren't giving up! We will let you know of any future Poings that matches your search.</p>
            <button
              onClick={handleNotifyMe}
              className={`${isMobile ? 'mt-1 py-1.5 px-3 text-sm' : 'mt-2 py-2 px-4'} w-auto bg-[#0868a8] text-white rounded hover:cursor-pointer`}
            >
              Notify Me
            </button>
          </div>
        )}
        {/* Events List */}
        {results && results.status === 404 ? (
          <div className={`text-center text-gray-600 ${isMobile ? 'mt-4' : 'mt-8'}`}>
            <p className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold ${isMobile ? 'mb-1' : 'mb-2'}`}>No Record found.</p>
          </div>
        ) : (
          frontendCategories.map(category => (
            <div key={category} className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-800 ${isMobile ? 'mb-2' : 'mb-3'}`}>{category}</h3>
              {displayResults && displayResults[category] && displayResults[category].length > 0 ? (
                <div className={`${isMobile ? 'space-y-2' : 'space-y-4'}`}>
                  {displayResults[category].map((event) => (
                    <div 
                      key={event.id} 
                      className={`flex items-center ${isMobile ? 'gap-2 p-2' : 'gap-4 p-3'} bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-all`}
                      onClick={() => onEventClick && onEventClick(event)}
                      onMouseEnter={() => { setHoveredEventId(event.id); setAnimatedMarkerId(event.id); }}
                      onMouseLeave={() => { setHoveredEventId(null); setAnimatedMarkerId(null); }}
                    >
                      <div className={`${isMobile ? 'w-16 h-16' : 'w-24 h-24'} bg-gray-200 rounded-lg overflow-hidden flex-shrink-0`}>
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
                            <Camera size={isMobile ? 16 : 24} className="text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`flex items-center gap-2 ${isMobile ? 'mb-0.5' : 'mb-1'}`}>
                          <div className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`}>
                            {React.cloneElement(categoryIcons[event.category], { 
                              className: `${isMobile ? 'w-4 h-4' : 'w-5 h-5'}` 
                            })}
                          </div>
                          <h4 className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{event.title}</h4>
                        </div>
                        <p className={`${isMobile ? 'text-xs mb-1' : 'text-sm mb-2'} text-gray-600`}>{event.address}</p>
                        <div className="flex items-center gap-2">
                          {!event.isFree && (
                            <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-green-600`}>${event.price}</span>
                          )}
                          {event.isExclusive && (
                            <span className={`flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-sm'} text-purple-600`}>
                              <Lock size={isMobile ? 12 : 14} />
                              Exclusive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center text-gray-600 ${isMobile ? 'mt-4' : 'mt-8'}`}>
                  <p className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold ${isMobile ? 'mb-1' : 'mb-2'}`}>No events found.</p>
                  <p className={`${isMobile ? 'text-sm' : ''}`}>No events found in this category.</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}