import { MapPin, Calendar, Search} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const HomeContent = () => {
  const [dateRange, setDateRange] = useState('Select dates');

  return (
    <div className="px-6 sm:px-10 lg:px-20 py-10 flex flex-col items-center gap-4">
      {/* Logo */}
      <img
          src="/Poing.svg" // Change to /poing.svg if it's an SVG
          alt="Poing Logo"
          className="h-24 w-24 object-contain"
        />

      {/* Paragraph */}
      <p className="text-black font-semibold max-w-4xl mt-4">
        Find posts of Events caught on camera, items found and reconnect with people based on location and time.
      </p>

      {/* Inputs: Where + When */}
      <div className="flex flex-col md:flex-row w-full max-w-4xl gap-4 mt-4">
        {/* Where Field */}
        <div className="flex-1">
          <div className="flex items-center border border-black rounded-lg p-4 gap-2">
            <MapPin size={20} className="text-black" />
            <div className="flex flex-col w-full">
              <span className="text-sm text-black font-semibold">Where</span>
              <input
                type="text"
                placeholder="Enter city, state or zip code"
                className="w-full text-sm text-gray-500 placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* When Field */}
        <div className="flex-1">
          <button
            onClick={() => alert('Show date picker here!')}
            className="flex items-center border border-black rounded-lg p-4 gap-2 w-full text-left"
          >
            <Calendar size={20} className="text-black" />
            <div className="flex flex-col">
              <span className="text-sm text-black font-semibold">When</span>
              <span className="text-sm text-gray-500">{dateRange}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="w-full max-w-4xl h-64 bg-gray-300 rounded-lg mt-8">
        <div className="w-full h-full flex items-center justify-center text-gray-700 font-semibold">
          Map Placeholder
        </div>
      </div>

      <div className="flex flex-col md:flex-row w-full max-w-4xl justify-between mt-4 gap-4">
				{/* What Field (half width) */}
				<div className="w-full md:w-1/2">
					<div className="flex items-center border border-black rounded-lg p-4 gap-2">
						<Search size={20} className="text-black" />
						<div className="flex flex-col w-full">
							<span className="text-sm text-black font-semibold">What</span>
							<input
								type="text"
								placeholder="What are you looking for?"
								className="w-full text-sm text-gray-500 placeholder-gray-400 focus:outline-none"
							/>
						</div>
					</div>
				</div>

				{/* Search Radius Text */}
				<div className="text-black font-semibold text-sm">
					Search Radius
				</div>
			</div>


      {/* Search Button */}
      <div className="w-full max-w-4xl mt-6">
        <Link to='/results'>
          <button className="w-full bg-black text-white py-4 rounded-lg text-lg font-semibold">
            Search
          </button>
        </Link>
      </div>

      {/* Paragraph under Search */}
      <p className="text-black font-semibold max-w-4xl mt-4">
        Share videos and photos of events, items found and reconnect with people based on location and time.
      </p>

      {/* Share Button */}
      <div className="w-full max-w-4xl mt-4">
        <Link to='/share'>
        <button className="w-full bg-white text-black border-2 py-4 rounded-lg text-lg font-semibold">
          Share
        </button>
        </Link>
      </div>
    </div>
  );
};

export default HomeContent;
