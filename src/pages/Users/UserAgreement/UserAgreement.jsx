import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MDEditor from '@uiw/react-md-editor';
import BackButton from "../../../components/backBtn/backButton";
import toast from 'react-hot-toast';

const UserAgreement = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const baseUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchUserAgreement = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${baseUrl}admin/legal/terms`);
        
        if (response.data && response.data.content) {
          setContent(response.data.content);
        } else {
          throw new Error('No content received from API');
        }
      } catch (err) {
        console.error('Error fetching user agreement:', err);
        setError('Failed to load user agreement content');
        toast.error('Failed to load user agreement');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAgreement();
  }, [baseUrl]);

  if (loading) {
    return (
      <div className="px-6 sm:px-10 lg:px-20 py-6 flex flex-col gap-6">
        <BackButton heading="Terms & Conditions" />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading terms & conditions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 sm:px-10 lg:px-20 py-6 flex flex-col gap-6">
        <BackButton heading="Terms & Conditions" />
        <div className="flex flex-col items-center py-12">
          <div className="text-red-600 text-center">
            <p className="text-lg font-semibold mb-2">Error Loading Content</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 sm:px-10 lg:px-20 py-6 flex flex-col gap-6">
      {/* Back Button with Heading */}
      <BackButton heading="Terms & Conditions" />

      {/* User Agreement Content */}
      <div data-color-mode="light" className="flex flex-col gap-4 mt-6 text-black">
        <MDEditor.Markdown 
          source={content} 
          style={{ whiteSpace: 'pre-wrap' }}
        />

      </div>
    </div>
  );
};

export default UserAgreement;
