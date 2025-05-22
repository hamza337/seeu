import { Link } from 'react-router-dom';
import BackButton from '../../../components/backBtn/backButton';

const Wallet = () => {
  const historyData = [
    { amount: 123, daysAgo: 2 },
    { amount: 456, daysAgo: 5 },
    { amount: 789, daysAgo: 10 },
  ];

  return (
    <div className="px-6 sm:px-10 lg:px-20 py-6 flex flex-col gap-6">
      {/* Back Button with Heading */}
      <BackButton heading="Wallet" />

      {/* Wallet Balance Box */}
      <div className="bg-black text-white rounded-xl p-6 flex flex-col gap-2 mt-6">
        <h2 className="text-3xl font-bold">$4,667,334</h2>
        <p className="text-lg font-medium mt-12">Pawas Arora</p>
        <p className="text-md tracking-widest">2208 2234 6567 5434</p>
      </div>

      {/* Withdraw Request Button */}
      <Link
        to='/settings/wallet/withdraw-request' 
        className="bg-black text-white rounded-lg w-full py-3 text-center text-base font-semibold mt-6"
      >
        Withdraw Request
      </Link>

      {/* Withdrawal History Section */}
      <div className="flex flex-col gap-2 mt-4">
        <h2 className="text-lg font-bold text-black">Withdrawal History</h2>

        {/* History Rows */}
        {historyData.map((item, index) => (
            <div
            key={index}
            className={`flex items-center justify-between bg-gray-100 p-4 rounded-lg ${
            index !== historyData.length - 1 ? 'border-b border-gray-300' : ''
            }`}
        >
            <div className="flex items-center gap-3">
                {/* Green Circle with Exclamation Mark */}
                <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">
                    !
                </div>
                <p className="text-sm text-gray-800">
                    Your withdrawal request of <span className="font-semibold">${item.amount}</span> from your wallet is successful.
                </p>
                </div>
                <span className="text-xs text-gray-500">{item.daysAgo} days ago</span>
            </div>
        ))}
      </div>
    </div>
  );
};

export default Wallet;
