import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackButton = ({ heading }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    const paths = location.pathname.split('/').filter(Boolean); // Split and remove empty strings
    paths.pop(); // Remove the last part
    const previousPath = '/' + paths.join('/'); // Rebuild the path
    navigate(previousPath || '/'); // Navigate to previous path or home if empty
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleBack}
        className="w-10 h-10 flex items-center justify-center bg-black rounded-lg text-white"
      >
        <ArrowLeft size={20} />
      </button>
      <p className="text-xl text-black font-bold">{heading}</p>
    </div>
  );
};

export default BackButton;
