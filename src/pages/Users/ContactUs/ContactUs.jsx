import { Mail, MapPin, Phone, User } from 'lucide-react';
import BackButton from '../../../components/backBtn/backButton';

const ContactUs = () => {
  return (
    <div className="px-6 sm:px-10 lg:px-20 py-6 flex flex-col gap-4">
      {/* Back Button with Heading */}
      <BackButton heading="Contact Us" />

      {/* Contact Info Section */}
      <div className="flex flex-col gap-4 text-black">
        <div className="flex items-center gap-3">
          <MapPin className="text-black" size={20} />
          <p className="text-sm">32, Avenue ve Newyork 321994 Newyork</p>
        </div>
        <div className="flex items-center gap-3">
          <Mail className="text-black" size={20} />
          <p className="text-sm">support@poingit.com</p>
        </div>
      </div>

      {/* Get in Touch Heading */}
      <h2 className="text-lg font-bold mt-4 text-black">Get in touch with us</h2>

      {/* Contact Form */}
      <form className="flex flex-col gap-4 mt-4">

        {/* Name Field */}
        <div className="relative">
        <input
            type="text"
            placeholder="Your Name"
            className="w-full p-4 pr-12 border border-gray-300 rounded-lg placeholder-gray-400 text-black focus:outline-none focus:border-black"
        />
          <User size={20} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black" />
        </div>

        {/* Email Field */}
        <div className="relative">
        <input
            type="email"
            placeholder="Enter your email"
            className="w-full p-4 pr-12 border border-gray-300 rounded-lg placeholder-gray-400 text-black focus:outline-none focus:border-black"
        />
          <Mail size={20} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black" />
        </div>

        {/* Message Field */}
        <textarea
            rows={5}
            placeholder="Type your message here"
            className="w-full p-4 border border-gray-300 rounded-lg placeholder-gray-400 text-black focus:outline-none focus:border-black resize-none"
        />

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-black text-white rounded-lg w-full py-3 text-center text-base font-semibold mt-2"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default ContactUs;
