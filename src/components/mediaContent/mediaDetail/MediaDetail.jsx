import { useParams } from 'react-router-dom';
import { Calendar, Clock, MapPin, MessageSquare, Download } from 'lucide-react';
import BackButton from '../../../components/backBtn/backButton'; // Assuming you have a back button component.

const MediaDetail = () => {
  const { id } = useParams();

  const mediaData = {
    uploads: [
      {
        id: 1,
        photoUrl: 'https://picsum.photos/300/200?random=1',
        date: 'December 23, 2024',
        time: '10:35pm',
        location: 'Ahmedabad, India',
        title: '10 Dead As Car Rams Truck On Ahmedabad - Vadodara Expressway',
        description: 'A tragic incident on the Ahmedabad-Vadodara Expressway led to the death of 10 people when a speeding car crashed into a truck. A tragic incident on the Ahmedabad-Vadodara Expressway led to the death of 10 people when a speeding car crashed into a truck. A tragic incident on the Ahmedabad-Vadodara Expressway led to the death of 10 people when a speeding car crashed into a truck. A tragic incident on the Ahmedabad-Vadodara Expressway led to the death of 10 people when a speeding car crashed into a truck. A tragic incident on the Ahmedabad-Vadodara Expressway led to the death of 10 people when a speeding car crashed into a truck.',
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
      // More items...
    ],
  };

  // Find the selected media based on the id
  const selectedMedia = [...mediaData.uploads, ...mediaData.downloads].find(item => item.id === parseInt(id));

  return (
    <div className="px-6 sm:px-10 lg:px-20 py-6 flex flex-col gap-6">
      {/* Back Button */}
      <BackButton heading="Event Details" />

      {/* Media Details */}
      <div className="w-full">
        <img
          src={selectedMedia?.photoUrl}
          alt="Cover Image"
          className="w-full h-85 object-cover rounded-lg"
        />

        {/* Title */}
        <h2 className="text-3xl font-bold mt-4 text-black">{selectedMedia?.title}</h2>

        {/* Info Row */}
        <div className="flex gap-8 mt-4 text-black">
          {/* Left Column (Date, Time) */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>{selectedMedia?.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>{selectedMedia?.time}</span>
            </div>
          </div>

          {/* Right Column (Location, Download) */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <MapPin size={16} />
              <span>{selectedMedia?.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Download size={16} color='green' />
              <span className="text-green-600">Download</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="mt-6 text-black">{selectedMedia?.description}</p>

        {/* Contact Info */}
        <div className="flex justify-center items-center gap-2 mt-6">
          <MessageSquare size={20} className="text-black" />
          <span className="text-black font-semibold">Contact Information after Payment</span>
        </div>

        {/* Pay Now Button */}
        <button className="bg-green-500 text-white rounded-lg py-3 mt-6 w-full">
          Pay Now
        </button>
      </div>
    </div>
  );
};

export default MediaDetail;
