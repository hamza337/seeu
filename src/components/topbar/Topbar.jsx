import { Home, Image, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function Topbar() {
  return (
    <div className="w-full flex justify-end items-center px-2 py-1 bg-transparent">
      <div className="flex items-center gap-6">
        <NavLink to="/login" className="text-black font-normal hover:underline">
          Login
        </NavLink>
        <NavLink to="/signup" className="text-black font-normal hover:underline">
          Sign Up
        </NavLink>

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
  );
}
