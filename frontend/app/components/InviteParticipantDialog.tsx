import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { FaCrown } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reservationId: string;
  reservationName: string;
}

export default function InviteParticipantDialog({
  isOpen,
  onClose,
  reservationName,
}: Props) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleMembershipClick = () => {
    onClose();
    router.push('/upgrade?returnTo=' + encodeURIComponent(window.location.pathname));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Share Reservation</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 -mr-2"
            aria-label="Close dialog"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-center py-4">
          <div className="flex justify-center mb-4">
            <FaCrown className="text-yellow-400 text-4xl" />
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h5 className="font-medium mb-2">Quick Share</h5>
            <p className="text-gray-600 text-sm mb-2">
              Copy the reservation link and share it with your friends:
            </p>
            <ol className="text-sm text-left list-decimal list-inside space-y-1 text-gray-700">
              <li>Click "Copy Link" in reservation details</li>
              <li>Share via text or email</li>
            </ol>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Want to send invites directly? 
              <button
                onClick={handleMembershipClick}
                className="text-blue-600 hover:text-blue-700 font-medium ml-1"
              >
                Upgrade to Supr
              </button>
            </p>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Close
            </button>
            <button
              onClick={handleMembershipClick}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
            >
              <FaCrown className="text-yellow-300" />
              See Plans
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 