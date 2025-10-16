import React, { createContext, useContext, useState, useEffect } from 'react';

// Import translation files
import enTranslations from '../translations/en';
import frTranslations from '../translations/fr';
import zhTranslations from '../translations/zh';
import hiTranslations from '../translations/hi';
import jaTranslations from '../translations/ja';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Supported languages
const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' }
];

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [translations, setTranslations] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Load translations for a specific language
  const loadTranslations = async (languageCode) => {
    try {
      setIsLoading(true);
      let translations;
      
      switch (languageCode) {
        case 'en':
          translations = enTranslations;
          break;
        case 'fr':
          translations = frTranslations;
          break;
        case 'zh':
          translations = zhTranslations;
          break;
        case 'hi':
          translations = hiTranslations;
          break;
        case 'ja':
          translations = jaTranslations;
          break;
        default:
          translations = enTranslations;
      }
      
      setTranslations(translations);
    } catch (error) {
      console.error('Failed to load translations:', error);
      // Fallback to English
      setTranslations(enTranslations);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize language from localStorage or browser preference
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    const browserLanguage = navigator.language.split('-')[0];
    const supportedLanguageCodes = SUPPORTED_LANGUAGES.map(lang => lang.code);
    const initialLanguage = savedLanguage || 
      (supportedLanguageCodes.includes(browserLanguage) ? browserLanguage : 'en');
    
    setCurrentLanguage(initialLanguage);
    loadTranslations(initialLanguage);
  }, []);

  // Change language
  const changeLanguage = async (languageCode) => {
    const supportedLanguageCodes = SUPPORTED_LANGUAGES.map(lang => lang.code);
    if (supportedLanguageCodes.includes(languageCode)) {
      setCurrentLanguage(languageCode);
      localStorage.setItem('preferredLanguage', languageCode);
      await loadTranslations(languageCode);
    }
  };

  // Translation function
  const t = (key, defaultValue = key) => {
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    
    return typeof value === 'string' ? value : defaultValue;
  };

  // Get current language info
  const getCurrentLanguageInfo = () => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    isLoading,
    getCurrentLanguageInfo,
    supportedLanguages: SUPPORTED_LANGUAGES
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;