import { useState, useEffect } from 'react';
import { Home, Image, Users, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';

export default function Topbar() {
  const [modal, setModal] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const baseUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

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
        setModal(null);
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
        setUser(response.data.user);
        setModal(null);
        setEmail('');
        setPassword('');
        setError('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    }
  };

  const closeModal = () => {
    setModal(null);
    setError('');
  };

  return (
    <>
      {/* Topbar */}
      <div className="w-full flex justify-end items-center px-2 py-1 bg-transparent">
        <div className="flex items-center gap-6">
          {!user ? (
            <>
              <button onClick={() => setModal('login')} className="text-black font-normal hover:underline">Login</button>
              <button onClick={() => setModal('signup')} className="text-black font-normal hover:underline">Sign Up</button>
            </>
          ) : (
            <div className="relative">
              <img
                src="/icons8-male-user-48.png"
                alt="Profile"
                className="h-10 w-10 rounded-full object-cover cursor-pointer"
                onClick={() => setDropdownOpen(prev => !prev)}
              />
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 bg-white border rounded shadow-lg z-50">
                  <button
                    onClick={() => {
                      localStorage.removeItem('user');
                      localStorage.removeItem('token');
                      setUser(null);
                      setDropdownOpen(false);
                    }}
                    className="block px-4 py-2 text-black hover:bg-gray-100 w-full text-left"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
          <NavLink to="/media">
            <Image className="text-black hover:text-gray-600" />
          </NavLink>
          <NavLink to="/user">
            <Users className="text-black hover:text-gray-600" />
          </NavLink>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md mx-auto relative">
            <button onClick={closeModal} className="absolute top-3 right-3 text-gray-600 hover:text-black">
              <X size={20} />
            </button>
            <h2 className="text-xl text-black font-semibold mb-4 text-center">
              {modal === 'login' ? 'Login to your account' : 'Create an account'}
            </h2>
            {error && <p className="text-red-600 text-sm text-center mb-2">{error}</p>}
            <form onSubmit={modal === 'login' ? handleLogin : handleSignUp} className="space-y-4">
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
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-black text-black rounded-lg px-3 py-2 focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
              {modal === 'signup' && (
                <div>
                  <label className="block text-black text-sm font-medium mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-black text-black rounded-lg px-3 py-2 focus:outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                {modal === 'login' ? 'Login' : 'Sign Up'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
