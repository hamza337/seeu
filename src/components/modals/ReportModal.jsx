import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useMap } from '../../contexts/MapContext';

const ReportModal = ({ isOpen, onClose, eventId }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setShowLoginModal } = useMap();
  const baseUrl = import.meta.env.VITE_API_URL;

  const reportCategories = [
    { value: 'Spam', label: 'Spam' },
    { value: 'Inappropriate', label: 'Inappropriate' },
    { value: 'Fake', label: 'Fake' },
    { value: 'Copyright', label: 'Copyright' },
    { value: 'Other', label: 'Other' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCategory) {
      toast.error('Please select a report category');
      return;
    }

    if (selectedCategory === 'Other' && !customMessage.trim()) {
      toast.error('Please provide a description for the report');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setShowLoginModal(true);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const payload = {
        eventId: eventId,
        category: selectedCategory,
        ...(selectedCategory === 'Other' && { customMessage: customMessage.trim() })
      };

      await axios.post(`${baseUrl}events/reports`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      toast.success('Report submitted successfully');
      handleClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      if (error.response?.status === 401) {
        setShowLoginModal(true);
        toast.error('Please log in to submit a report');
      } else {
        toast.error(error.response?.data?.message || 'Failed to submit report');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedCategory('');
    setCustomMessage('');
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-auto relative" style={{ borderRadius: '10px', border: '1px solid #8080804a' }}>
        {/* Close button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={isSubmitting}
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Report Post
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-600 text-center mb-6">
            Help us maintain a safe community by reporting inappropriate content.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Report Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Why are you reporting this post?
              </label>
              <div className="space-y-2">
                {reportCategories.map((category) => (
                  <label key={category.value} className="flex items-center">
                    <input
                      type="radio"
                      name="reportCategory"
                      value={category.value}
                      checked={selectedCategory === category.value}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                      disabled={isSubmitting}
                    />
                    <span className="ml-2 text-sm text-gray-700">{category.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Custom Message for 'Other' category */}
            {selectedCategory === 'Other' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please describe the issue:
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Provide details about why you're reporting this post..."
                  rows={4}
                  className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  disabled={isSubmitting}
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {customMessage.length}/500 characters
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !selectedCategory}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ReportModal;