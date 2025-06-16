import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import PasswordPromptDialog from '@/app/components/PasswordPromptDialog';

export default function ShortUrlPage({ params }: { params: { shortUrl: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [error, setError] = useState<string>();

  const handleJoin = async (password?: string) => {
    try {
      const response = await fetch(`/api/reservations/short/${params.shortUrl}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.requiresPassword) {
          setShowPasswordPrompt(true);
          return;
        }
        throw new Error(data.error || 'Failed to join reservation');
      }

      const data = await response.json();
      router.push(`/reservations/${data.reservationId}`);
      toast.success('Successfully joined reservation');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to join reservation');
    }
  };

  const handlePasswordVerify = async (password: string) => {
    setError(undefined);
    try {
      const response = await fetch(`/api/reservations/short/${params.shortUrl}/verify-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Invalid password');
        return;
      }

      await handleJoin(password);
      setShowPasswordPrompt(false);
    } catch (error) {
      setError('Failed to verify password');
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Join Reservation
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Click the button below to join this reservation
          </p>
        </div>
        <div>
          <button
            onClick={() => handleJoin()}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Join Reservation
          </button>
        </div>
      </div>

      <PasswordPromptDialog
        isOpen={showPasswordPrompt}
        onClose={() => setShowPasswordPrompt(false)}
        onVerify={handlePasswordVerify}
        error={error}
      />
    </div>
  );
} 