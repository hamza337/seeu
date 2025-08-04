import { useState, useEffect } from 'react';
import { Home, Image, Settings, X, Eye, EyeOff, Download } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { IoHelpOutline, IoSettings } from "react-icons/io5";
import axios from 'axios';
import { useMap } from '../../contexts/MapContext';

// Array of available avatar options
const AVATAR_OPTIONS = [
  '/avatar1.png',
  '/avatar2.png',
  '/avatar3.png',
  '/avatar4.png',
  '/avatar5.png',
  '/avatar6.png',
  '/avatar7.png',
  '/avatar8.png',
  '/avatar9.png',
];

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

export default function Topbar() {
  const [modal, setModal] = useState(false);
  const [currentModalView, setCurrentModalView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('/icons8-male-user-48.png');
  const [dropdownView, setDropdownView] = useState('main'); // 'main', 'avatar', 'settings', 'language'
  const [searchLanguage, setSearchLanguage] = useState('');
  const baseUrl = import.meta.env.VITE_API_URL;
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { showLoginModal, setShowLoginModal, setIsAuthenticated } = useMap();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedAvatar = localStorage.getItem('userAvatar');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      if (storedAvatar) {
        setSelectedAvatar(storedAvatar);
      }
    }
  }, []);

  useEffect(() => {
    setModal(showLoginModal);
  }, [showLoginModal]);

  useEffect(() => {
    let timerId;
    if (isResendDisabled && resendTimer > 0) {
      timerId = setTimeout(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else if (resendTimer === 0 && isResendDisabled) {
      setIsResendDisabled(false);
    }
    return () => clearTimeout(timerId);
  }, [resendTimer, isResendDisabled]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    try {
      const response = await axios.post(`${baseUrl}auth/register`, {
        email,
        password,
      });
      if (response.status === 201) {
        setModal(false);
        setShowLoginModal(false);
        setCurrentModalView('login');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setError('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${baseUrl}auth/login`, {
        email,
        password,
      });
      if (response.status === 201) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.access_token);
        setIsAuthenticated(true);
        setUser(response.data.user);
        setModal(false);
        setShowLoginModal(false);
        setCurrentModalView('login');
        setEmail('');
        setPassword('');
        setError('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userAvatar');
    setIsAuthenticated(false);
    setUser(null);
    setSelectedAvatar('/icons8-male-user-48.png');
    setDropdownOpen(false);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) {
      return setError('Please enter your email address.');
    }
    try {
      const response = await axios.post(`${baseUrl}auth/forgot-password/send-otp`, {
        email,
      });
      if (response.status === 201) {
        setCurrentModalView('forgotPasswordVerifyOtp');
        setResendTimer(60);
        setIsResendDisabled(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp || otp.length !== 6) {
      return setError('Please enter a valid 6-digit OTP.');
    }
    try {
      const response = await axios.post(`${baseUrl}auth/forgot-password/verify-otp`, {
        email,
        otp
      });
      if (response.status === 201) {
        setCurrentModalView('forgotPasswordResetPassword');
        setOtp('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify OTP.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (!password || password.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }
    try {
      const response = await axios.post(`${baseUrl}auth/forgot-password/reset`, {
        email,
        newPassword: password
      });
      if (response.status === 201) {
        alert('Password reset successfully! Please login with your new password.');
        closeModal();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  const closeModal = () => {
    setModal(false);
    setShowLoginModal(false);
    setCurrentModalView('login');
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const switchModalView = (view) => {
    setCurrentModalView(view);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleAvatarSelect = (avatarPath) => {
    setSelectedAvatar(avatarPath);
    localStorage.setItem('userAvatar', avatarPath);
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

  const handleDownloadAvatar = async (avatarPath, index) => {
    try {
      const response = await fetch(avatarPath);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `avatar-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading avatar:', error);
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
          <div className="absolute left-1/2 -translate-x-1/2 top-5 z-[120] pointer-events-none">
            <img src="/brandLogoFinal.png" alt="Poing Logo" className="w-40 object-contain" />
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
            <div className="absolute right-0 top-10 w-130 p-4 bg-gray-300 text-black text-sm rounded-lg shadow-lg z-50">
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
              <img
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
                <div className="absolute right-0 mt-2 w-80 bg-white text-gray-900 rounded-lg shadow-2xl z-50 border border-gray-200 dropdown-menu">
                  {/* Main Menu */}
                  {dropdownView === 'main' && (
                    <div className="py-2">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                          <img
                            src={selectedAvatar}
                            alt="Profile"
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-medium text-gray-900">User Name</div>
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
                            <span>Change Avatar</span>
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
                            onClick={handleLogout}
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
                        <h3 className="text-lg font-medium">Change Avatar</h3>
                      </div>
                      
                      <div className="p-4">
                         <div className="grid grid-cols-3 gap-4">
                           {AVATAR_OPTIONS.map((avatar, index) => (
                             <div key={index} className="relative group">
                               <div className="relative">
                                 <button
                                   onClick={() => handleAvatarSelect(avatar)}
                                   className="relative w-full block"
                                 >
                                   <img
                                     src={avatar}
                                     alt={`Avatar ${index + 1}`}
                                     className={`w-16 h-16 rounded-full object-cover transition-all duration-200 ${
                                       selectedAvatar === avatar 
                                         ? 'ring-4 ring-blue-500 ring-offset-2 ring-offset-white' 
                                         : 'group-hover:ring-2 group-hover:ring-blue-400 group-hover:ring-offset-2 group-hover:ring-offset-white'
                                     }`}
                                   />
                                   {selectedAvatar === avatar && (
                                     <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1.5 shadow-lg border-2 border-white">
                                       <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                         <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                       </svg>
                                     </div>
                                   )}
                                 </button>
                                 
                                 {/* Download button */}
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleDownloadAvatar(avatar, index);
                                   }}
                                   className="absolute -bottom-2 -right-2 bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg border-2 border-white transition-all duration-200 opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100"
                                   title="Download Avatar"
                                 >
                                   <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                     <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                   </svg>
                                 </button>
                               </div>
                             </div>
                           ))}
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



      {/* Modal */}
      {showLoginModal && (
        <div className="fixed opacity-100 inset-0 bg-grey flex items-center justify-center z-[100]">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md mx-auto relative z-70">
            <button onClick={closeModal} className="absolute top-3 right-3 text-gray-600 hover:text-black">
              <X size={20} />
            </button>
            {currentModalView === 'login' && (
              <div>
                 <h2 className="text-xl text-black font-semibold mb-4 text-center">Login to your account</h2>
                 {error && <p className="text-red-600 text-sm text-center mb-2">{error}</p>}
                 <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-black text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-black text-black rounded-lg px-3 py-2 focus:outline-none"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-black text-sm font-medium mb-1">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full border border-black text-black rounded-lg px-3 py-2 pr-10 focus:outline-none"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-black"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      Login
                    </button>
                 </form>
                 <div className="mt-4 text-center">
                     <p className="text-black text-sm">Don't have an account yet? <button onClick={() => switchModalView('signup')} className="text-blue-600 hover:underline">Sign Up</button></p>
                     <button onClick={() => switchModalView('forgotPasswordSendOtp')} className="text-sm text-blue-600 hover:underline mt-2">Forget password ?</button>
                 </div>
              </div>
            )}

            {currentModalView === 'signup' && (
              <div>
                 <h2 className="text-xl text-black font-semibold mb-4 text-center">Create an account</h2>
                 {error && <p className="text-red-600 text-sm text-center mb-2">{error}</p>}
                 <form onSubmit={handleSignUp} className="space-y-4">
                    <div>
                      <label className="block text-black text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-black text-black rounded-lg px-3 py-2 focus:outline-none"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-black text-sm font-medium mb-1">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full border border-black text-black rounded-lg px-3 py-2 pr-10 focus:outline-none"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-black"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-black text-sm font-medium mb-1">Confirm Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full border border-black text-black rounded-lg px-3 py-2 pr-10 focus:outline-none"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-black"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      Sign Up
                    </button>
                 </form>
                 <div className="mt-4 text-center">
                     <button onClick={() => switchModalView('login')} className="text-sm text-blue-600 hover:underline">Back to Login</button>
                 </div>
              </div>
            )}

            {currentModalView === 'forgotPasswordSendOtp' && (
               <div>
                 <h2 className="text-xl text-black font-semibold mb-4 text-center">Reset Password</h2>
                 {error && <p className="text-red-600 text-sm text-center mb-2">{error}</p>}
                 <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="block text-black text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-black text-black rounded-lg px-3 py-2 focus:outline-none"
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      Send OTP
                    </button>
                 </form>
                 <div className="mt-4 text-center">
                     <button onClick={() => switchModalView('login')} className="text-sm text-blue-600 hover:underline">Back to Login</button>
                 </div>
               </div>
            )}

            {currentModalView === 'forgotPasswordVerifyOtp' && (
               <div>
                 <h2 className="text-xl text-black font-semibold mb-4 text-center">Verify OTP</h2>
                 {error && <p className="text-red-600 text-sm text-center mb-2">{error}</p>}
                 <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                      <label className="block text-black text-sm font-medium mb-1">Enter 6-digit OTP</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full border border-black text-black rounded-lg px-3 py-2 focus:outline-none text-center tracking-widest"
                        placeholder="••••••"
                        maxLength="6"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      Verify OTP
                    </button>
                 </form>
                 <div className="mt-4 text-center">
                     {isResendDisabled ? (
                        <p className="text-gray-600 text-sm">Resend OTP in {resendTimer}s</p>
                     ) : (
                        <button onClick={handleSendOtp} className="text-sm text-blue-600 hover:underline">Resend OTP</button>
                     )}
                     <button onClick={() => switchModalView('login')} className="text-sm text-blue-600 hover:underline ml-4">Back to Login</button>
                 </div>
               </div>
            )}

            {currentModalView === 'forgotPasswordResetPassword' && (
               <div>
                 <h2 className="text-xl text-black font-semibold mb-4 text-center">Set New Password</h2>
                 {error && <p className="text-red-600 text-sm text-center mb-2">{error}</p>}
                 <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-black text-sm font-medium mb-1">New Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full border border-black text-black rounded-lg px-3 py-2 pr-10 focus:outline-none"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-black"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-black text-sm font-medium mb-1">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full border border-black text-black rounded-lg px-3 py-2 pr-10 focus:outline-none"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-black"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      Reset Password
                    </button>
                 </form>
                 <div className="mt-4 text-center">
                      <button onClick={() => switchModalView('login')} className="text-sm text-blue-600 hover:underline">Back to Login</button>
                 </div>
               </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
