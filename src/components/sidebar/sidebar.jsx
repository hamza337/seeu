import { Home, Search, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import SearchDrawer from './drawers/SearchDrawer';
import LocationDrawer from './drawers/LocationDrawer';

export default function Sidebar() {
  const [activeDrawer, setActiveDrawer] = useState(null);

  const toggleDrawer = (drawer) => {
    setActiveDrawer((prev) => (prev === drawer ? null : drawer));
  };

  return (
    <>
      {/* Fixed Sidebar */}
      <div className="h-full w-14 bg-white flex flex-col items-center py-4 shadow-md fixed left-0 top-0 z-50">
        <Link to="/">
          <Home className="text-black mb-6 hover:text-blue-500" />
        </Link>

        <button onClick={() => toggleDrawer('search')}>
          <Search className="text-black mb-6 hover:text-blue-500" />
        </button>

        <button onClick={() => toggleDrawer('location')}>
          <MapPin className="text-black hover:text-blue-500" />
        </button>
      </div>

      <SearchDrawer
        isOpen={activeDrawer === 'search'}
        onClose={() => setActiveDrawer(null)}
      />

      <LocationDrawer
        isOpen={activeDrawer === 'location'}
        onClose={() => setActiveDrawer(null)}
      />
    </>
  );
}
