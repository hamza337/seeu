import { Mail, MapPin, Tag } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import BackButton from '../../../components/backBtn/backButton';
import { useMap } from '../../../contexts/MapContext';

const ContactUs = () => {
  const [email, setEmail] = useState('');
  const [emailLocked, setEmailLocked] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const baseUrl = import.meta.env.VITE_API_URL;
  const { setShowLoginModal } = useMap();

  // Prefill email from localStorage user.email and lock input if present
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed?.email) {
          setEmail(parsed.email);
          setEmailLocked(true);
        }
      }
    } catch (e) {
      console.warn('Failed to parse user from localStorage', e);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !subject || !message) {
      toast.error('Please fill in email, subject and message.');
      return;
    }

    const accessToken = localStorage.getItem('token');

    // Block submission if not logged in, prompt login modal
    if (!accessToken) {
      toast.error('Please log in to send a message.');
      setShowLoginModal(true);
      return;
    }

    const payload = {
      to: email,
      subject,
      html: `<p>${message}</p><p>From: ${email || 'Anonymous'}</p>`
    };

    let loadingToastId;
    try {
      setLoading(true);
      loadingToastId = toast.loading('Sending message...');

      const res = await fetch(`${baseUrl}inbox/simple-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to send message');
      }

      toast.success('Message sent successfully');
      setEmail('');
      setSubject('');
      setMessage('');
      setEmailLocked(false);
    } catch (err) {
      console.error('Contact Us submission error:', err);
      toast.error('Failed to send message');
    } finally {
      if (loadingToastId) toast.dismiss(loadingToastId);
      setLoading(false);
    }
  };

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
      <form className="flex flex-col gap-4 mt-4" onSubmit={handleSubmit}>

        {/* Email Field */}
        <div className="relative">
        <input
            type="email"
            placeholder="Enter your email"
            className="w-full p-4 pr-12 border border-gray-300 rounded-lg placeholder-gray-400 text-black focus:outline-none focus:border-black disabled:bg-gray-100 disabled:text-gray-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={emailLocked}
            disabled={emailLocked}
        />
          <Mail size={20} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black" />
        </div>

        {/* Subject Field */}
        <div className="relative">
          <input
            type="text"
            placeholder="Subject"
            className="w-full p-4 pr-12 border border-gray-300 rounded-lg placeholder-gray-400 text-black focus:outline-none focus:border-black"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <Tag size={20} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black" />
        </div>

        {/* Message Field */}
        <textarea
            rows={5}
            placeholder="Type your message here"
            className="w-full p-4 border border-gray-300 rounded-lg placeholder-gray-400 text-black focus:outline-none focus:border-black resize-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white rounded-lg w-full py-3 text-center text-base font-semibold mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default ContactUs;
