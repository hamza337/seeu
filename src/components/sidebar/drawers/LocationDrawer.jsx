import { useEffect, useState, useRef } from 'react';
import { X, SquareActivity, PawPrint, Camera, Bike, MapPin, DollarSign } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';

export default function LocationDrawer({ isOpen, onClose, onSwitchDrawer }) {
  const [uploads, setUploads] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEventType, setSelectedEventType] = useState('Category');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [isExclusive, setIsExclusive] = useState(false);
  const [address, setAddress] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const drawerRef = useRef(null);

  const baseUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    function handleClickOutside(event) {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleDropdownToggle = () => setIsDropdownOpen(!isDropdownOpen);

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

  const handleSubmit = async () => {
    if (!uploads.length || !selectedEventType || !address || !selectedDate) return;
    const file = uploads[0];

    try {
      const mediaUrlRes = await axios.post(`${baseUrl}events/media-url`, {
        fileName: file.name.replace(/\.[^/.]+$/, ''),
        fileType: file.type.split('/')[1],
      });

      const { url, imageUrl, type } = mediaUrlRes.data;
      debugger
      await axios.put(url, file, {
        headers: {
          'Content-Type': file.type,
        },
      });

      const createEventRes = await axios.post(`${baseUrl}events/create-event`, {
        title: `${selectedEventType} Incident`,
        description,
        category: selectedEventType,
        address,
        mediaUrl: imageUrl,
        mediaType: type,
        isExclusive,
        isFree,
        price: Number(price),
        date: selectedDate.toISOString(),
      });

      if (createEventRes.status === 201 || createEventRes.status === 200) {
        alert('Event uploaded successfully!');
        onClose();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload event');
    }
  };

  return (
    <div
      ref={drawerRef}
      className={`fixed top-0 left-0 h-full bg-white shadow-lg z-70 transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-14' : '-translate-x-full'
      } w-1/2`}
    >
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="text-lg font-semibold">Post Incident</h2>
        <X onClick={onClose} className="text-gray-600 hover:text-black cursor-pointer" />
      </div>

      <div className="p-4 space-y-2 overflow-y-auto">
        <img src="/Poing-Logo-02.png" alt="Poing Logo" className="h-24 w-24 object-contain" />

        <label className="block w-full p-4 border-2 border-dashed border-gray-300 rounded text-center cursor-pointer">
          <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileChange} />
          Drag or upload item here
        </label>

        <div className="flex flex-wrap gap-2">
          {uploads.map((file, index) => (
            <div key={index} className="relative w-24 h-24 border rounded overflow-hidden">
              {file.type.startsWith('image/') ? (
                <img src={URL.createObjectURL(file)} alt="upload" className="object-cover w-full h-full" />
              ) : (
                <video src={URL.createObjectURL(file)} className="object-cover w-full h-full" />
              )}
              <button onClick={() => removeUpload(index)} className="absolute top-1 right-1 bg-white rounded-full p-1 text-xs font-bold">
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Where"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="p-2 border rounded text-black"
          />
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            className="w-full p-2 border rounded text-black"
            placeholderText="When"
          />
        </div>

        <div className="relative">
          <button
            onClick={handleDropdownToggle}
            className="w-full p-3 pl-4 pr-4 border border-black rounded-lg flex justify-between items-center text-black"
          >
            <span className="text-black">{selectedEventType || 'Select an Event Type'}</span>
            <span className="text-black">{isDropdownOpen ? '▲' : '▼'}</span>
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

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded text-black"
          rows={4}
        />

        <div className="relative">
          <span className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400">
            <DollarSign size={16} />
          </span>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price"
            className="pl-10 w-full p-2 border rounded text-black"
          />
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isFree} onChange={() => setIsFree(!isFree)} />
          <span className='text-black'>Make it Free</span>
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isExclusive} onChange={() => setIsExclusive(!isExclusive)} />
          <span className='text-black'>Make it Exclusive</span>
        </label>

        <button onClick={handleSubmit} className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">
          Post It
        </button>
      </div>
    </div>
  );
}
