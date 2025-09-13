import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MDEditor from '@uiw/react-md-editor';
import BackButton from "../../../components/backBtn/backButton";
import toast from 'react-hot-toast';

const PrivacyPolicy = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const baseUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchPrivacyPolicy = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${baseUrl}admin/legal/privacy`);
        
        if (response.data && response.data.content) {
          setContent(response.data.content);
        } else {
          throw new Error('No content received from API');
        }
      } catch (err) {
        console.error('Error fetching privacy policy:', err);
        setError('Failed to load privacy policy content');
        toast.error('Failed to load privacy policy');
      } finally {
        setLoading(false);
      }
    };

    fetchPrivacyPolicy();
  }, [baseUrl]);

  if (loading) {
    return (
      <div className="px-6 sm:px-10 lg:px-20 py-6 flex flex-col gap-6">
        <BackButton heading="Privacy Policy" />
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading privacy policy...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 sm:px-10 lg:px-20 py-6 flex flex-col gap-6">
        <BackButton heading="Privacy Policy" />
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
      <BackButton heading="Privacy Policy" />

      {/* Privacy Policy Content */}
      <div data-color-mode="light" className=" flex flex-col gap-4 mt-6 text-black">
        <MDEditor.Markdown 
          source={content} 
          style={{ whiteSpace: 'pre-wrap' }}
        />

      </div>
    </div>
  );
};

export default PrivacyPolicy;
