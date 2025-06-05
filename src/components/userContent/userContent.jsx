import { useState } from 'react';
import { Globe, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

const UsersContent = () => {
  const [showModal, setShowModal] = useState(false);

  const menu = [
    { label: 'Language Setting', icon: <Globe size={20} />, path: '/settings/language-setting' },
    { label: 'Wallet', icon: <Wallet size={20} />, path: '/settings/wallet' },
  ];

  return (
    <div className="px-6 sm:px-10 lg:px-20 py-10">
      {/* Heading */}
      <h1 className="font-semibold text-black mb-6">User</h1>

      {/* Options List */}
      <div className="flex flex-col gap-4">
        {menu.map((item, index) => (
          item.path ? (
            <Link
              to={item.path}
              key={index}
              className="flex items-center gap-4 border border-black rounded-lg p-4 text-black hover:bg-black hover:text-white transition"
            >
              {item.icon}
              <span className="font-semibold">{item.label}</span>
            </Link>
          ) : (
            <div
              key={index}
              onClick={() => setShowModal(true)}
              className="flex items-center gap-4 border border-black rounded-lg p-4 text-black hover:bg-black hover:text-white transition cursor-pointer"
            >
              {item.icon}
              <span className="font-semibold">{item.label}</span>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default UsersContent;
