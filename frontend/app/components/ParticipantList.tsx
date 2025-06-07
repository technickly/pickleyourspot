import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import UserSearch from './UserSearch';

interface Participant {
  name: string | null;
  email: string;
  image?: string | null;
  hasPaid: boolean;
  isGoing: boolean;
  userId: string;
}

interface Props {
  participants: Participant[];
  reservationId: string;
  isOwner: boolean;
  ownerEmail: string;
  paymentRequired: boolean;
  userEmail?: string;
  onAddParticipant: (email: string) => Promise<void>;
  onRemoveParticipant: (email: string) => Promise<void>;
}

export default function ParticipantList({
  participants,
  reservationId,
  isOwner,
  ownerEmail,
  paymentRequired,
  userEmail,
  onAddParticipant,
  onRemoveParticipant,
}: Props) {
  const [showUserSearch, setShowUserSearch] = useState(false);

  const handleStatusUpdate = async (
    userId: string,
    type: 'payment' | 'attendance',
    newValue: boolean
  ) => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}/participant-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          type,
          value: newValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success(`${type === 'payment' ? 'Payment' : 'Attendance'} status updated`);
    } catch (error) {
      toast.error(`Failed to update ${type} status`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-700">Participants</h3>
        {isOwner && (
          <button
            onClick={() => setShowUserSearch(!showUserSearch)}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            {showUserSearch ? 'Cancel' : '+ Add Participant'}
          </button>
        )}
      </div>

      {showUserSearch && isOwner && (
        <div className="mb-4">
          <UserSearch
            onSelect={onAddParticipant}
            selectedUsers={participants}
            placeholder="Search users by name or email..."
          />
        </div>
      )}

      {participants.length > 0 ? (
        <div className="space-y-3">
          {participants.map((participant) => (
            <div
              key={participant.email}
              className={`bg-white rounded-lg shadow-sm border p-4 transition-all ${
                participant.email === ownerEmail
                  ? 'border-indigo-200 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {participant.image && (
                    <Image
                      src={participant.image}
                      alt={participant.name || participant.email}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  )}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {participant.name || participant.email}
                      </span>
                      {participant.email === ownerEmail && (
                        <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full font-medium">
                          Owner
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">{participant.email}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Going/Not Going Toggle */}
                  <button
                    onClick={() => handleStatusUpdate(participant.userId, 'attendance', !participant.isGoing)}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      participant.isGoing
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {participant.isGoing ? (
                      <>
                        <span className="mr-1">✓</span> Going
                      </>
                    ) : (
                      <>
                        <span className="mr-1">✗</span> Not Going
                      </>
                    )}
                  </button>

                  {/* Payment Status Toggle */}
                  {paymentRequired && (
                    <button
                      onClick={() => handleStatusUpdate(participant.userId, 'payment', !participant.hasPaid)}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        participant.hasPaid
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {participant.hasPaid ? (
                        <>
                          <span className="mr-1">✓</span> Paid
                        </>
                      ) : (
                        <>
                          <span className="mr-1">✗</span> Unpaid
                        </>
                      )}
                    </button>
                  )}

                  {/* Remove Button */}
                  {isOwner && participant.email !== ownerEmail && (
                    <button
                      onClick={() => onRemoveParticipant(participant.email)}
                      className="text-red-600 hover:text-red-800 transition-colors ml-2"
                      title="Remove participant"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No participants yet</p>
      )}
    </div>
  );
} 