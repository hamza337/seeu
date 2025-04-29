import { Search } from 'lucide-react';
import { useState } from 'react';
import BackButton from '../../../components/backBtn/backButton';

const languageOptions = [
  { flag: 'https://flagcdn.com/gb.svg', label: 'English' },  // UK Flag corrected
  { flag: 'https://flagcdn.com/fr.svg', label: 'French' },
  { flag: 'https://flagcdn.com/cn.svg', label: 'Chinese' },   // China Flag corrected
  { flag: 'https://flagcdn.com/in.svg', label: 'Hindi' },
  { flag: 'https://flagcdn.com/jp.svg', label: 'Japanese' },
  { flag: 'https://flagcdn.com/ru.svg', label: 'Russian' },
  { flag: 'https://flagcdn.com/es.svg', label: 'Spanish' }
];

const LanguageSetting = () => {
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  const handleCheckboxChange = (language) => {
    setSelectedLanguage(selectedLanguage === language ? null : language);
  };

  return (
    <div className="px-6 sm:px-10 lg:px-20 py-6 flex flex-col gap-6">
      {/* Back Button and Heading */}
      <BackButton heading={'Choose the Language'} />

      {/* Search Bar */}
      <div className="flex items-center border border-black rounded-lg p-4 gap-2">
        <Search size={20} className="text-black" />
        <input
          type="text"
          placeholder="Search here..."
          className="w-full text-sm text-gray-500 placeholder-gray-400 focus:outline-none"
        />
      </div>

      {/* Language Options */}
      <div className="flex flex-col gap-4 mt-6">
        {languageOptions.map((option, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 border-b border-gray-200"
          >
            <div className="flex items-center gap-4">
              <img
                src={option.flag}
                alt={`${option.label} Flag`}
                className="w-10 h-6 rounded-md object-cover"
              />
              <span className="text-sm text-black font-semibold">{option.label}</span>
            </div>

            {/* Custom Checkbox */}
            <label className="relative cursor-pointer">
              <input
                type="checkbox"
                checked={selectedLanguage === option.label}
                onChange={() => handleCheckboxChange(option.label)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-full border-2 border-black flex items-center justify-center transition-all
                ${selectedLanguage === option.label ? 'bg-black' : 'bg-transparent'}
              `}>
                {selectedLanguage === option.label && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </label>

          </div>
        ))}
      </div>
    </div>
  );
};

export default LanguageSetting;
