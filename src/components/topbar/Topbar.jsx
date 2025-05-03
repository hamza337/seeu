import { useState } from 'react';
import { Home, Image, Users, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Topbar() {
  const [modal, setModal] = useState(null); // 'login' or 'signup'

  const closeModal = () => setModal(null);

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
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-md mx-auto relative">
            <button onClick={closeModal} className="absolute top-3 right-3 text-gray-600 hover:text-black">
              <X size={20} />
            </button>
            <h2 className="text-xl text-black font-semibold mb-4 text-center">
              {modal === 'login' ? 'Login to your account' : 'Create an account'}
            </h2>
            <form className="space-y-4">
              <div>
                <label className="block text-black text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border border-black text-black rounded-lg px-3 py-2 focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-black text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  className="w-full border border-black text-black rounded-lg px-3 py-2 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
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
