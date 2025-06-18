'use client';

import { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import UserSearch from './UserSearch';
import { toast } from 'react-hot-toast';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAddParticipant: (userId: string) => Promise<void>;
  existingParticipants: { userId: string }[];
}

export default function AddParticipantDialog({ isOpen, onClose, onAddParticipant, existingParticipants }: Props) {
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleSelect = async (user: User) => {
    // Check if user is already a participant
    if (existingParticipants.some(p => p.userId === user.id)) {
      toast.error('This user is already a participant');
      return;
    }

    try {
      setIsAdding(true);
      await onAddParticipant(user.id);
      toast.success('Participant added successfully');
      onClose();
    } catch (error) {
      console.error('Error adding participant:', error);
      toast.error('Failed to add participant');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Participant</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        <div className="mb-4">
          <UserSearch
            onSelect={handleSelect}
            placeholder="Search users by name or email..."
          />
        </div>
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 