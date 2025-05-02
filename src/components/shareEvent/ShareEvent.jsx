import { useState } from 'react';
import { Calendar, MapPin, PawPrint, Camera, SquareActivity, Bike, Info } from 'lucide-react';
import { UploadCloud, X } from 'lucide-react';
import BackButton from '../backBtn/backButton';
import { DateRange } from 'react-date-range';
import { format } from 'date-fns';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const ShareEvent = () => {
  const [isContactInfoChecked, setIsContactInfoChecked] = useState(false);
  const [isExclusiveChecked, setIsExclusiveChecked] = useState(false);
  const [priceRange, setPriceRange] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Added state for dropdown visibility
  const [selectedEventType, setSelectedEventType] = useState('Accident'); // Default selection for event type

  // Handle dropdown toggle
  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Handle selection of event type
  const handleEventTypeChange = (event) => {
    setSelectedEventType(event.target.value);
    setIsDropdownOpen(false); // Close the dropdown after selecting
  };

  const [videoFile, setVideoFile] = useState(null);

	const handleVideoUpload = (e) => {
		const file = e.target.files[0];
		if (file && file.type.startsWith('video/')) {
			setVideoFile(file);
		}
	};

	const removeVideo = () => {
		setVideoFile(null);
	};

	const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection',
  });
  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <div className="px-6 sm:px-10 lg:px-20 py-6 flex flex-col gap-6">
      {/* Back Button & Heading */}
      <div className="flex items-center gap-2">
        <BackButton /> {/* Removed heading prop */}
        <h2 className="text-3xl font-bold text-black">
          <span className="text-red-500">$</span>hare an Event
        </h2>

        {/* Badges */}
        <div className="flex gap-2 ml-auto">
          <div className="w-12 h-12 bg-[rgba(104,181,208,1)] flex items-center justify-center rounded-full">
            <PawPrint />
          </div>
          <div className="w-12 h-12 bg-[rgba(222,92,87,1)] flex items-center justify-center rounded-full">
            <SquareActivity />
          </div>
          <div className="w-12 h-12 bg-[rgba(225,178,162,1)] flex items-center justify-center rounded-full">
            <Camera />
          </div>
          <div className="w-12 h-12 bg-[rgba(230,217,167,1)] flex items-center justify-center rounded-full">
            <Bike />
          </div>
        </div>
      </div>

      {/* Input Fields */}
      <div className="flex flex-col md:flex-row gap-4 mt-2">
        {/* Location Field */}
        <div className="flex-1">
          <div className="flex items-center border border-black rounded-lg p-2 gap-2">
            <MapPin size={20} className="text-black" />
            <div className="flex flex-col w-full">
              <span className="text-sm text-black font-semibold">Location</span>
              <input
                type="text"
                placeholder="Enter city, state or zip code"
                className="w-full text-sm text-gray-500 placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Radius Field */}
				<select
					className="flex-1 text-black font-semibold text-sm border border-black rounded-lg px-3 py-2 focus:outline-none"
					defaultValue=""
				>
					<option value="" disabled>
						Select Radius
					</option>
					<option value="1">1 mile</option>
					<option value="3">3 miles</option>
					<option value="5">5 miles</option>
				</select>

				<div className="flex-1">
					<button
						onClick={() => setShowCalendar(!showCalendar)}
						className="flex items-center border border-black rounded-lg p-2 gap-2 w-full text-left"
					>
						<Calendar size={20} className="text-black" />
						<div className="flex flex-col">
							<span className="text-sm text-black font-semibold">When</span>
							<span className="text-sm text-gray-500">
								{dateRange.startDate && dateRange.endDate
									? `${format(dateRange.startDate, 'MMM d, yyyy')} - ${format(dateRange.endDate, 'MMM d, yyyy')}`
									: 'Select dates'}
							</span>
						</div>
					</button>

					{/* Calendar Dropdown */}
					{showCalendar && (
						<div className="absolute z-50 mt-2 bg-white shadow-lg border border-gray-200 rounded-lg">
							<DateRange
								editableDateInputs={true}
								onChange={(item) => setDateRange(item.selection)}
								moveRangeOnFirstSelection={false}
								ranges={[dateRange]}
								className="text-black"
							/>
						</div>
					)}
				</div>
      </div>

      {/* Event Type Dropdown */}
			<div className="mt-2">
				<label className="text-black font-semibold">Event Type</label>
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
								className="p-3 text-black hover:bg-gray-100 cursor-pointer flex justify-between items-center"
							>
								<span>{item.label}</span>
								<span>{item.icon}</span>
							</div>
						))}
					</div>
				</div>
			</div>

      {/* Share Contact Info */}
			<div className="mt-2 flex items-center gap-2">
				<label className="relative flex items-center cursor-pointer">

					<input
							type="checkbox"
							checked={isContactInfoChecked}
							onChange={() => setIsContactInfoChecked(!isContactInfoChecked)}
							className="appearance-none h-5 w-5 border-2 border-black rounded-sm cursor-pointer checked:bg-black peer"
					/>
					<svg
						className="absolute w-3 h-3 text-white pointer-events-none left-1 top-[5px] hidden peer-checked:block"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="3"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<polyline points="20 6 9 17 4 12" />
					</svg>
				</ label>
				<span className="text-black font-semibold">Share Contact Information</span>
			</div>

    {/* Animated Contact Info Fields */}
    <div
    className={`transition-all duration-500 overflow-hidden ${
        isContactInfoChecked ? 'max-h-52 opacity-100 mt-2' : 'max-h-0 opacity-0'
    }`}
    >
        <div className="shadow-sm p-4 rounded-lg flex flex-col gap-4">
            <input
            type="text"
            placeholder="Enter phone number"
            className="w-full p-3 border border-black rounded-lg placeholder-gray-400 text-black"
            />
            <input
            type="email"
            placeholder="Enter email address"
            className="w-full p-3 border border-black rounded-lg placeholder-gray-400 text-black"
            />
        </div>
    </div>

    {/* Always-visible Info Box */}
    <div className="bg-white p-4 mt-2 flex items-center gap-2 rounded-lg shadow-sm">
        <Info color={'black'} />
        <span className="text-sm text-black">
            Guest feels more comfortable buying stuff with contact information
        </span>
    </div>



      {/* Price Range Slider */}
			<div className="mt-2">
				<label className="text-black font-semibold">Price Range</label>
				<input
					type="range"
					min="0"
					max="1000"
					value={priceRange}
					onChange={(e) => setPriceRange(e.target.value)}
					className="w-full appearance-none h-2 bg-transparent shadow-lg rounded-lg"
					style={{
						background: `linear-gradient(to right, black 0%, black ${priceRange / 10}%, white ${priceRange / 10}%, white 100%)`,
					}}
				/>
				<style>{`
					input[type='range']::-webkit-slider-thumb {
						appearance: none;
						height: 20px;
						width: 20px;
						background: black;
						border-radius: 50%;
						cursor: pointer;
						margin-top: -8px;
					}
					input[type='range']::-moz-range-thumb {
						height: 20px;
						width: 20px;
						background: black;
						border: none;
						border-radius: 50%;
						cursor: pointer;
					}
					input[type='range']::-webkit-slider-runnable-track {
						height: 6px;
						border-radius: 5px;
					}
					input[type='range']::-moz-range-track {
						height: 6px;
						border-radius: 5px;
					}
				`}</style>
			</div>

