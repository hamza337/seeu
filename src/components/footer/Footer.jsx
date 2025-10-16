import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="w-full bg-transparent py-2">
      <div className="flex justify-end gap-8 text-sm px-6 text-black font-medium">
        <Link to="/privacy-policy" className="hover:underline">{t('footer.privacyPolicy')}</Link>
        <Link to="/user-agreement" className="hover:underline">{t('footer.userAgreement')}</Link>
        <Link to="/contact-us" className="hover:underline">{t('footer.contactUs')}</Link>
      </div>
    </footer>
  );
}
