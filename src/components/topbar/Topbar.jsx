import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { IoHelpOutline } from "react-icons/io5";
import axios from 'axios';
import { useMap } from '../../contexts/MapContext';
import { useLoginModal } from '../../contexts/LoginModalContext';
import LoginModal from '../modals/LoginModal';
import toast from 'react-hot-toast';

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
  const [dropdownView, setDropdownView] = useState('main'); // 'main', 'avatar', 'settings', 'language'
  const [searchLanguage, setSearchLanguage] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(null); // Track which avatar is being uploaded
  
  // Mobile responsiveness state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  
  const baseUrl = import.meta.env.VITE_API_URL;
  const userEmail = JSON.parse(localStorage.getItem('user'));

  const { setShowLoginModal, setIsAuthenticated, isAuthenticated } = useMap();
  const { user, selectedAvatar, handleLogout, handleAvatarSelect } = useLoginModal();
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

  const handleUploadAvatar = async () => {
    try {
      // Create file input element
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/jpeg,image/jpg,image/png,image/gif';
      fileInput.multiple = false; // Ensure only single file selection
      fileInput.style.display = 'none';
      
      fileInput.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          alert('Please select a valid image file (JPG, PNG, or GIF)');
          return;
        }
        
        // Validate file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
          alert('File size must be less than 5MB');
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
          
          // Step 3: Save image URL to user profile
          const saveResponse = await axios.post(`${baseUrl}auth/me/save-image`, {
            imageUrl
          }, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (saveResponse.status === 201) {
            // Update the avatar in the UI and store in localStorage
            handleAvatarSelect(imageUrl);
            localStorage.setItem('profileImageUrl', imageUrl);
            
            // Reset dropdown view to main to show updated avatar
            setDropdownView('main');
            
            toast.success('Profile picture updated successfully!');
          }
          
        } catch (error) {
          console.error('Error uploading avatar:', error);
          alert('Failed to upload image. Please try again.');
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
            <button onClick={() => { setShowLoginModal(true); setCurrentModalView('login'); }} className="text-black font-normal hover:underline">Login</button>
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
                            <div className="font-medium text-gray-900">{userEmail}</div>
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
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span>My Events</span>
                          </div>
                        </NavLink>
                        
                        <button
                          className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors"
                          onClick={() => setDropdownView('avatar')}
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

                  {/* Avatar Selection View */}
                  {dropdownView === 'avatar' && (
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
                        <h3 className="text-lg font-medium">User Profile </h3>
                      </div>
                      
                      <div className="p-6">
                        {/* Current Avatar Display */}
                        <div className="flex flex-col items-center mb-6">
                          <div className="relative mb-4">
                            <ProfileImage
                              src={selectedAvatar || '/avatar1.png'}
                              alt="Current Avatar"
                              className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 shadow-lg"
                            />
                            {selectedAvatar && (
                              <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1.5 shadow-lg border-2 border-white">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <h4 className="text-lg font-medium text-gray-900 mb-2">Profile Picture</h4>
                          <p className="text-sm text-gray-500 text-center mb-6">Upload a custom image to personalize your profile</p>
                        </div>
                        
                        {/* Upload Button */}
                        <div className="space-y-4">
                          <button
                            onClick={handleUploadAvatar}
                            disabled={uploadingAvatar === 'custom'}
                            className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-blue-300 disabled:to-blue-400 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
                          >
                            {uploadingAvatar === 'custom' ? (
                              <>
                                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="font-medium">Uploading...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <span className="font-medium">Choose Image</span>
                              </>
                            )}
                          </button>
                          
                          <div className="text-xs text-gray-500 text-center">
                            <p>Supported formats: JPG, PNG, GIF</p>
                            <p>Maximum file size: 5MB</p>
                          </div>
                        </div>
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
