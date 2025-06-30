import { X, Camera, Lock } from 'lucide-react';
import axios from 'axios';
import { useMap } from '../../../contexts/MapContext';
import { useState } from 'react';

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
  const baseUrl = import.meta.env.VITE_API_URL;

  const categoryIcons = {
    'Accident': <img src="/accident.svg" alt="Accident" className="w-5 h-5" />,
    'Pet': <img src="/pet.svg" alt="Pet" className="w-5 h-5" />,
    'Lost & Found': <img src="/lostnfound.svg" alt="Lost and Found" className="w-5 h-5" />,
    'Crime': <img src="/crime.svg" alt="Crime" className="w-5 h-5" />,
    'People': <img src="/people.svg" alt="People" className="w-5 h-5" />,
    'Other': <img src="/other.svg" alt="Other" className="w-5 h-5" />
  };

  const frontendCategories = ['within 1 mile', 'within 3 miles', 'within 5 miles', 'within 6-200 miles'];

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
        alert('Location data missing for Notify Me.');
        return;
      }
      await axios.post(`${baseUrl}events/notify-me`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      alert('Notification request successful! We will notify you if events match your criteria.');
      triggerRefreshEvents();
    } catch (error) {
      console.error('Error calling notify-me API:', error);
      alert(error.response?.data?.message || 'Failed to subscribe for notifications.');
      if (error.response && error.response.status === 401) {
        setShowLoginModal(true);
      }
    }
  };

  if (!results) {
    return (
      <div className="fixed top-0 pt-8 left-16 h-screen z-[100] bg-white shadow-lg rounded-xl flex items-center justify-center" style={{ width: `${drawerWidthPx || 415}px` }}>
        <div className="absolute top-0 right-0 p-4">
          <X onClick={onClose} className="text-gray-600 hover:text-black cursor-pointer" />
        </div>
        <div className="text-center w-full">
          <h2 className="text-xl font-bold mb-4">Search Results</h2>
          <p className="text-gray-500">No search performed yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed top-0 pt-8 left-16 h-screen z-[100] bg-white shadow-lg transition-all duration-500 ease-in-out rounded-xl ${results ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10 pointer-events-none'}`}
      style={{
        width: `${drawerWidthPx || 415}px`,
        borderRadius: '18px',
        boxShadow: '0 0 24px 0 rgba(0,0,0,0.12)',
      }}
    >
      <div className="px-6 pt-6 flex justify-between items-center border-b pb-4">
        <h2 className="text-xl text-black font-bold">Search Results</h2>
        <X onClick={onClose} className="text-gray-600 hover:text-black cursor-pointer" />
      </div>

      {activeSearchQuery && (
        <div className="px-6 pt-4 pb-4 border-b">
          <div className="flex items-center gap-2 mb-2 text-sm text-gray-700">
            <span className="font-semibold">Categories:</span>
            <span>{activeSearchQuery.categories.join(', ') || 'Any'}</span>
          </div>
          <div className="flex items-center gap-2 mb-2 text-sm text-gray-700">
            <span className="font-semibold">Where:</span>
            <span className="truncate">{activeSearchQuery.address || 'Anywhere'}</span>
          </div>
          {activeSearchQuery.dateFrom && (
            <div className="flex items-center gap-2 text-sm text-gray-700">
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
        <div className="text-center text-gray-600 mt-2 mb-6 p-4 bg-gray-100 rounded-lg">
          <p className="text-lg font-semibold mb-2">Can't find what you are looking for?</p>
          <button
            onClick={handleNotifyMe}
            className="mt-2 w-auto bg-[#0868a8] text-white py-2 px-4 rounded hover:cursor-pointer"
          >
            Notify Me
          </button>
        </div>
      )}

      <div className="overflow-y-auto h-[calc(100vh-4.5rem)] px-6 pb-6 pt-3 scrollbar-hide">
        {results && results.status === 404 ? (
          <div className="text-center text-gray-600 mt-8">
            <p className="text-lg font-semibold mb-2">No Record found.</p>
          </div>
        ) : (
          frontendCategories.map(category => (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{category}</h3>
              {results && results[category] && results[category].length > 0 ? (
                <div className="space-y-4">
                  {results[category].map((event) => (
                    <div 
                      key={event.id} 
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-all"
                      onClick={() => onEventClick && onEventClick(event)}
                      onMouseEnter={() => { setHoveredEventId(event.id); setAnimatedMarkerId(event.id); }}
                      onMouseLeave={() => { setHoveredEventId(null); setAnimatedMarkerId(null); }}
                    >
                      <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
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
                            <Camera size={24} className="text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {categoryIcons[event.category]}
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{event.address}</p>
                        <div className="flex items-center gap-2">
                          {!event.isFree && (
                            <span className="text-sm font-medium text-green-600">${event.price}</span>
                          )}
                          {event.isExclusive && (
                            <span className="flex items-center gap-1 text-sm text-purple-600">
                              <Lock size={14} />
                              Exclusive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-600 mt-8">
                  <p className="text-lg font-semibold mb-2">No events found.</p>
                  <p>No events found in this category.</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 