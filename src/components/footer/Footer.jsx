import { Link, useLocation } from 'react-router-dom';
import { FaApple, FaGooglePlay } from 'react-icons/fa';
import { GooglePlayButton } from "react-mobile-app-button";
import { useLanguage } from '../../contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  const location = useLocation();
  const isHome = location.pathname === '/';
  
  return (
    <footer className="w-full bg-transparent py-2">
      <div className="flex items-center justify-between px-6">
        {/* Store buttons (only on home route) */}
        {isHome ? (
          <div className="ml-48 flex gap-3">
            <button
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-black text-sm shadow-sm hover:bg-gray-50"
              aria-label="Download on the App Store"
            >
              <FaApple className="w-5 h-5" />
              <span>Download on the App Store</span>
            </button>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-black text-sm shadow-sm hover:bg-gray-50"
              aria-label="Get it on Google Play"
            >
              <FaGooglePlay className="w-5 h-5" />
              <span>Get it on Google Play</span>
            </a>
          </div>
        ) : (
          <div />
        )}

        {/* Right-side legal links */}
        <div className="flex justify-end gap-8 text-sm text-black font-medium">
          <Link to="/privacy-policy" className="hover:underline">{t('footer.privacyPolicy')}</Link>
          <Link to="/user-agreement" className="hover:underline">{t('footer.userAgreement')}</Link>
          <Link to="/contact-us" className="hover:underline">{t('footer.contactUs')}</Link>
        </div>
      </div>
    </footer>
  );
}
