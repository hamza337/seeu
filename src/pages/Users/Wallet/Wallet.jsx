import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../../../components/backBtn/backButton';
import axios from 'axios';

const Wallet = () => {
  const [walletData, setWalletData] = useState({});
  const baseUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');

  const historyData = [
    { amount: 123, daysAgo: 2 },
    { amount: 456, daysAgo: 5 },
    { amount: 789, daysAgo: 10 },
  ];

  const getWalletData = async () => {
    try{
      const response = await axios.get(`${baseUrl}stripe/me/my-wallet`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      setWalletData(response.data);
    }catch(e){
      console.error('Error Fetching Wallet Data', e);
    }
  }

  useEffect(() => {
    getWalletData();
  },[])

  return (
    <div className="px-6 sm:px-10 lg:px-20 py-6 flex flex-col gap-6">
      {/* Back Button with Heading */}
      <BackButton heading="Wallet" />

      {/* Wallet Balance Box */}
      <div className="bg-black text-white rounded-xl p-6 flex flex-col gap-2 mt-6">
        <h2 className="text-3xl font-bold">${walletData?.totalEarned}</h2>
        <p className="text-lg font-medium mt-12">{localStorage.getItem('user').replace(/"/g, '')}</p>
      </div>

      {/* Withdraw Request Button */}
      <Link
        to='/settings/wallet/withdraw-request' 
        className="bg-transparent text-black border-2 hover:border-none hover:bg-black hover:text-white rounded-lg w-full py-3 text-center text-base font-semibold mt-6"
      >
        Withdraw Request
      </Link>

      {/* Withdrawal History Section */}
    </div>
  );
};

export default Wallet;
