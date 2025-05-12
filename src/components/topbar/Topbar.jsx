import { useState } from 'react';
import { Home, Image, Users, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';

export default function Topbar() {
  const [modal, setModal] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const baseUrl = import.meta.env.VITE_API_URL;

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password || !confirmPassword) {
      return setError('All fields are required.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return setError('Invalid email format.');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    try {
      const response = await axios.post(`${baseUrl}auth/register`, {
        email,
        password
      });
      if (response.status === 201 || response.status === 200) {
        setSuccess('Account created successfully!');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to sign up. Try again.';
      setError(msg);
    }
  };

  const closeModal = () => {
    setModal(null);
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <>
      {/* Topbar */}
      <div className="w-full flex justify-end items-center px-2 py-1 bg-transparent">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setModal('login')}
            className="text-black font-normal hover:underline"
          >
            Login
          </button>
          <button
            onClick={() => setModal('signup')}
            className="text-black font-normal hover:underline"
          >
            Sign Up
          </button>

          <NavLink to="/">
            <Home className="text-black hover:text-gray-600" />
          </NavLink>
          <NavLink to="/media">
            <Image className="text-black hover:text-gray-600" />
          </NavLink>
          <NavLink to="/user">
            <Users className="text-black hover:text-gray-600" />
          </NavLink>

          <img
            src="/icons8-male-user-48.png"
            alt="Profile"
            className="h-10 w-10 rounded-full object-cover"
          />
        </div>
      </div>

      {/* Modal */}
      {modal === 'signup' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md mx-auto relative">
            <button onClick={closeModal} className="absolute top-3 right-3 text-gray-600 hover:text-black">
              <X size={20} />
            </button>
            <h2 className="text-xl text-black font-semibold mb-4 text-center">Create an account</h2>

            <form className="space-y-4" onSubmit={handleSignUp}>
              {error && <div className="text-red-500 text-sm text-center">{error}</div>}
              {success && <div className="text-green-600 text-sm text-center">{success}</div>}

              <div>
                <label className="block text-black text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-black text-black rounded-lg px-3 py-2 focus:outline-none"
                  placeholder="you@example.com"
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
                />
              </div>
              <div>
                <label className="block text-black text-sm font-medium mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-black text-black rounded-lg px-3 py-2 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Sign Up
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
