import { useState } from 'react';
import BackButton from '../../../components/backBtn/backButton'; // Assuming you have a back button component
import toast from 'react-hot-toast';

const Payment = () => {
  const [cardNumber, setCardNumber] = useState('');

  // Handle form submission (e.g., call Stripe API here)
  const handlePayment = () => {
    // You can integrate Stripe logic here
    toast.success('Payment Confirmed!');
    // Redirect to a confirmation or success page (adjust based on routing approach)
    window.location.href = '/payment-success';  // Adjust as necessary based on routing strategy
  };

  return (
    <div className="px-6 sm:px-10 lg:px-20 py-6 flex flex-col gap-6">
      {/* Back Button */}
      <BackButton heading="Payment Method" />

      {/* Payment Form */}
      <div className="w-full mt-6">
        {/* Payment Method Title */}
        <h2 className="text-3xl font-bold mt-4 text-black">Payment Method</h2>

        {/* Card Number Input */}
        <div className="mt-6 relative">
          {/* Stripe Logo Inside the Input */}
          <div className="absolute top-1/2 left-3 transform -translate-y-1/2">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Stripe_logo.svg"
              alt="Stripe Logo"
              className="w-8 h-8"
            />
          </div>

          {/* Card Number Input */}
          <input
            type="text"
            id="cardNumber"
            placeholder="Enter Card Number"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            className="w-full p-3 pl-14 mt-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Confirm Payment Button */}
        <button
          onClick={handlePayment}
          className="bg-green-500 text-white rounded-lg py-3 mt-6 w-full"
        >
          Confirm Payment
        </button>
      </div>
    </div>
  );
};

export default Payment;
