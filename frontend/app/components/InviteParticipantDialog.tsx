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
    router.push('/my-account');
    // Add a small delay to ensure the page has loaded before scrolling
    setTimeout(() => {
      const membershipSection = document.querySelector('#membership-tiers');
      if (membershipSection) {
        membershipSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Premium Feature</h3>
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
            Upgrade to Premium
          </h4>
          <p className="text-gray-600 mb-6">
            Email invitations are a premium feature. Upgrade your account to unlock:
          </p>
          <ul className="text-left space-y-3 mb-6">
            <li className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Email invitations to participants
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