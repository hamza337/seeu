import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full bg-transparent py-2">
      <div className="flex justify-end gap-8 text-sm px-6 text-black font-medium">
        <Link to="/privacy-policy" className="hover:underline">Privacy Policy</Link>
        <Link to="/user-agreement" className="hover:underline">User Agreement</Link>
        <Link to="/contact-us" className="hover:underline">Contact Us</Link>
      </div>
    </footer>
  );
}
