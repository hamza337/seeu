import React from 'react'
import BackButton from '../backBtn/backButton'
import { Search, Calendar, Clock, MapPin, Edit, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

const SearchResults = () => {
  const mediaData = [
      {
        id: 1,
        photoUrl: 'https://picsum.photos/300/200?random=1', // Reliable placeholder image
        date: 'December 23, 2024',
        time: '10:35pm',
        location: 'Ahmedabad, India',
				price: '40',
        title: '10 Dead As Car Rams Truck On Ahmedabad - Vadodara Expressway',
        description: 'A tragic incident on the Ahmedabad-Vadodara Expressway led to the death of 10 people when a speeding car crashed into a truck...',
      },
      {
        id: 2,
        photoUrl: 'https://picsum.photos/300/200?random=4', // Reliable placeholder image
        date: 'December 23, 2024',
        time: '10:35pm',
        location: 'Ahmedabad, India',
				price: '40',
        title: '10 Dead As Car Rams Truck On Ahmedabad - Vadodara Expressway',
        description: 'A tragic incident on the Ahmedabad-Vadodara Expressway led to the death of 10 people when a speeding car crashed into a truck...',
      },
      {
        id: 3,
        photoUrl: 'https://picsum.photos/300/200?random=3', // Reliable placeholder image
        date: 'December 23, 2024',
        time: '10:35pm',
        location: 'Ahmedabad, India',
				price: '40',
        title: '10 Dead As Car Rams Truck On Ahmedabad - Vadodara Expressway',
        description: 'A tragic incident on the Ahmedabad-Vadodara Expressway led to the death of 10 people when a speeding car crashed into a truck...',
      },
      {
        id: 4,
        photoUrl: 'https://picsum.photos/300/200?random=2', // Reliable placeholder image
        date: 'December 23, 2024',
        time: '10:35pm',
        location: 'Ahmedabad, India',
				price: '40',
        title: '10 Dead As Car Rams Truck On Ahmedabad - Vadodara Expressway',
        description: 'A tragic incident on the Ahmedabad-Vadodara Expressway led to the death of 10 people when a speeding car crashed into a truck...',
      },
  ]

  return (
    <div className="px-6 sm:px-5 lg:px-10 py-6 flex flex-col gap-6">
      <BackButton />
      <div className="flex items-center border border-black rounded-lg p-4 gap-2">
        <Search size={20} className="text-black" />
        <input
          type="text"
          placeholder="Search here..."
          className="w-full text-sm text-gray-500 placeholder-gray-400 focus:outline-none"
        />
      </div>
      <div className="flex justify-between items-center w-full mt-6">
        <span className="text-lg font-bold text-black">Search Results</span>
        <span className="text-sm font-semibold text-black">02 Videos</span>
      </div>

			<div className="flex flex-col gap-4 mt-6">
        {mediaData.map((item) => (
          <Link to={`/media/${item.id}`} key={item.id} className="bg-white p-4 rounded-lg shadow-lg flex gap-4 relative">
            {/* Image */}
            <img src={item.photoUrl} alt="Media" className="w-1/4 h-36 object-cover rounded-md" />

            {/* Details Column */}
            <div className="flex flex-col justify-between w-2/3 pl-4 py-4">
              {/* Info Icons */}
              <div className="flex flex-col justify-between h-full">
                <div className="flex items-center gap-2 text-black">
                  <Calendar size={16} />
                  <span>{item.date}</span>
                </div>
                <div className="flex items-center gap-2 text-black">
                  <Clock size={16} />
                  <span>{item.time}</span>
                </div>
                <div className="flex items-center gap-2 text-black">
                  <MapPin size={16} />
                  <span>{item.location}</span>
                </div>
								<div className="flex items-center gap-2 text-black">
                  <DollarSign color={'green'} size={16} />
                  <span>{item.price}</span>
                </div>
              </div>
            </div>

            {/* Edit Button & Green Text - Positioned at Top Right */}
            <div className="absolute top-8 right-4 flex flex-col items-end space-y-2">
							<Link to={`/media/${item.id}/buy-now`}
               className="text-green-500 border border-green-500 p-2 rounded-md text-sm">
                Buy Event
              
							</Link>
            </div>
          </Link>
        ))}
      </div>

    </div>
  )
}

export default SearchResults