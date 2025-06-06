'use client';

import { useState } from 'react';
import { FaCheck, FaCopy } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface CopyButtonProps {
  text: string;
  label?: string;
}

export default function CopyButton({ text, label = 'Copy Link' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // Validate that we have a text to copy
      if (!text) {
        throw new Error('No text to copy');
      }

      // Check if the clipboard API is available
      if (!navigator.clipboard) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          setCopied(true);
          toast.success('Link copied to clipboard!');
        } catch (err) {
          toast.error('Failed to copy link - please copy manually');
        }
        document.body.removeChild(textArea);
        return;
      }

      // Use the clipboard API
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      console.error('Copy error:', err);
      toast.error('Failed to copy link - please try again');
    } finally {
      // Reset the copied state after 2 seconds
      if (copied) {
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
    >
      {copied ? <FaCheck className="text-green-600" /> : <FaCopy className="text-gray-600" />}
      <span className="text-gray-700">{label}</span>
    </button>
  );
} 