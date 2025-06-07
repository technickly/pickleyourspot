'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { HiX } from 'react-icons/hi';

interface RequestCourtFormProps {
  onClose: () => void;
}

export default function RequestCourtForm({ onClose }: RequestCourtFormProps) {
  const [formData, setFormData] = useState({
    courtName: '',
    location: '',
    description: '',
    email: '',
    discord: '',
  });
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/courts/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      setShowConfirmation(true);
    } catch (error) {
      toast.error('Failed to submit request. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (showConfirmation) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <HiX className="h-5 w-5" />
          </button>
          <h3 className="text-xl font-semibold mb-4">Thank You!</h3>
          <p className="text-gray-600 mb-4">
            Your court request has been submitted successfully. We will review it and get back to you soon.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <HiX className="h-5 w-5" />
        </button>
        <h2 className="text-2xl font-semibold mb-6">Request New Court</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="courtName" className="block text-sm font-medium text-gray-700 mb-1">
              Court Name*
            </label>
            <input
              type="text"
              id="courtName"
              name="courtName"
              required
              value={formData.courtName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter court name"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location*
            </label>
            <input
              type="text"
              id="location"
              name="location"
              required
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter court location"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description*
            </label>
            <textarea
              id="description"
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Describe the court (surface type, number of courts, amenities, etc.)"
            />
          </div>

          <div className="border-t border-gray-200 pt-4 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email*
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="discord" className="block text-sm font-medium text-gray-700 mb-1">
                  Discord Username (optional)
                </label>
                <input
                  type="text"
                  id="discord"
                  name="discord"
                  value={formData.discord}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter your Discord username"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 