import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  // Initialize notifications from localStorage
  const [newEventNotifications, setNewEventNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('eventNotifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading notifications from localStorage:', error);
      return [];
    }
  });
  const [sseConnection, setSseConnection] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionRetries, setConnectionRetries] = useState(0);
  const maxRetries = 5;
  const baseUrl = import.meta.env.VITE_API_URL;

  // Calculate total unread notifications
  const unreadCount = newEventNotifications.length;
  const hasUnreadNotifications = unreadCount > 0;

  const connectToNotificationStream = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token || sseConnection || isConnecting) return;

    setIsConnecting(true);
    console.log('Attempting to establish SSE connection...');

    try {
      const response = await fetch(`${baseUrl}notify/stream`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('SSE connection established successfully');
      setConnectionRetries(0); // Reset retry count on successful connection
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      // Create a mock EventSource-like object for compatibility
      const mockEventSource = {
        close: () => {
          reader.cancel();
          console.log('SSE connection closed');
        },
        readyState: 1 // OPEN
      };
      
      setSseConnection(mockEventSource);

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('SSE stream ended');
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6); // Remove 'data: ' prefix
                if (data.trim() && data !== '[DONE]') {
                  try {
                    const parsedData = JSON.parse(data);
                    console.log('Received SSE notification:', parsedData);
                    
                    if (parsedData.type === 'event-match' && parsedData.event) {
                       // Add new event notification to the list
                       setNewEventNotifications(prev => {
                         const exists = prev.some(notification => notification.event.id === parsedData.event.id);
                         if (!exists) {
                           const updated = [parsedData, ...prev];
                           // Save to localStorage
                           localStorage.setItem('eventNotifications', JSON.stringify(updated));
                           return updated;
                         }
                         return prev;
                       });
                       
                       // Show toast notification
                       toast.success(`New ${parsedData.event.category} event matches your criteria!`, {
                         duration: 5000,
                         position: 'top-right'
                       });
                     }
                  } catch (parseError) {
                    console.error('Error parsing SSE message:', parseError);
                  }
                }
              }
            }
          }
        } catch (streamError) {
          console.error('SSE stream error:', streamError);
          
          // Only attempt reconnection if we haven't exceeded max retries
          if (connectionRetries < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, connectionRetries), 30000); // Exponential backoff, max 30s
            console.log(`Attempting to reconnect SSE in ${delay}ms... (attempt ${connectionRetries + 1}/${maxRetries})`);
            
            setTimeout(() => {
              setConnectionRetries(prev => prev + 1);
              connectToNotificationStream();
            }, delay);
          } else {
            console.error('Max SSE reconnection attempts reached');
            toast.error('Connection lost. Please refresh the page to restore notifications.');
          }
        } finally {
          setSseConnection(null);
          setIsConnecting(false);
        }
      };

      processStream();

    } catch (error) {
      console.error('Error establishing SSE connection:', error);
      
      // Only attempt reconnection if we haven't exceeded max retries
      if (connectionRetries < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, connectionRetries), 30000); // Exponential backoff, max 30s
        console.log(`Attempting to reconnect SSE in ${delay}ms... (attempt ${connectionRetries + 1}/${maxRetries})`);
        
        setTimeout(() => {
          setConnectionRetries(prev => prev + 1);
          connectToNotificationStream();
        }, delay);
      } else {
        console.error('Max SSE reconnection attempts reached');
        toast.error('Unable to establish notification connection. Please refresh the page.');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [baseUrl, sseConnection, isConnecting, connectionRetries]);

  const disconnectFromNotificationStream = useCallback(() => {
    if (sseConnection) {
      sseConnection.close();
      setSseConnection(null);
      console.log('SSE connection manually closed');
    }
    setIsConnecting(false);
  }, [sseConnection]);

  // Clear a specific notification
  const clearNotification = useCallback((notificationId) => {
    setNewEventNotifications(prev => {
      const updated = prev.filter(notification => notification.event.id !== notificationId);
      localStorage.setItem('eventNotifications', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNewEventNotifications([]);
    localStorage.removeItem('eventNotifications');
  }, []);

  // Mark notifications as viewed and clear them (when user visits notification tab)
  const markNotificationsAsViewed = useCallback(() => {
    console.log('Notifications viewed and cleared');
    setNewEventNotifications([]);
    localStorage.removeItem('eventNotifications');
  }, []);

  // Initialize SSE connection on mount if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      connectToNotificationStream();
    }

    // Cleanup on unmount
    return () => {
      disconnectFromNotificationStream();
    };
  }, []);

  // Handle page visibility changes to manage SSE connection efficiently
  useEffect(() => {
    const handleVisibilityChange = () => {
      const token = localStorage.getItem('token');
      if (document.hidden) {
        // Page is hidden, close SSE connection to save resources
        disconnectFromNotificationStream();
      } else if (token && !sseConnection && !isConnecting) {
        // Page is visible, reconnect SSE
        connectToNotificationStream();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connectToNotificationStream, disconnectFromNotificationStream, sseConnection, isConnecting]);

  // Listen for authentication changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (e.newValue) {
          // User logged in, establish connection
          connectToNotificationStream();
        } else {
          // User logged out, close connection and clear notifications
          disconnectFromNotificationStream();
          setNewEventNotifications([]);
          localStorage.removeItem('eventNotifications');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [connectToNotificationStream, disconnectFromNotificationStream]);

  const value = {
    newEventNotifications,
    unreadCount,
    hasUnreadNotifications,
    isConnecting,
    connectionRetries,
    sseConnection,
    connectToNotificationStream,
    disconnectFromNotificationStream,
    clearNotification,
    clearAllNotifications,
    markNotificationsAsViewed,
    NewEventNotificationCard
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// NewEventNotificationCard component for displaying real-time event notifications
const NewEventNotificationCard = ({ notification, onViewEvent, onViewLocation }) => {
  const { event } = notification;
  
  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'sports':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
            <path d="M10 6c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/>
          </svg>
        );
      case 'music':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 0 0-1.196-.98l-10 2A1 1 0 0 0 6 5v6.15A3.5 3.5 0 0 0 4.5 11A3.5 3.5 0 1 0 8 14.5V7.041l8-1.6v4.559A3.5 3.5 0 0 0 14.5 10a3.5 3.5 0 1 0 3.5 3.5V3z"/>
          </svg>
        );
      case 'food':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM5 5v8h10V5H5z"/>
          </svg>
        );
      case 'art':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 relative">
      {/* New Match Badge */}
      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
        New Match!
      </div>
      
      {/* Red dot indicator */}
      <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full"></div>
      
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            {getCategoryIcon(event.category)}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {event.category}
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {event.category}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {event.description}
          </p>
          
          <div className="flex items-center text-sm text-gray-500 space-x-4 mb-3">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>{event.location}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>{new Date(event.date).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>{event.time}</span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => onViewEvent && onViewEvent(event)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              View Event
            </button>
            
            <button
              onClick={() => onViewLocation && onViewLocation(event)}
              className="inline-flex items-center px-3 py-1.5 border border-green-300 text-xs font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              View on Map
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationContext;