import { useState, useEffect } from 'react';
import { Home, Image, Settings, X, Eye, EyeOff, Download } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
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
  const baseUrl = import.meta.env.VITE_API_URL;
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { showLoginModal, setShowLoginModal, setIsAuthenticated } = useMap();
  const location = useLocation();

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
    setShowAvatarModal(false);
    setDropdownOpen(false);
  };

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
                onClick={() => setDropdownOpen(prev => !prev)}
              />
              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50 dropdown-menu"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                >
                  <NavLink
                    to="/my-events"
                    className="block px-4 py-2 text-sm text-gray-700 w-full text-left hover:bg-gray-100"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    My Events
                  </NavLink>
                  <button
                    onClick={() => setShowAvatarModal(true)}
                    className="block px-4 py-2 text-sm text-gray-700 w-full text-left hover:bg-gray-100"
                    role="menuitem"
                  >
                    Change Avatar
                  </button>
                  <NavLink
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 w-full text-left hover:bg-gray-100"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Settings
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="block px-4 py-2 text-sm text-red-700 w-full text-left hover:bg-gray-100"
                    role="menuitem"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Avatar Selection Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-2xl p-3 w-[90%] max-w-sm mx-auto relative">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base text-black font-semibold">Choose Avatar</h2>
              <button 
                onClick={() => setShowAvatarModal(false)} 
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <X size={16} />
              </button>
            </div>
            <div className="h-px bg-gray-300 mb-2"></div>
            
            <div className="grid grid-cols-3 gap-2">
              {AVATAR_OPTIONS.map((avatar, index) => (
                <div
                  key={index}
                  className={`relative group rounded-lg p-1 transition-all duration-300 ${
                    selectedAvatar === avatar 
                      ? 'ring-2 ring-blue-500 bg-blue-50 shadow-md' 
                      : 'hover:bg-gray-50 hover:shadow-md'
                  }`}
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleAvatarSelect(avatar)}
                  >
                    <img
                      src={avatar}
                      alt={`Avatar ${index + 1}`}
                      className="w-16 h-16 rounded-full object-cover mx-auto transition-transform duration-200 group-hover:scale-105"
                    />
                  </div>
                  
                  {/* Download button overlay */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadAvatar(avatar, index);
                      }}
                      className="bg-white hover:bg-gray-100 text-gray-600 hover:text-blue-600 p-1.5 rounded-full shadow-lg border border-gray-200 transition-all duration-200 hover:scale-110"
                      title={`Download Avatar ${index + 1}`}
                    >
                      <Download size={14} />
                    </button>
                  </div>
                  
                  {/* Selected indicator */}
                  {selectedAvatar === avatar && (
                    <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  

                </div>
              ))}
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="text-center text-xs text-gray-500">
                💡 Hover to download • {selectedAvatar ? 'Selected!' : 'Choose one'}
              </div>
            </div>
          </div>
        </div>
      )}

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
