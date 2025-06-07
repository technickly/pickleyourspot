import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: 'attendance' | 'payment';
  newStatus: boolean;
}

export default function StatusConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  type,
  newStatus,
}: Props) {
  if (!isOpen) return null;

  const getMessage = () => {
    if (type === 'attendance') {
      return newStatus ? 'Are you sure you want to mark yourself as going?' : 'Are you sure you want to mark yourself as not going?';
    } else {
      return newStatus ? 'Are you sure you want to mark yourself as paid?' : 'Are you sure you want to mark yourself as unpaid?';
    }
  };

  const getTitle = () => {
    if (type === 'attendance') {
      return newStatus ? 'Mark as Going?' : 'Mark as Not Going?';
    } else {
      return newStatus ? 'Mark as Paid?' : 'Mark as Unpaid?';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">
          {getTitle()}
        </h3>
        <p className="text-gray-600 mb-6">
          {getMessage()}
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