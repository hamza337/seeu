import { Home, Search, MapPin, X, SquareActivity,PawPrint, Camera,Bike, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function Sidebar() {
  const [isSearchDrawerOpen, setSearchDrawerOpen] = useState(false);
  const [isLocationDrawerOpen, setLocationDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState('Category');

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).filter(file =>
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    setUploads(files);
  };

  const removeUpload = (index) => {
    const newUploads = [...uploads];
    newUploads.splice(index, 1);
    setUploads(newUploads);
  };

  return (
    <>
      {/* Fixed Sidebar */}
      <div className="h-full w-14 bg-white flex flex-col items-center py-4 shadow-md fixed left-0 top-0 z-50">
        <Link to="/">
          <Home className="text-black mb-6 hover:text-blue-500" />
        </Link>

        <button onClick={() => setSearchDrawerOpen(true)}>
          <Search className="text-black mb-6 hover:text-blue-500" />
        </button>

        <button onClick={() => setLocationDrawerOpen(true)}>
          <MapPin className="text-black hover:text-blue-500" />
        </button>
      </div>

      {/* Search Drawer */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-lg z-60 transition-transform duration-300 ease-in-out ${
          isSearchDrawerOpen ? 'translate-x-14' : '-translate-x-full'
        } w-64`}
      >
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-semibold">Search</h2>
          <X onClick={() => setSearchDrawerOpen(false)} className="text-gray-600 hover:text-black cursor-pointer" />
        </div>
        <div className="p-4 space-y-3">
          <label className='text-black'>Where</label>
          <input type="text" className="w-full p-2 border rounded text-black" />
          <label className='text-black'>When</label>
          <input type="text" className="w-full p-2 border rounded text-black" />
          <label className='text-black'>What</label>
          <div className="w-full md:w-full">
            <div className="relative">
              {/* Dropdown trigger button */}
              <button
                onClick={handleDropdownToggle}
                className="w-full p-3 pl-4 pr-4 border border-black rounded-lg flex justify-between items-center text-black"
              >
                <span className="text-black">{selectedEventType || 'Select an Event Type'}</span>
                <span className="text-black">{isDropdownOpen ? '▲' : '▼'}</span>
              </button>

              {/* Dropdown options with smooth animation */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isDropdownOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
                } absolute top-full left-0 w-full bg-white border border-black rounded-lg shadow-md mt-1 z-50`}
              >
                {[
                  { label: 'Accident', icon: <SquareActivity size={16} /> },
                  { label: 'Theft', icon: <PawPrint size={16} /> },
                  { label: 'Animal', icon: <Bike size={16} /> },
                  { label: 'Crime', icon: <Camera size={16} /> },
                  { label: 'Other', icon: <MapPin size={16} color="black" /> },
                ].map((item) => (
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
          </div>
          <button className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Search</button>
        </div>
      </div>

      {/* Location Drawer */}
      <div
        className={`fixed top-0 left-0 h-full bg-white shadow-lg z-70 transition-transform duration-300 ease-in-out ${
          isLocationDrawerOpen ? 'translate-x-14' : '-translate-x-full'
        } w-1/2`}
      >
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-semibold">Post Incident</h2>
          <X onClick={() => setLocationDrawerOpen(false)} className="text-gray-600 hover:text-black cursor-pointer" />
        </div>

        <div className="p-4 space-y-2 overflow-y-auto">
          <div className="space-x-2">
            <img
              src="/Poing-Logo-02.png"
              alt="Poing Logo"
              className="h-24 w-24 object-contain"
            />
          </div>

          {/* Dropzone */}
          <label className="block w-full p-4 border-2 border-dashed border-gray-300 rounded text-center cursor-pointer">
            <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileChange} />
            Drag or upload item here
          </label>

          {/* Previews */}
          <div className="flex flex-wrap gap-2">
            {uploads.map((file, index) => (
              <div key={index} className="relative w-24 h-24 border rounded overflow-hidden">
                {file.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(file)} alt="upload" className="object-cover w-full h-full" />
                ) : (
                  <video src={URL.createObjectURL(file)} className="object-cover w-full h-full" />
                )}
                <button
                  onClick={() => removeUpload(index)}
                  className="absolute top-1 right-1 bg-white rounded-full p-1 text-xs font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Where & When */}
          <div className="flex gap-2">
            <input type="text" placeholder="Where" className=" p-2 border rounded text-black" />
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              className="w-full p-2 border rounded text-black"
              placeholderText="When"
            />
          </div>

          {/* Category */}
          <div className="w-full md:w-1/2">
            <div className="relative">
              {/* Dropdown trigger button */}
              <button
                onClick={handleDropdownToggle}
                className="w-full p-3 pl-4 pr-4 border border-black rounded-lg flex justify-between items-center text-black"
              >
                <span className="text-black">{selectedEventType || 'Select an Event Type'}</span>
                <span className="text-black">{isDropdownOpen ? '▲' : '▼'}</span>
              </button>

              {/* Dropdown options with smooth animation */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isDropdownOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
                } absolute top-full left-0 w-full bg-white border border-black rounded-lg shadow-md mt-1 z-50`}
              >
                {[
                  { label: 'Accident', icon: <SquareActivity size={16} /> },
                  { label: 'Theft', icon: <PawPrint size={16} /> },
                  { label: 'Animal', icon: <Bike size={16} /> },
                  { label: 'Crime', icon: <Camera size={16} /> },
                  { label: 'Other', icon: <MapPin size={16} color="black" /> },
                ].map((item) => (
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
          </div>

          {/* Description */}
          <textarea placeholder="Description" className="w-full p-2 border rounded text-black" rows={4} />

          {/* Price */}
          <div className="relative">
            <span className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400">
              <DollarSign size={16} />
            </span>
            <input type="number" placeholder="Price" className="pl-10 w-full p-2 border rounded text-black" />
          </div>

          {/* Checkboxes */}
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            <span className='text-black'>Make it Free</span>
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" />
            <span className='text-black'>Make it Exclusive</span>
          </label>

          {/* Submit */}
          <button className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">Post It</button>
        </div>
      </div>
    </>
  );
}
