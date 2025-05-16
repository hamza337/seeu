import { X, SquareActivity, PawPrint, Bike, Camera, MapPin } from 'lucide-react';
import { useState } from 'react';

export default function SearchDrawer({ isOpen, onClose, selectedEventType, setSelectedEventType }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleDropdownToggle = () => setIsDropdownOpen(!isDropdownOpen);

  return (
    <div
      className={`fixed top-0 left-0 h-full bg-white shadow-lg z-60 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-14' : '-translate-x-full'
      } w-64`}
    >
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="text-lg text-black font-semibold">Search</h2>
        <X onClick={onClose} className="text-gray-600 hover:text-black cursor-pointer" />
      </div>
      <div className="p-4 space-y-12">
        <input type="text" placeholder='Where' className="w-full p-2 rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 border-gray-500" />
        <input type="text" placeholder='When' className="w-full p-2 rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 border-gray-500" />
        {/* <label className='text-black'>What</label> */}
        <div className="relative">
          <button
            onClick={handleDropdownToggle}
            className="w-full p-3 rounded-xl bg-gray-200 text-gray-800 border-dotted border-1 border-gray-500 flex justify-between items-center"
          >
            <span className='text-gray-800'>{selectedEventType || 'Select an Event Type'}</span>
            <span>{isDropdownOpen ? '▲' : '▼'}</span>
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isDropdownOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
            } absolute top-full left-0 w-full bg-white border border-black rounded-lg shadow-md mt-1 z-50`}
          >
            {[{ label: 'Accident', icon: <SquareActivity size={16} /> },
              { label: 'Theft', icon: <PawPrint size={16} /> },
              { label: 'Animal', icon: <Bike size={16} /> },
              { label: 'Crime', icon: <Camera size={16} /> },
              { label: 'Other', icon: <MapPin size={16} color="black" /> }].map((item) => (
              <div
                key={item.label}
                onClick={() => {
                  setSelectedEventType(item.label);
                  setIsDropdownOpen(false);
                }}
                className="py-1 px-3 text-black hover:bg-gray-100 cursor-pointer flex justify-between items-center"
              >
                <span>{item.label}</span>
                <span>{item.icon}</span>
              </div>
            ))}
          </div>
        </div>
        <button className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Search</button>
      </div>
    </div>
  );
}
