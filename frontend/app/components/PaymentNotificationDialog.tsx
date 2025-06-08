import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSkip: () => void;
  ownerName: string;
  reservationId: string;
}

export default function PaymentNotificationDialog({
  isOpen,
  onClose,
  onConfirm,
  onSkip,
  ownerName,
  reservationId,
}: Props) {
  const [isSending, setIsSending] = useState(false);

  const handleNotify = async () => {
    setIsSending(true);
    try {
      const response = await fetch(`/api/reservations/${reservationId}/notify-payment`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      toast.success('Payment notification sent');
      onConfirm();
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setIsSending(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Payment Notification</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mb-6">
          <p className="text-gray-600">
            Would you like to notify {ownerName} that you sent the payment?
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            disabled={isSending}
          >
            No, Skip
          </button>
          <button
            onClick={handleNotify}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-blue-300 flex items-center gap-2"
            disabled={isSending}
          >
            {isSending ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Yes, Notify
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 