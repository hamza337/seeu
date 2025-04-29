import { useState } from 'react';
import BackButton from '../../../../components/backBtn/backButton';

const WithdrawRequest = () => {
  const [formData, setFormData] = useState({
    bankName: '',
    accountTitle: '',
    accountNumber: '',
    withdrawalAmount: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Withdrawal Request Submitted:', formData);
  };

  return (
    <div className="px-6 sm:px-10 lg:px-20 py-6 flex flex-col gap-6">
      {/* Back Button with Heading */}
      <BackButton heading="Withdraw Request" />

      {/* Withdraw Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-6">

        {/* Bank Name Dropdown */}
        <div className="flex flex-col relative">
          <label htmlFor="bankName" className="text-sm font-semibold text-black">Bank Name</label>
          <select
            name="bankName"
            id="bankName"
            value={formData.bankName}
            onChange={handleInputChange}
            className={`mt-2 p-4 border border-gray-300 rounded-lg focus:outline-none focus:border-black appearance-none pr-10 ${
              formData.bankName === '' ? 'text-gray-500' : 'text-black'
            }`}
          >
            <option value="" disabled>Select Bank</option>
            <option value="BankA">Bank A</option>
            <option value="BankB">Bank B</option>
            <option value="BankC">Bank C</option>
          </select>
          {/* Custom Dropdown Arrow */}
          <div className="absolute right-4 top-[58%] transform -translate-y-1/2 pointer-events-none text-gray-500">
            ▼
          </div>
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
          className="bg-black text-white rounded-lg py-3 text-center text-base font-semibold mt-6"
        >
          Send Withdraw Request
        </button>
      </form>
    </div>
  );
};

export default WithdrawRequest;
