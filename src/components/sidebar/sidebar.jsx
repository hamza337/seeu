import { BadgePoundSterling, Home, Image, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const menu = [
    { name: 'Home', icon: <Home size={24} />, path: '/' },
    { name: 'Media', icon: <Image size={24} />, path: '/media' },
    { name: 'Users', icon: <Users size={24} />, path: '/user' },
  ];

  return (
    <div className="h-screen w-20 bg-white flex flex-col items-center py-6 shadow-lg">
      {/* Logo */}
      <div className="mb-10">
      <img
          src="/Poing.svg" // Change to /poing.svg if it's an SVG
          alt="Poing Logo"
          className="h-14 w-14 object-contain"
        />
      </div>

      {/* Menu Items */}
      <div className="flex flex-col gap-6">
        {menu.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `p-3 rounded-xl transition ${
                isActive ? 'bg-black text-white' : 'bg-gray-200 text-black'
              }`
            }
          >
            {item.icon}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
