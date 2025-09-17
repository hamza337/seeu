import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { IoHelpOutline } from "react-icons/io5";
import axios from 'axios';
import { useMap } from '../../contexts/MapContext';
import { useLoginModal } from '../../contexts/LoginModalContext';
import toast from 'react-hot-toast';
import { useNotification } from '../../contexts/NotificationContext';
import LoginModal from '../../components/modals/loginmodal.jsx';

// Language options
const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
];

// Component to render profile image or initial
const ProfileImage = ({ src, alt, className, onClick }) => {
  const [imageError, setImageError] = useState(false);
  
  // Reset imageError when src changes
  useEffect(() => {
    setImageError(false);
  }, [src]);
  
  const handleImageError = () => {
    setImageError(true);
  };
  
  if (!src || src === '/icons8-male-user-48.png' || imageError) {
    return (
      <div 
        className={`${className} bg-blue-500 text-white flex items-center justify-center font-semibold text-lg cursor-pointer`}
        onClick={onClick}
      >
        U
      </div>
    );
  }
  
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onClick={onClick}
      onError={handleImageError}
    />
  );
};

export default function Topbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [dropdownView, setDropdownView] = useState('main'); // 'main', 'avatar', 'settings', 'language', 'profile'
  const [searchLanguage, setSearchLanguage] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(null); // Track which avatar is being uploaded
  
  // Profile form states
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    country: '',
    address: '',
    profileImageUrl: ''
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Mobile responsiveness state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  
  const baseUrl = import.meta.env.VITE_API_URL;
  const storedUser = localStorage.getItem('user');
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const userName = parsedUser ? 
    (parsedUser.firstName && parsedUser.lastName ? 
      parsedUser.firstName + ' ' + parsedUser.lastName : 
      parsedUser.email) : null;

  const { setShowLoginModal, setIsAuthenticated, isAuthenticated } = useMap();
  const { user, selectedAvatar, handleLogout, handleAvatarSelect } = useLoginModal();
  const { hasUnreadNotifications, unreadCount } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();



  // Handle window resize for mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  const handleLogoutClick = () => {
    handleLogout();
    setDropdownOpen(false);
  };

  const handleAvatarSelectClick = (avatarPath) => {
    handleAvatarSelect(avatarPath);
    setDropdownView('main');
    setShowAvatarModal(false);
    setDropdownOpen(false);
  };

  const resetDropdown = () => {
    setDropdownView('main');
    setSearchLanguage('');
  };

  const filteredLanguages = LANGUAGE_OPTIONS.filter(lang =>
    lang.name.toLowerCase().includes(searchLanguage.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchLanguage.toLowerCase())
  );

  // Load profile data when component mounts or user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        country: user.country || '',
        address: user.address || '',
        profileImageUrl: user.profileImageUrl || ''
      });
    }
  }, [user]);

  const handleUploadAvatar = async () => {
    try {
      // Create file input element
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/jpeg,image/jpg,image/png,image/gif';
      fileInput.multiple = false;
      fileInput.style.display = 'none';
      
      fileInput.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          toast.error('Please select a valid image file (JPG, PNG, or GIF)');
          return;
        }
        
        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
          toast.error('File size must be less than 5MB');
          return;
        }
        
        setUploadingAvatar('custom');
        
        try {
          // Step 1: Get presigned URL
          const fileName = file.name;
          const fileType = file.type;
          
          const presignedResponse = await axios.post(`${baseUrl}events/presigned-urls`, {
            files: [{ fileName, fileType }]
          });
          
          if (presignedResponse.status !== 201) {
            throw new Error('Failed to get presigned URL');
          }
          
          const { url, imageUrl } = presignedResponse.data[0];
          
          // Step 2: Upload file to presigned URL
          const uploadResponse = await fetch(url, {
            method: 'PUT',
            body: file,
            headers: {
              'Content-Type': fileType
            }
          });
          
          if (uploadResponse.status !== 200) {
            throw new Error('Failed to upload file');
          }
          
          // Step 3: Update profile with new image URL
          const updateResponse = await axios.patch(`${baseUrl}auth/profile`, {
            profileImageUrl: imageUrl
          }, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (updateResponse.status === 200) {
            // Update the avatar in the UI and localStorage
            handleAvatarSelect(imageUrl);
            localStorage.setItem('profileImageUrl', imageUrl);
            
            // Update user data in localStorage
            const updatedUser = { ...user, profileImageUrl: imageUrl };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Update profile form data
            setProfileData(prev => ({ ...prev, profileImageUrl: imageUrl }));
            
            toast.success('Profile picture updated successfully!');
          }
          
        } catch (error) {
          console.error('Error uploading avatar:', error);
          toast.error('Failed to upload image. Please try again.');
        } finally {
          setUploadingAvatar(null);
        }
      };
      
      // Trigger file selection
      document.body.appendChild(fileInput);
      fileInput.click();
      document.body.removeChild(fileInput);
      
    } catch (error) {
      console.error('Error setting up file upload:', error);
      setUploadingAvatar(null);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    
    try {
      const updateData = {};
      
      // Only include fields that have values
      Object.keys(profileData).forEach(key => {
        if (profileData[key] && profileData[key].trim() !== '') {
          updateData[key] = profileData[key].trim();
        }
      });
      
      const response = await axios.patch(`${baseUrl}auth/profile`, updateData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.status === 200) {
        // Update user data in localStorage
        const updatedUser = { ...user, ...updateData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update profile image if changed
        if (updateData.profileImageUrl) {
          handleAvatarSelect(updateData.profileImageUrl);
          localStorage.setItem('profileImageUrl', updateData.profileImageUrl);
        }
        
        toast.success('Profile updated successfully!');
        setDropdownView('main');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleProfileInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  // Add click-outside handler for dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      const dropdownNode = document.querySelector('.dropdown-menu');
      const profileImage = document.querySelector('.profile-image');
      
      if (dropdownOpen && dropdownNode && !dropdownNode.contains(event.target) && profileImage && !profileImage.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <>
      {/* Topbar */}
      <div className="w-full flex justify-end items-center px-2 py-1 bg-transparent relative">
        {/* Brand Logo Overlapping - only on home route */}
        {location.pathname === '/' && (
          <div className="absolute left-1/2 -translate-x-1/2 top-5 z-[90] pointer-events-none">
            <img src="/brandLogoFinal.png" alt="Poing Logo" className="w-28 sm:w-32 md:w-36 lg:w-40 object-contain" />
          </div>
        )}
        {/* Help Icon */}
        <div
          className="relative group"
          onMouseEnter={() => setShowHelp(true)}
          onMouseLeave={() => setShowHelp(false)}
        >
          <div className="p-2 rounded-full bg-gray-300">
            <IoHelpOutline className="text-[#0b4bb2] w-5 h-5 cursor-pointer" />
          </div>
          {showHelp && (
            <div className={`absolute right-0 top-10 ${isMobile ? 'w-64' : 'w-130'} p-4 bg-gray-300 text-black text-sm rounded-lg shadow-lg z-100`}>
              <p className="text-lg font-semibold mb-2">About Poing</p>
              <p className="mb-2">
                Poing is a smarter, more effective tool for posting and locating lost items, witnesses to events (such as thefts, accidents, or unique moments), as well as lost pets and people — all based on location and time!
              </p>
              <p className="mb-2">
                Our platform connects the entire world through a single map and local time system, eliminating the need to join multiple communities, browse endless boards, or sort through thousands of unrelated posts.
              </p>
              <p className="mb-2">
                Posting is easy: simply upload or record a photo or video via your mobile device or web browser, mark the location and time, and choose whether to offer the media for free, request a fee, or make it available exclusively to one recipient.
              </p>
              <p className="mb-2">
                Searching is just as simple: enter a location, radius, and timeframe to find the item, event, or person you're looking for. If no matching posts are available, you can set a notification alert so others know you're searching — and you'll be notified instantly if a relevant post is created.
              </p>
              <p className="font-semibold">
                Go ahead - Just Poing It!
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6 ml-4">
          {!user ? (
            <button onClick={() => setShowLoginModal(true)} className="text-black font-normal hover:underline">Login</button>
          ) : (
            <div className="relative">
              <ProfileImage
                src={selectedAvatar}
                alt="Profile"
                className="h-11 w-11 rounded-full object-cover cursor-pointer profile-image"
                onClick={() => {
                  if (!dropdownOpen) {
                    resetDropdown();
                  }
                  setDropdownOpen(prev => !prev);
                }}
              />
              {/* Red dot indicator for unread notifications */}
              {hasUnreadNotifications && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </div>
              )}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white text-gray-900 rounded-lg shadow-2xl z-100 border border-gray-200 dropdown-menu">
                  {/* Main Menu */}
                  {dropdownView === 'main' && (
                    <div className="py-2">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <ProfileImage
                            src={selectedAvatar}
                            alt="Profile"
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{userName}</div>
                            <div className="text-sm text-gray-500">See your profile</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="py-2">
                        <NavLink
                          to="/my-events"
                          className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center relative">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                              {/* Red dot indicator for My Events */}
                              {hasUnreadNotifications && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                              )}
                            </div>
                            <span>My Events</span>
                          </div>
                          {hasUnreadNotifications && (
                            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">
                                {unreadCount > 9 ? '9+' : unreadCount}
                              </span>
                            </div>
                          )}
                        </NavLink>
                        
                        <button
                          className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors"
                          onClick={() => setDropdownView('profile')}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span>User Profile</span>
                          </div>
                          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        <button
                          className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors"
                          onClick={() => setDropdownView('settings')}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span>Settings</span>
                          </div>
                          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        <div className="border-t border-gray-200 mt-2 pt-2">
                          <button
                            onClick={handleLogoutClick}
                            className="flex items-center w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <span>Logout</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Profile Edit View */}
                  {dropdownView === 'profile' && (
                    <div className="py-2">
                      <div className="flex items-center px-4 py-3 border-b border-gray-200">
                        <button
                          onClick={() => setDropdownView('main')}
                          className="mr-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <h3 className="text-lg font-medium">Edit Profile</h3>
                      </div>
                      
                      <div className="p-6 max-h-96 overflow-y-auto">
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                          {/* Profile Picture Section */}
                          <div className="flex flex-col items-center mb-6">
                            <div className="relative mb-4">
                              <ProfileImage
                                src={selectedAvatar}
                                alt="Profile Picture"
                                className="w-20 h-20 rounded-full object-cover border-4 border-gray-200 shadow-lg"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleUploadAvatar}
                              disabled={uploadingAvatar === 'custom'}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium disabled:text-blue-300"
                            >
                              {uploadingAvatar === 'custom' ? 'Uploading...' : 'Change Picture'}
                            </button>
                          </div>

                          {/* Form Fields */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name
                              </label>
                              <input
                                type="text"
                                value={profileData.firstName}
                                onChange={(e) => handleProfileInputChange('firstName', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter first name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name
                              </label>
                              <input
                                type="text"
                                value={profileData.lastName}
                                onChange={(e) => handleProfileInputChange('lastName', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter last name"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              value={profileData.phoneNumber}
                              onChange={(e) => handleProfileInputChange('phoneNumber', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter phone number"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Country
                            </label>
                            <input
                              type="text"
                              value={profileData.country}
                              onChange={(e) => handleProfileInputChange('country', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter country"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Address
                            </label>
                            <textarea
                              value={profileData.address}
                              onChange={(e) => handleProfileInputChange('address', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              placeholder="Enter address"
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-3 pt-4">
                            <button
                              type="button"
                              onClick={() => setDropdownView('main')}
                              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isUpdatingProfile}
                              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-lg transition-colors"
                            >
                              {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Settings View */}
                  {dropdownView === 'settings' && (
                    <div className="py-2">
                      <div className="flex items-center px-4 py-3 border-b border-gray-200">
                        <button
                          onClick={() => setDropdownView('main')}
                          className="mr-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <h3 className="text-lg font-medium">Settings</h3>
                      </div>
                      
                      <div className="py-2">
                        <button
                          className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors"
                          onClick={() => setDropdownView('language')}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7 2a1 1 0 011 1v1h3a1 1 0 110 2H9.578a18.87 18.87 0 01-1.724 4.78c.29.354.596.696.914 1.026a1 1 0 11-1.44 1.389c-.188-.196-.373-.396-.554-.6a19.098 19.098 0 01-3.107 3.567 1 1 0 01-1.334-1.49 17.087 17.087 0 003.13-3.733 18.992 18.992 0 01-1.487-2.494 1 1 0 111.79-.89c.234.47.489.928.764 1.372.417-.934.752-1.913.997-2.927H3a1 1 0 110-2h3V3a1 1 0 011-1zm6 6a1 1 0 01.894.553l2.991 5.982a.869.869 0 01.02.037l.99 1.98a1 1 0 11-1.79.895L15.383 16h-4.764l-.724 1.447a1 1 0 11-1.788-.894l.99-1.98.019-.038 2.99-5.982A1 1 0 0113 8zm-1.382 6h2.764L13 11.236 11.618 14z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span>Language</span>
                          </div>
                          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        
                        <button
                          className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            navigate('/wallet');
                            setDropdownOpen(false);
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span>Wallet</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Language Selection View */}
                  {dropdownView === 'language' && (
                    <div className="py-2">
                      <div className="flex items-center px-4 py-3 border-b border-gray-200">
                        <button
                          onClick={() => setDropdownView('settings')}
                          className="mr-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <h3 className="text-lg font-medium">Language</h3>
                      </div>
                      
                      <div className="p-4">
                        <div className="relative mb-4">
                          <input
                            type="text"
                            placeholder="Search languages"
                            value={searchLanguage}
                            onChange={(e) => setSearchLanguage(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                          />
                          <svg className="absolute right-3 top-2.5 w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                          </svg>
                        </div>
                        
                        <div className="max-h-64 overflow-y-auto">
                          {filteredLanguages.map((language) => (
                            <button
                              key={language.code}
                              className="flex items-center justify-between w-full px-3 py-3 text-left hover:bg-gray-100 rounded-lg transition-colors mb-1"
                              onClick={() => {/* Handle language selection */}}
                            >
                              <div>
                                <div className="font-medium">{language.name}</div>
                                <div className="text-sm text-gray-500">{language.nativeName}</div>
                              </div>
                              {language.code === 'en' && (
                                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Login Modal - rendered via portal */}
      <LoginModal />




    </>
  );
}
