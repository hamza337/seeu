import { LogOut } from 'lucide-react';

const SignOutModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-100/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-11/12 max-w-md flex flex-col items-center gap-6">
        {/* Icon */}
        <LogOut className="text-black" size={40} />

        {/* Heading */}
        <h2 className="text-xl font-bold text-black">Sign Out?</h2>

        {/* Sub Text */}
        <p className="text-center text-gray-500 text-sm">Are you sure you want to sign out?</p>

        {/* Buttons */}
        <div className="flex gap-4 mt-4 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg bg-white text-black border border-black font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              // Handle actual sign out logic
              console.log('Signed Out');
              onClose();
            }}
            className="flex-1 py-3 rounded-lg bg-black text-white font-semibold"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignOutModal;
