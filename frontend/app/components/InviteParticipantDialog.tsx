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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Share Reservation</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-center py-6">
          <div className="flex justify-center mb-4">
            <FaCrown className="text-yellow-400 text-5xl" />
          </div>
          <h4 className="text-xl font-semibold mb-2">
            Share Your Reservation
          </h4>
          <p className="text-gray-600 mb-6">
            Email & Text Invitations are a Supr feature. For now, you can:
          </p>
          <div className="text-left space-y-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium mb-2">Free & Basic Users</h5>
              <p className="text-gray-600 mb-3">
                Share your reservation by copying the unique link and sending it manually:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Click the "Copy Link" button in the reservation details</li>
                <li>Share the link via text, email, or your preferred method</li>
                <li>Recipients can join with one click after signing in</li>
              </ol>
            </div>
            <div className="border-t pt-6">
              <h5 className="font-medium mb-2">Upgrade to Supr to unlock:</h5>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Direct email & text invitations
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Automated reminders
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Priority support
                </li>
              </ul>
            </div>
          </div>
          <button
            onClick={handleMembershipClick}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
          >
            <FaCrown className="text-yellow-300" />
            See Membership Options
          </button>
        </div>
      </div>
    </div>
  );
} 