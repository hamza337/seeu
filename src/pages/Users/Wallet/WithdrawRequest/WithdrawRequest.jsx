import { useState } from 'react';
import BackButton from '../../../../components/backBtn/backButton';
import axios from 'axios';

const WithdrawRequest = () => {
  const [formData, setFormData] = useState({
    bankName: '',
    accountTitle: '',
    accountNumber: '',
    withdrawalAmount: '',
  });

  const baseUrl = import.meta.env.VITE_API_URL;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('User not authenticated. Please login.');
      setLoading(false);
      return;
    }

    const requestBody = {
      bankName: formData.bankName,
      accountTitle: formData.accountTitle,
      accountNumber: formData.accountNumber,
      amount: parseFloat(formData.withdrawalAmount),
    };

    if (!requestBody.bankName || !requestBody.accountTitle || !requestBody.accountNumber || isNaN(requestBody.amount) || requestBody.amount <= 0) {
        setError('Please fill in all fields with valid information.');
        setLoading(false);
        return;
    }

    try {
      const response = await axios.post(`${baseUrl}stripe/me/request-withdrawal`, requestBody, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200 || response.status === 201) {
        setSuccess(true);
        setFormData({
            bankName: '',
            accountTitle: '',
            accountNumber: '',
            withdrawalAmount: '',
        });
      } else {
        setError(response.data?.message || 'Withdrawal request failed.');
      }
    } catch (err) {
      console.error('Withdrawal request error:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred during the withdrawal request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 sm:px-10 lg:px-20 py-2 flex flex-col gap-0">
      {/* Back Button with Heading */}
      <BackButton heading="Withdraw Request" />

      {/* Withdraw Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-6">

        {/* Bank Name Dropdown */}
        <div className="flex flex-col relative">
          <label htmlFor="bankName" className="text-sm font-semibold text-black">Bank Name</label>
          <input
            type="text"
            name="bankName"
            id="bankName"
            value={formData.bankName}
            onChange={handleInputChange}
            placeholder="Enter bank name"
            className="mt-2 p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-black placeholder-gray-500"
          />
        </div>

        {/* Account Title */}
        <div className="flex flex-col">
          <label htmlFor="accountTitle" className="text-sm font-semibold text-black">Account Title</label>
          <input
            type="text"
            name="accountTitle"
            id="accountTitle"
            value={formData.accountTitle}
            onChange={handleInputChange}
            placeholder="Enter account title"
            className="mt-2 p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-black placeholder-gray-500"
          />
        </div>

        {/* Account Number */}
        <div className="flex flex-col">
          <label htmlFor="accountNumber" className="text-sm font-semibold text-black">Account Number</label>
          <input
            type="text"
            name="accountNumber"
            id="accountNumber"
            value={formData.accountNumber}
            onChange={handleInputChange}
            placeholder="Enter account number"
            className="mt-2 p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-black placeholder-gray-500"
          />
        </div>

        {/* Withdrawal Amount */}
        <div className="flex flex-col">
          <label htmlFor="withdrawalAmount" className="text-sm font-semibold text-black">Withdrawal Amount</label>
          <input
            type="text"
            name="withdrawalAmount"
            id="withdrawalAmount"
            value={formData.withdrawalAmount}
            onChange={handleInputChange}
            placeholder="Enter amount"
            className="mt-2 p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-black placeholder-gray-500"
          />
        </div>

        {/* Send Withdraw Request Button */}
        <button
          type="submit"
          className={`bg-black text-white rounded-lg py-3 text-center text-base font-semibold mt-6 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Send Withdraw Request'}
        </button>
      </form>
      
      {error && <p className="text-red-600 text-center mt-4">{error}</p>}
      {success && <p className="text-green-600 text-center mt-4">Withdrawal request submitted successfully!</p>}
    </div>
  );
};

export default WithdrawRequest;
