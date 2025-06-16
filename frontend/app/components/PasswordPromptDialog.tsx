import { useState } from 'react';

interface PasswordPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (password: string) => void;
  error?: string;
}

export default function PasswordPromptDialog({
  isOpen,
  onClose,
  onVerify,
  error
}: PasswordPromptDialogProps) {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Enter Password</h3>
        <p className="text-gray-600 mb-4">
          This reservation is password protected. Please enter the password to join.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg mb-4"
          placeholder="Enter password"
        />
        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onVerify(password)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  );
} 