'use client';

import { useState } from 'react';
import { FaCheck, FaCopy } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface CopyButtonProps {
  text: string;
  label: string | React.ReactNode;
  className?: string;
}

export default function CopyButton({ text, label, className = '' }: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 font-medium text-lg shadow-md hover:shadow-lg ${className}`}
      title="Copy to clipboard"
    >
      {isCopied ? (
        <>
          <FaCheck className="text-xl" />
          Copied!
        </>
      ) : (
        <>
          <FaCopy className="text-xl" />
          {label}
        </>
      )}
    </button>
  );
} 