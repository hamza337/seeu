import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css'; // your Tailwind CSS
import Layout from './components/layout';
import Home from './pages/Home/Home';
import Media from './pages/Media/Media';
import Users from './pages/Users/Users';
import LanguageSetting from './pages/Users/LanguageSetting/LanguageSetting';
import PrivacyPolicy from './pages/Users/PrivacyPolicy/PrivacyPolicy';
import UserAgreement from './pages/Users/UserAgreement/UserAgreement';
import Wallet from './pages/Users/Wallet/Wallet';
import WithdrawRequest from './pages/Users/Wallet/WithdrawRequest/WithdrawRequest';
import ContactUs from './pages/Users/ContactUs/ContactUs';
import MediaDetail from './components/mediaContent/mediaDetail/MediaDetail';
import Payment from './components/mediaContent/payment/Payment';
import ShareEvent from './components/shareEvent/ShareEvent';
import SearchResults from './components/searchResults/SearchResults';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Layout Route */}
        <Route path="/" element={<Layout />}>
          {/* Child routes */}
          <Route index element={<Home />} />
          <Route path="/share" element={<ShareEvent />} />
          <Route path="/results" element={<SearchResults />} />
          <Route path="media" element={<Media />} />
          <Route path="/media/:id" element={<MediaDetail />} />
          <Route path="/media/:id/buy-now" element={<Payment />} />
          <Route path="user" element={<Users />} />
          <Route path="user/language-setting" element={<LanguageSetting />} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="user-agreement" element={<UserAgreement />} />
          <Route path="user/wallet" element={<Wallet />} />
          <Route path="user/wallet/withdraw-request" element={<WithdrawRequest />} />
          <Route path="/contact-us" element={<ContactUs />} />

        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
