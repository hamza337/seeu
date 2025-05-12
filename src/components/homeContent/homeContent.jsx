// import { Calendar, MapPin, PawPrint, Camera, SquareActivity, Bike, Info } from 'lucide-react';
// import { useState } from 'react';
// import { Link } from 'react-router-dom';
// import { DateRange } from 'react-date-range';
// import { format } from 'date-fns';
// import 'react-date-range/dist/styles.css';
// import 'react-date-range/dist/theme/default.css';


// const HomeContent = () => {
//   const [dateRange, setDateRange] = useState({
//     startDate: new Date(),
//     endDate: new Date(),
//     key: 'selection',
//   });
//   const [showCalendar, setShowCalendar] = useState(false);
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const [selectedEventType, setSelectedEventType] = useState('What are you looking for?');

//   const handleDropdownToggle = () => {
//     setIsDropdownOpen(!isDropdownOpen);
//   };
  

//   return (
//     <div className="w-full h-full px-6 sm:px-10 lg:px-20 flex flex-col gap-2 items-center">
//       {/* Logo */}
//       <img
//           src="/Poing-Logo-02.png"
//           alt="Poing Logo"
//           className="h-18 w-18 object-contain"
//         />

//       {/* Paragraph */}
//       <p className="text-black font-semibold w-full">
//         Find posts of Events caught on camera, items found and reconnect with people based on location and time.
//       </p>

//       {/* Inputs: Where + When */}
//       <div className="flex flex-col md:flex-row w-full gap-4">
//         {/* Where Field */}
//         <div className="flex-1">
//           <div className="flex items-center border border-black rounded-lg p-2 gap-2">
//             <MapPin size={20} className="text-black" />
//             <div className="flex flex-col w-full">
//               <span className="text-sm text-black font-semibold">Where</span>
//               <input
//                 type="text"
//                 placeholder="Enter city, state or zip code"
//                 className="w-full text-sm text-gray-500 placeholder-gray-400 focus:outline-none"
//               />
//             </div>
//           </div>
//         </div>
//         {/* When Field */}
//         <div className="flex-1 relative">
//           <button
//             onClick={() => setShowCalendar(!showCalendar)}
//             className="flex items-center border border-black rounded-lg p-2 gap-2 w-full text-left"
//           >
//             <Calendar size={20} className="text-black" />
//             <div className="flex flex-col">
//               <span className="text-sm text-black font-semibold">When</span>
//               <span className="text-sm text-gray-500">
//                 {dateRange.startDate && dateRange.endDate
//                   ? `${format(dateRange.startDate, 'MMM d, yyyy')} - ${format(dateRange.endDate, 'MMM d, yyyy')}`
//                   : 'Select dates'}
//               </span>
//             </div>
//           </button>

//           {/* Calendar Dropdown */}
//           {showCalendar && (
//             <div className="absolute z-50 mt-2 bg-white shadow-lg border border-gray-200 rounded-lg">
//               <DateRange
//                 editableDateInputs={true}
//                 onChange={(item) => setDateRange(item.selection)}
//                 moveRangeOnFirstSelection={false}
//                 ranges={[dateRange]}
//                 className="text-black"
//               />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Map */}
//       <div className="w-full h-64 bg-gray-300 rounded-lg">
//         <div className="w-full h-full flex items-center justify-center text-gray-700 font-semibold">
//           Map Placeholder
//         </div>
//       </div>

//       <div className="flex flex-col md:flex-row w-full justify-between gap-4">
// 				{/* What Field (half width) */}
//         <div className="w-full md:w-1/2">
// 				<div className="relative">
// 					{/* Dropdown trigger button */}
// 					<button
// 						onClick={handleDropdownToggle}
// 						className="w-full p-3 pl-4 pr-4 border border-black rounded-lg flex justify-between items-center text-black"
// 					>
// 						<span className="text-black">{selectedEventType || 'Select an Event Type'}</span>
// 						<span className="text-black">{isDropdownOpen ? '▲' : '▼'}</span>
// 					</button>

