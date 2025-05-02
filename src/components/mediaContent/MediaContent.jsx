import { useState } from 'react';
import { Calendar, Clock, MapPin, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';

const MediaContent = () => {
  const [activeTab, setActiveTab] = useState('uploads'); // default to uploads

  const mediaData = {
    uploads: [
      {
        id: 1,
        photoUrl: 'https://picsum.photos/300/200?random=1', // Reliable placeholder image
        date: 'December 23, 2024',
        time: '10:35pm',
        location: 'Ahmedabad, India',
        title: '10 Dead As Car Rams Truck On Ahmedabad - Vadodara Expressway',
        description: 'A tragic incident on the Ahmedabad-Vadodara Expressway led to the death of 10 people when a speeding car crashed into a truck...',
      },
      {
        id: 2,
        photoUrl: 'https://picsum.photos/300/200?random=4', // Reliable placeholder image
        date: 'December 23, 2024',
        time: '10:35pm',
        location: 'Ahmedabad, India',
        title: '10 Dead As Car Rams Truck On Ahmedabad - Vadodara Expressway',
        description: 'A tragic incident on the Ahmedabad-Vadodara Expressway led to the death of 10 people when a speeding car crashed into a truck...',
      },
      {
        id: 3,
        photoUrl: 'https://picsum.photos/300/200?random=3', // Reliable placeholder image
        date: 'December 23, 2024',
        time: '10:35pm',
        location: 'Ahmedabad, India',
        title: '10 Dead As Car Rams Truck On Ahmedabad - Vadodara Expressway',
        description: 'A tragic incident on the Ahmedabad-Vadodara Expressway led to the death of 10 people when a speeding car crashed into a truck...',
      },
      {
        id: 4,
        photoUrl: 'https://picsum.photos/300/200?random=2', // Reliable placeholder image
        date: 'December 23, 2024',
        time: '10:35pm',
        location: 'Ahmedabad, India',
        title: '10 Dead As Car Rams Truck On Ahmedabad - Vadodara Expressway',
        description: 'A tragic incident on the Ahmedabad-Vadodara Expressway led to the death of 10 people when a speeding car crashed into a truck...',
      },
      // More items...
    ],
    downloads: [
      {
        id: 1,
        photoUrl: 'https://picsum.photos/300/200?random=6',
        date: 'December 23, 2024',
        time: '10:35pm',
        location: 'Ahmedabad, India',
        title: '10 Dead As Car Rams Truck On Ahmedabad - Vadodara Expressway',
        description: 'A tragic incident on the Ahmedabad-Vadodara Expressway led to the death of 10 people when a speeding car crashed into a truck...',
      },
      {
        id: 2,
        photoUrl: 'https://picsum.photos/300/200?random=5',
        date: 'December 23, 2024',
        time: '10:35pm',
        location: 'Ahmedabad, India',
        title: '10 Dead As Car Rams Truck On Ahmedabad - Vadodara Expressway',
        description: 'A tragic incident on the Ahmedabad-Vadodara Expressway led to the death of 10 people when a speeding car crashed into a truck...',
      },
      // More items...
    ],
  };

  return (
    <div className="w-full px-6 sm:px-10 lg:px-20 py-10 flex flex-col gap-6">
      {/* Heading */}
      <h2 className="text-2xl font-bold text-black">Media</h2>

      {/* Tabs */}
      <div className="flex w-full gap-0 mt-4 rounded-lg overflow-hidden">
        <button
          className={`${
            activeTab === 'uploads' ? 'bg-black text-white' : 'bg-white text-black'
          } w-full py-2 transition duration-200 focus:outline-none rounded-l-lg`}
          onClick={() => setActiveTab('uploads')}
        >
          Uploads
        </button>
        <button
          className={`${
            activeTab === 'downloads' ? 'bg-black text-white' : 'bg-white text-black'
          } w-full py-2 transition duration-200 focus:outline-none rounded-r-lg`}
          onClick={() => setActiveTab('downloads')}
        >
          Downloads
        </button>
      </div>

      {/* Media Cards */}
      <div className="flex flex-col gap-4 mt-6 w-full">
        {(activeTab === 'uploads' ? mediaData.uploads : mediaData.downloads).map((item) => (
          <Link to={`/media/${item.id}`} key={item.id} className="bg-white p-4 rounded-lg shadow-lg flex gap-4 relative w-full">
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
              </div>
            </div>

            {/* Edit Button & Green Text - Positioned at Top Right */}
            <div className="absolute top-8 right-4 flex flex-col items-end space-y-2">
              <button className="text-gray-600 hover:text-black">
                <Edit size={20} />
              </button>
              <span className="text-green-500 text-sm">
                Contact Info after Payment
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MediaContent;