{/* Recommended Price Text */}
<div className="mt-2 bg-white shadow-sm p-4 rounded-lg text-center">
  <span className="text-sm text-black">Recommended Price: ${priceRange}</span>
</div>

{/* Exclusive Content Checkbox */}
<div className="mt-2 flex items-center gap-2">
  <label className="relative flex items-center cursor-pointer">
    <input
      type="checkbox"
      checked={isExclusiveChecked}
      onChange={() => setIsExclusiveChecked(!isExclusiveChecked)}
      className="appearance-none h-5 w-5 border-2 border-black rounded-sm cursor-pointer checked:bg-black peer"
    />
    {/* Checkmark Icon */}
    <svg
      className="absolute w-3 h-3 text-white pointer-events-none left-1 top-[5px] hidden peer-checked:block"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  </label>
  <span className="text-black font-semibold">Exclusive content</span>
</div>




{/* Upload Event Video Dropzone */}
<div className="mt-2">
  <label className="text-black font-semibold mb-2 block">Upload Event Video</label>
  <div
    className="relative bg-white rounded-lg w-full h-52 flex items-center justify-center cursor-pointer shadow-inner"
    onClick={() => document.getElementById('video-upload').click()}
  >
    {!videoFile ? (
  <div className="flex flex-col items-center justify-center text-black">
    <UploadCloud size={32} className="mb-2" />
    <span className="text-sm font-medium">Upload Video</span>
  </div>
) : (
  <div className="flex flex-col items-center justify-center text-black gap-2">
    <div className="flex items-center gap-2">
      <UploadCloud size={20} />
      <span className="text-sm">{videoFile.name}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeVideo();
        }}
        className="text-red-500 hover:text-red-700"
        aria-label="Remove video"
      >
        <X size={18} />
      </button>
    </div>
  </div>
)}

    <input
      id="video-upload"
      type="file"
      accept="video/*"
      className="hidden"
      onChange={handleVideoUpload}
    />
  </div>
</div>



      {/* Share Button */}
      <div className="w-full mt-2">
        <button className="w-full bg-black text-white py-4 rounded-lg text-lg font-semibold">
          Share Event
        </button>
      </div>
    </div>
  );
};

export default ShareEvent;