// 					{/* Dropdown options with smooth animation */}
// 					<div
// 						className={`overflow-hidden transition-all duration-300 ease-in-out ${
// 							isDropdownOpen ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
// 						} absolute top-full left-0 w-full bg-white border border-black rounded-lg shadow-md mt-1 z-50`}
// 					>
// 						{[
// 							{ label: 'Accident', icon: <SquareActivity size={16} /> },
// 							{ label: 'Theft', icon: <PawPrint size={16} /> },
// 							{ label: 'Animal', icon: <Bike size={16} /> },
// 							{ label: 'Crime', icon: <Camera size={16} /> },
// 							{ label: 'Other', icon: <MapPin size={16} color="black" /> },
// 						].map((item) => (
// 							<div
// 								key={item.label}
// 								onClick={() => {
// 									setSelectedEventType(item.label);
// 									setIsDropdownOpen(false);
// 								}}
// 								className="py-1 px-3 text-black hover:bg-gray-100 cursor-pointer flex justify-between items-center"
// 							>
// 								<span>{item.label}</span>
// 								<span>{item.icon}</span>
// 							</div>
// 						))}
// 					</div>
// 				</div>
// 			</div>

// 				{/* Search Radius Text */}
//         <select
//           className="text-black font-semibold text-sm focus:outline-none"
//           defaultValue=""
//         >
//           <option value="" disabled>
//             Select Radius
//           </option>
//           <option value="1">1 mile</option>
//           <option value="3">3 miles</option>
//           <option value="5">5 miles</option>
//         </select>
// 			</div>


//       {/* Search Button */}
//       <div className="w-full">
//         <Link to='/results'>
//           <button className="w-full bg-black text-white py-2 rounded-lg text-lg font-semibold">
//             Search
//           </button>
//         </Link>
//       </div>

//       {/* Paragraph under Search */}
//       <p className="text-black font-semibold w-full">
//         Share videos and photos of events, items found and reconnect with people based on location and time.
//       </p>

//       {/* Share Button */}
//       <div className="w-full">
//         <Link to='/share'>
//         <button className="w-full bg-white text-black border-2 py-2 rounded-lg text-lg font-semibold hover:bg-black hover:text-white transition-colors duration-200">
//           Share
//         </button>
//         </Link>
//       </div>
//     </div>
//   );
// };

// export default HomeContent;


import { MapPin, AlertCircle, Camera, Car, PawPrint } from 'lucide-react';  
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const HomeContent = () => {
  const badges = [
    { icon: <MapPin color='red' />, name: 'Location' },
    { icon: <AlertCircle />, name: 'Alert' },
    { icon: <Camera />, name: 'Camera' },
    { icon: <Car />, name: 'Vehicle' },
    { icon: <PawPrint />, name: 'Animal' },
  ];

  return (
    <div className="w-full h-full px-6 sm:px-10 lg:px-20 flex flex-col gap-2 items-center">
      {/* Logo */}
      <img
          src="/Poing-Logo-02.png"
          alt="Poing Logo"
          className="h-30 w-30 object-contain"
        />

    <div className="flex w-full h-100 p-1 gap-6 bg-gray-100">
      {/* Map container */}
      <div className="flex-1 rounded-lg overflow-hidden bg-blue-200">
        {/* Replace with real map component */}
        <div className="w-full h-full flex items-center justify-center text-2xl text-blue-700 font-bold">
          Map Placeholder
        </div>
      </div>

      {/* Badge column */}
      <div className="w-24 flex flex-col justify-center items-center gap-6 bg-white p-4 rounded-lg shadow-md">
        {badges.map((badge, idx) => (
          <div key={idx} className="flex flex-col items-center text-sm text-gray-700">
            {badge.icon}
            <span className="mt-1 text-center">{badge.name}</span>
          </div>
        ))}
      </div>
    </div>
    </div>
    
  );
};

export default HomeContent;
