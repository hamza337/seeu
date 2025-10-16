import { X, Eye, EyeOff } from 'lucide-react';
import { createPortal } from 'react-dom';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useLoginModal } from '../../contexts/LoginModalContext';
import { useMap } from '../../contexts/MapContext';

export default function LoginModal() {
  const { showLoginModal } = useMap();
  const {
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
  } = useLoginModal();

  if (!showLoginModal) return null;

  const modalContent = (
    <div className="fixed opacity-100 inset-0 bg-grey flex items-center justify-center z-[9999]">
      <div className={`bg-white rounded-xl shadow-lg ${isMobile ? 'p-4 w-[65%] max-w-sm mx-2' : 'p-6 w-[90%] max-w-md'} mx-auto relative z-[9999]`}>
        <button onClick={closeModal} className="absolute top-3 right-3 text-gray-600 hover:text-black">
          <X size={20} />
        </button>
        {currentModalView === 'login' && (
          <div>
             <h2 className={`text-black font-semibold text-center ${isMobile ? 'text-lg mb-3' : 'text-xl mb-4'}`}>Login to your account</h2>
             {error && <p className={`text-red-600 text-center ${isMobile ? 'text-xs mb-2' : 'text-sm mb-2'}`}>{error}</p>}
             <form onSubmit={handleLogin} className={isMobile ? 'space-y-3' : 'space-y-4'}>
                <div>
                  <label className={`block text-black font-medium mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full border border-black text-black rounded-lg focus:outline-none ${isMobile ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'}`}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-black font-medium mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full border border-black text-black rounded-lg focus:outline-none ${isMobile ? 'px-2 py-1.5 pr-8 text-sm' : 'px-3 py-2 pr-10'}`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute inset-y-0 right-0 flex items-center text-gray-600 hover:text-black ${isMobile ? 'pr-2' : 'pr-3'}`}
                    >
                      {showPassword ? <EyeOff size={isMobile ? 16 : 18} /> : <Eye size={isMobile ? 16 : 18} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className={`w-full bg-[#0868A8] text-white rounded-lg hover:bg-[#0868A8] transition ${isMobile ? 'py-1.5 text-sm' : 'py-2'}`}
                >
                  Login
                </button>
             </form>
             <div className={isMobile ? 'mt-3 text-center' : 'mt-4 text-center'}>
                 <p className={`text-black ${isMobile ? 'text-xs' : 'text-sm'}`}>Don't have an account yet? <button onClick={() => switchModalView('signup')} className="text-blue-600 hover:underline">Sign Up</button></p>
                 <button onClick={() => switchModalView('forgotPasswordSendOtp')} className={`text-blue-600 hover:underline ${isMobile ? 'text-xs mt-1' : 'text-sm mt-2'}`}>Forget password ?</button>
             </div>
          </div>
        )}

        {currentModalView === 'signup' && (
          <div>
             <h2 className={`text-black font-semibold text-center ${isMobile ? 'text-lg mb-3' : 'text-xl mb-4'}`}>Create an account</h2>
             {error && <p className={`text-red-600 text-center ${isMobile ? 'text-xs mb-2' : 'text-sm mb-2'}`}>{error}</p>}
             <form onSubmit={handleSignUp} className={isMobile ? 'space-y-3' : 'space-y-4'}>
                <div>
                  <label className={`block text-black font-medium mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full border border-black text-black rounded-lg focus:outline-none ${isMobile ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'}`}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-black font-medium mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>Phone Number</label>
                  <PhoneInput
                    international
                    countryCallingCodeEditable={false}
                    defaultCountry="US"
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    className={`w-full border border-black text-black rounded-lg focus:outline-none ${isMobile ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'}`}
                    style={{
                      '--PhoneInputCountryFlag-height': '1em',
                      '--PhoneInputCountrySelectArrow-color': '#6b7280',
                      '--PhoneInput-color--focus': '#2563eb'
                    }}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-black font-medium mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full border border-black text-black rounded-lg focus:outline-none ${isMobile ? 'px-2 py-1.5 pr-8 text-sm' : 'px-3 py-2 pr-10'}`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute inset-y-0 right-0 flex items-center text-gray-600 hover:text-black ${isMobile ? 'pr-2' : 'pr-3'}`}
                    >
                      {showPassword ? <EyeOff size={isMobile ? 16 : 18} /> : <Eye size={isMobile ? 16 : 18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={`block text-black font-medium mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full border border-black text-black rounded-lg focus:outline-none ${isMobile ? 'px-2 py-1.5 pr-8 text-sm' : 'px-3 py-2 pr-10'}`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute inset-y-0 right-0 flex items-center text-gray-600 hover:text-black ${isMobile ? 'pr-2' : 'pr-3'}`}
                    >
                      {showConfirmPassword ? <EyeOff size={isMobile ? 16 : 18} /> : <Eye size={isMobile ? 16 : 18} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className={`w-full bg-[#0868A8] text-white rounded-lg hover:bg-[#0868A8] transition ${isMobile ? 'py-1.5 text-sm' : 'py-2'}`}
                >
                  Sign Up
                </button>
             </form>
             <div className={isMobile ? 'mt-3 text-center' : 'mt-4 text-center'}>
                 <button onClick={() => switchModalView('login')} className={`text-blue-600 hover:underline ${isMobile ? 'text-xs' : 'text-sm'}`}>Back to Login</button>
             </div>
          </div>
        )}

        {currentModalView === 'forgotPasswordSendOtp' && (
           <div>
             <h2 className={`text-black font-semibold text-center ${isMobile ? 'text-lg mb-3' : 'text-xl mb-4'}`}>Reset Password</h2>
             {error && <p className={`text-red-600 text-center ${isMobile ? 'text-xs mb-2' : 'text-sm mb-2'}`}>{error}</p>}
             <form onSubmit={handleSendOtp} className={isMobile ? 'space-y-3' : 'space-y-4'}>
                <div>
                  <label className={`block text-black font-medium mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full border border-black text-black rounded-lg focus:outline-none ${isMobile ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'}`}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className={`w-full bg-[#0868A8] text-white rounded-lg hover:bg-[#0868A8] transition ${isMobile ? 'py-1.5 text-sm' : 'py-2'}`}
                >
                  Send OTP
                </button>
             </form>
             <div className={isMobile ? 'mt-3 text-center' : 'mt-4 text-center'}>
                 <button onClick={() => switchModalView('login')} className={`text-blue-600 hover:underline ${isMobile ? 'text-xs' : 'text-sm'}`}>Back to Login</button>
             </div>
           </div>
        )}

        {currentModalView === 'forgotPasswordVerifyOtp' && (
           <div>
             <h2 className={`text-black font-semibold text-center ${isMobile ? 'text-lg mb-3' : 'text-xl mb-4'}`}>Verify OTP</h2>
             {error && <p className={`text-red-600 text-center ${isMobile ? 'text-xs mb-2' : 'text-sm mb-2'}`}>{error}</p>}
             <form onSubmit={handleVerifyOtp} className={isMobile ? 'space-y-3' : 'space-y-4'}>
                <div>
                  <label className={`block text-black font-medium mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>Enter 6-digit OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className={`w-full border border-black text-black rounded-lg focus:outline-none text-center tracking-widest ${isMobile ? 'px-2 py-1.5 text-sm' : 'px-3 py-2'}`}
                    placeholder="••••••"
                    maxLength="6"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className={`w-full bg-[#0868A8] text-white rounded-lg hover:bg-[#0868A8] transition ${isMobile ? 'py-1.5 text-sm' : 'py-2'}`}
                >
                  Verify OTP
                </button>
             </form>
             <div className={isMobile ? 'mt-3 text-center' : 'mt-4 text-center'}>
                 {isResendDisabled ? (
                    <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Resend OTP in {resendTimer}s</p>
                 ) : (
                    <button onClick={handleSendOtp} className={`text-blue-600 hover:underline ${isMobile ? 'text-xs' : 'text-sm'}`}>Resend OTP</button>
                 )}
                 <button onClick={() => switchModalView('login')} className={`text-blue-600 hover:underline ${isMobile ? 'text-xs ml-2' : 'text-sm ml-4'}`}>Back to Login</button>
             </div>
           </div>
        )}

        {currentModalView === 'forgotPasswordResetPassword' && (
           <div>
             <h2 className={`text-black font-semibold text-center ${isMobile ? 'text-lg mb-3' : 'text-xl mb-4'}`}>Set New Password</h2>
             {error && <p className={`text-red-600 text-center ${isMobile ? 'text-xs mb-2' : 'text-sm mb-2'}`}>{error}</p>}
             <form onSubmit={handleResetPassword} className={isMobile ? 'space-y-3' : 'space-y-4'}>
                <div>
                  <label className={`block text-black font-medium mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full border border-black text-black rounded-lg focus:outline-none ${isMobile ? 'px-2 py-1.5 pr-8 text-sm' : 'px-3 py-2 pr-10'}`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute inset-y-0 right-0 flex items-center text-gray-600 hover:text-black ${isMobile ? 'pr-2' : 'pr-3'}`}
                    >
                      {showPassword ? <EyeOff size={isMobile ? 16 : 18} /> : <Eye size={isMobile ? 16 : 18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={`block text-black font-medium mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full border border-black text-black rounded-lg focus:outline-none ${isMobile ? 'px-2 py-1.5 pr-8 text-sm' : 'px-3 py-2 pr-10'}`}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute inset-y-0 right-0 flex items-center text-gray-600 hover:text-black ${isMobile ? 'pr-2' : 'pr-3'}`}
                    >
                      {showConfirmPassword ? <EyeOff size={isMobile ? 16 : 18} /> : <Eye size={isMobile ? 16 : 18} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className={`w-full bg-[#0868A8] text-white rounded-lg hover:bg-[#0868A8] transition ${isMobile ? 'py-1.5 text-sm' : 'py-2'}`}
                >
                  Reset Password
                </button>
             </form>
             <div className={isMobile ? 'mt-3 text-center' : 'mt-4 text-center'}>
                  <button onClick={() => switchModalView('login')} className={`text-blue-600 hover:underline ${isMobile ? 'text-xs' : 'text-sm'}`}>Back to Login</button>
             </div>
           </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}