import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useMap } from './MapContext';

const LoginModalContext = createContext();

export const useLoginModal = () => {
  const context = useContext(LoginModalContext);
  if (!context) {
    throw new Error('useLoginModal must be used within a LoginModalProvider');
  }
  return context;
};

export const LoginModalProvider = ({ children }) => {
  const [currentModalView, setCurrentModalView] = useState('login');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [selectedAvatar, setSelectedAvatar] = useState('/icons8-male-user-48.png');
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  const { 
    showLoginModal, 
    setShowLoginModal, 
    setIsAuthenticated,
    setSearchResults,
    setCategorizedSearchResults,
    setActiveSearchQuery,
    setSearchLocation,
    clearAllEntriesFn
  } = useMap();
  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedProfileImage = localStorage.getItem('profileImageUrl');
    
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      
      // Set profile image from stored data or user data
      if (storedProfileImage) {
        setSelectedAvatar(storedProfileImage);
      } else if (userData.profileImageUrl) {
        setSelectedAvatar(userData.profileImageUrl);
        localStorage.setItem('profileImageUrl', userData.profileImageUrl);
      } else {
        setSelectedAvatar('/icons8-male-user-48.png');
      }
    }
  }, []);

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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    try {
      const response = await axios.post(`${baseUrl}auth/register`, {
        email,
        phoneNumber,
        password,
      });
      if (response.status === 201) {
        toast.success("Account Registered, Please Login")
        setShowLoginModal(false);
        setCurrentModalView('login');
        setEmail('');
        setPhoneNumber('');
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
        // Store the complete login response
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.access_token);
        // localStorage.setItem('loginResponse', JSON.stringify(response.data));
        
        // Store profile image URL if available
        if (response.data.user.profileImageUrl) {
          localStorage.setItem('profileImageUrl', response.data.user.profileImageUrl);
          setSelectedAvatar(response.data.user.profileImageUrl);
        } else {
          // Remove any existing profile image URL if user doesn't have one
          localStorage.removeItem('profileImageUrl');
          setSelectedAvatar('/icons8-male-user-48.png');
        }
        
        setIsAuthenticated(true);
        setUser(response.data.user);
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
        toast.success('Password reset successfully! Please login with your new password.');
        closeModal();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  const closeModal = () => {
    setShowLoginModal(false);
    setCurrentModalView('login');
    setError('');
    setEmail('');
    setPhoneNumber('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userAvatar');
    localStorage.removeItem('profileImageUrl');
    // localStorage.removeItem('loginResponse');
    setIsAuthenticated(false);
    setUser(null);
    setSelectedAvatar('/icons8-male-user-48.png');
    
    // Clear search results and search fields
    setSearchResults(null);
    setCategorizedSearchResults(null);
    setActiveSearchQuery(null);
    setSearchLocation(null);
    
    // Clear all search entries if function is available
    if (clearAllEntriesFn) {
      clearAllEntriesFn();
    }
    
    // Redirect to home page
    navigate('/');
  };

  const handleAvatarSelect = (avatarPath) => {
    setSelectedAvatar(avatarPath);
    localStorage.setItem('userAvatar', avatarPath);
  };

  const switchModalView = (view) => {
    setCurrentModalView(view);
    setError('');
    setEmail('');
    setPhoneNumber('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const value = {
    currentModalView,
    email,
    setEmail,
    phoneNumber,
    setPhoneNumber,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    user,
    selectedAvatar,
    setSelectedAvatar,
    otp,
    setOtp,
    resendTimer,
    isResendDisabled,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    isMobile,
    handleSignUp,
    handleLogin,
    handleSendOtp,
    handleVerifyOtp,
    handleResetPassword,
    closeModal,
    switchModalView,
    handleLogout,
    handleAvatarSelect,
  };

  return (
    <LoginModalContext.Provider value={value}>
      {children}
    </LoginModalContext.Provider>
  );
};