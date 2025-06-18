import { useState } from 'react';
import { FaSpinner } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface StatusUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (isGoing: boolean, hasPaid: boolean) => Promise<void>;
  initialIsGoing: boolean;
  initialHasPaid: boolean;
  paymentRequired: boolean;
}

export default function StatusUpdateDialog({
  isOpen,
  onClose,
  onUpdate,
  initialIsGoing,
  initialHasPaid,
  paymentRequired,
}: StatusUpdateDialogProps) {
  const [isGoing, setIsGoing] = useState(initialIsGoing);
  const [hasPaid, setHasPaid] = useState(initialHasPaid);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await onUpdate(isGoing, hasPaid);
      toast.success('Status updated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Update Your Status</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isGoing}
                onChange={(e) => setIsGoing(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>I am going</span>
            </label>
          </div>
          {paymentRequired && (
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={hasPaid}
                  onChange={(e) => setHasPaid(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>I have paid</span>
              </label>
            </div>
          )}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <span className="flex items-center">
                  <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Updating...
                </span>
              ) : (
                'Update'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 