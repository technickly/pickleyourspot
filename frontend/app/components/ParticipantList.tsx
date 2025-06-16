import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import UserSearch from './UserSearch';
import PaymentNotificationDialog from './PaymentNotificationDialog';
import UnpaidConfirmationDialog from './UnpaidConfirmationDialog';
import InviteParticipantDialog from './InviteParticipantDialog';

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
  reservationName: string;
  isOwner: boolean;
  ownerEmail: string;
  ownerName: string | null;
  paymentRequired: boolean;
  userEmail?: string;
  onAddParticipant: (email: string) => Promise<void>;
  onRemoveParticipant: (email: string) => Promise<void>;
}

// Add AttendanceConfirmationDialog component
function AttendanceConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  isGoing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isGoing: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">
          {isGoing ? 'Mark as Not Going?' : 'Mark as Going?'}
        </h3>
        <p className="text-gray-600 mb-6">
          {isGoing
            ? 'Are you sure you want to mark yourself as not going to this reservation?'
            : 'Are you sure you want to mark yourself as going to this reservation?'}
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ParticipantList({
  participants,
  reservationId,
  reservationName,
  isOwner,
  ownerEmail,
  ownerName,
  paymentRequired,
  userEmail,
  onAddParticipant,
  onRemoveParticipant,
}: Props) {
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showPaymentNotification, setShowPaymentNotification] = useState(false);
  const [showUnpaidConfirmation, setShowUnpaidConfirmation] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showAttendanceConfirmation, setShowAttendanceConfirmation] = useState(false);
  const [pendingPaymentUpdate, setPendingPaymentUpdate] = useState<{
    userId: string;
    newValue: boolean;
  } | null>(null);
  const [pendingAttendanceUpdate, setPendingAttendanceUpdate] = useState<{
    userId: string;
    newValue: boolean;
  } | null>(null);

  const handleStatusUpdate = async (
    userId: string,
    type: 'payment' | 'attendance',
    newValue: boolean
  ) => {
    try {
      if (!userId) {
        throw new Error('Invalid user ID');
      }

      if (type === 'payment') {
        if (newValue && !isOwner && userEmail !== ownerEmail) {
          setPendingPaymentUpdate({ userId, newValue });
          setShowPaymentNotification(true);
          return;
        } else if (!newValue && !isOwner) {
          setPendingPaymentUpdate({ userId, newValue });
          setShowUnpaidConfirmation(true);
          return;
        }
      } else if (type === 'attendance' && userEmail) {
        // Only show confirmation for the current user changing their own status
        const participant = participants.find(p => p.email === userEmail);
        if (participant && participant.userId === userId) {
          setPendingAttendanceUpdate({ userId, newValue });
          setShowAttendanceConfirmation(true);
          return;
        }
      }

      await updateParticipantStatus(userId, type, newValue);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error instanceof Error ? error.message : `Failed to update ${type} status`);
    }
  };

  const updateParticipantStatus = async (
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
        const error = await response.json();
        throw new Error(error.message || 'Failed to update status');
      }

      const updatedParticipant = await response.json();

      // Update local state optimistically
      const updatedParticipants = participants.map(p => {
        if (p.userId === userId) {
          return {
            ...p,
            [type === 'payment' ? 'hasPaid' : 'isGoing']: newValue,
          };
        }
        return p;
      });

      // Emit success message
      toast.success(`${type === 'payment' ? 'Payment' : 'Attendance'} status updated`);
    } catch (error) {
      console.error('Error updating status:', error);
      throw error;
    }
  };

  const handlePaymentNotificationClose = () => {
    setShowPaymentNotification(false);
    setPendingPaymentUpdate(null);
  };

  const handlePaymentNotificationConfirm = async () => {
    if (pendingPaymentUpdate) {
      await updateParticipantStatus(
        pendingPaymentUpdate.userId,
        'payment',
        pendingPaymentUpdate.newValue
      );
    }
    handlePaymentNotificationClose();
  };

  const handleUnpaidConfirmationClose = () => {
    setShowUnpaidConfirmation(false);
    setPendingPaymentUpdate(null);
  };

  const handleUnpaidConfirmationConfirm = async () => {
    if (pendingPaymentUpdate) {
      await updateParticipantStatus(
        pendingPaymentUpdate.userId,
        'payment',
        pendingPaymentUpdate.newValue
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-700">Participants</h3>
        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUserSearch(!showUserSearch)}
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              {showUserSearch ? 'Cancel' : '+ Add Participant'}
            </button>
            <button
              onClick={() => setShowInviteDialog(true)}
              className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Send Invite
            </button>
          </div>
        )}
      </div>

      {showUserSearch && isOwner && (
        <div className="mb-4">
          <UserSearch
            onSelect={(user) => onAddParticipant(user.email)}
            placeholder="Search users by name or email..."
          />
        </div>
      )}

      {participants.length > 0 ? (
        <div className="space-y-3">
          {participants.map((participant) => (
            <div
              key={participant.userId}
              className={`bg-white rounded-lg shadow-sm border p-4 transition-all ${
                participant.email === ownerEmail
                  ? 'border-indigo-200 bg-indigo-50'
                  : participant.isGoing
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{participant.name || participant.email}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    participant.isGoing ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {participant.isGoing ? 'Going' : 'Not Going'}
                  </span>
                </div>
                {paymentRequired && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    participant.hasPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {participant.hasPaid ? 'Paid' : 'Unpaid'}
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500">{participant.email}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No participants yet</p>
      )}

      <PaymentNotificationDialog
        isOpen={showPaymentNotification}
        onClose={handlePaymentNotificationClose}
        onConfirm={handlePaymentNotificationConfirm}
        ownerName={ownerName || ownerEmail.split('@')[0]}
        reservationId={reservationId}
      />

      <UnpaidConfirmationDialog
        isOpen={showUnpaidConfirmation}
        onClose={handleUnpaidConfirmationClose}
        onConfirm={handleUnpaidConfirmationConfirm}
        ownerName={ownerName || ownerEmail.split('@')[0]}
      />

      <AttendanceConfirmationDialog
        isOpen={showAttendanceConfirmation}
        onClose={() => {
          setShowAttendanceConfirmation(false);
          setPendingAttendanceUpdate(null);
        }}
        onConfirm={async () => {
          if (pendingAttendanceUpdate) {
            await updateParticipantStatus(
              pendingAttendanceUpdate.userId,
              'attendance',
              pendingAttendanceUpdate.newValue
            );
          }
          setShowAttendanceConfirmation(false);
          setPendingAttendanceUpdate(null);
        }}
        isGoing={!pendingAttendanceUpdate?.newValue}
      />

      <InviteParticipantDialog
        isOpen={showInviteDialog}
        onClose={() => setShowInviteDialog(false)}
        reservationId={reservationId}
        reservationName={reservationName}
      />
    </div>
  );
} 