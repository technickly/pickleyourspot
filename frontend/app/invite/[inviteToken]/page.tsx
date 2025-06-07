import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

interface ReservationDetails {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  description: string | null;
  court: {
    name: string;
    description: string;
    imageUrl: string;
  };
  owner: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

export default function InvitePage({ params }: { params: { inviteToken: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [reservation, setReservation] = useState<ReservationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    const fetchInviteDetails = async () => {
      try {
        const response = await fetch(`/api/invites/${params.inviteToken}`);
        if (!response.ok) {
          throw new Error('Invalid or expired invite link');
        }
        const data = await response.json();
        setReservation(data);
      } catch (error) {
        toast.error('Invalid or expired invite link');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    if (status !== 'loading') {
      fetchInviteDetails();
    }
  }, [params.inviteToken, status, router]);

  const handleAcceptInvite = async () => {
    if (!session) {
      // Store the invite token in session storage and redirect to sign in
      sessionStorage.setItem('pendingInvite', params.inviteToken);
      router.push('/auth/signin');
      return;
    }

    setIsAccepting(true);
    try {
      const response = await fetch(`/api/invites/${params.inviteToken}/accept`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to accept invitation');
      }

      toast.success('Successfully joined the reservation');
      router.push(`/reservations/${reservation?.id}`);
    } catch (error) {
      toast.error('Failed to accept invitation');
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading || !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {reservation.court.imageUrl && (
            <div className="relative h-48 w-full">
              <Image
                src={reservation.court.imageUrl}
                alt={reservation.court.name}
                fill
                className="object-cover"
              />
            </div>
          )}

          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              {reservation.owner.image && (
                <Image
                  src={reservation.owner.image}
                  alt={reservation.owner.name || reservation.owner.email}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {reservation.name}
                </h2>
                <p className="text-gray-600">
                  Invited by {reservation.owner.name || reservation.owner.email}
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Location</h3>
                <p className="mt-1 text-gray-900">{reservation.court.name}</p>
                {reservation.court.description && (
                  <p className="mt-1 text-sm text-gray-500">{reservation.court.description}</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
                <p className="mt-1 text-gray-900">
                  {new Date(reservation.startTime).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="mt-1 text-gray-600">
                  {new Date(reservation.startTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })} -{' '}
                  {new Date(reservation.endTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {reservation.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Additional Details</h3>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{reservation.description}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleAcceptInvite}
                disabled={isAccepting}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-blue-300 flex items-center justify-center gap-2"
              >
                {isAccepting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Accepting Invitation...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {session ? 'Accept Invitation' : 'Sign in to Accept Invitation'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 