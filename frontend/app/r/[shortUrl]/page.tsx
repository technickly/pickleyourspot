'use client';

import { useState, useEffect, useRef, useCallback, memo, useImperativeHandle, forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { formatInTimeZone } from 'date-fns-tz';
import { use } from 'react';

interface Props {
  params: Promise<{
    shortUrl: string;
  }>;
}

interface Reservation {
  id: string;
  name: string;
  description: string | null;
  startTime: string;
  endTime: string;
  paymentRequired: boolean;
  paymentInfo: string | null;
  password: string | null;
  court: {
    name: string;
    description: string;
  };
  owner: {
    name: string | null;
    email: string;
  };
}

const timeZone = 'America/Los_Angeles';

const SimplePasswordInput = memo(({
  initialValue = '',
  onPasswordChange,
  error
}: {
  initialValue?: string;
  onPasswordChange: (value: string) => void;
  error: boolean;
}) => {
  const [localValue, setLocalValue] = useState(initialValue);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onPasswordChange(newValue);
  }, [onPasswordChange]);

  return (
    <div className="space-y-2">
      <label htmlFor="password" className="block font-medium text-gray-700">
        Password Required
      </label>
      <input
        id="password"
        name="password"
        type="text"
        value={localValue}
        onChange={handleChange}
        className="w-full p-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {error && (
        <p className="text-red-500 text-sm">Incorrect password</p>
      )}
    </div>
  );
});

SimplePasswordInput.displayName = 'SimplePasswordInput';

const UncontrolledPasswordInput = ({
  onComplete,
  error
}: {
  onComplete: (value: string) => void;
  error: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBlur = () => {
    if (inputRef.current) {
      onComplete(inputRef.current.value);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor="password" className="block font-medium text-gray-700">
        Password Required
      </label>
      <input
        ref={inputRef}
        id="password"
        name="password"
        type="text"
        defaultValue=""
        onBlur={handleBlur}
        className="w-full p-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {error && (
        <p className="text-red-500 text-sm">Incorrect password</p>
      )}
    </div>
  );
};

const PasswordInput = forwardRef<
  { getPassword: () => string },
  { onPasswordSubmit: (value: string) => void }
>((props, ref) => {
  const { onPasswordSubmit } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const passwordValueRef = useRef<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    passwordValueRef.current = e.target.value;
  };

  // Expose the current password value through a method
  const getPassword = () => passwordValueRef.current;

  // Expose the method to parent through ref
  useImperativeHandle(ref, () => ({
    getPassword
  }));

  return (
    <div className="space-y-2">
      <label htmlFor="password" className="block font-medium text-gray-700">
        Password Required
      </label>
      <input
        ref={inputRef}
        id="password"
        name="password"
        type="password"
        onChange={handleChange}
        defaultValue={passwordValueRef.current}
        className="w-full p-3 border rounded-lg border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';

export default function SharedReservationPage({ params }: Props) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [isGoing, setIsGoing] = useState(true);
  const [hasPaid, setHasPaid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const passwordInputRef = useRef<{ getPassword: () => string }>(null);
  const resolvedParams = use(params);
  const shortUrl = resolvedParams.shortUrl;

  useEffect(() => {
    fetchReservation();
  }, [resolvedParams.shortUrl]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      localStorage.setItem('redirectAfterSignIn', window.location.pathname);
    }
  }, [status]);

  const fetchReservation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reservations/short/${resolvedParams.shortUrl}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reservation');
      }
      const data = await response.json();
      setReservation(data);
    } catch (error) {
      toast.error('Failed to fetch reservation details');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();
    const currentPath = window.location.pathname;
    await signIn('google', { 
      callbackUrl: currentPath,
    });
  };

  const handleJoin = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!session || status !== "authenticated") {
      handleSignIn(e);
      return;
    }

    // Get password value from ref
    const currentPassword = passwordInputRef.current?.getPassword() || '';

    // Validate password if required
    if (reservation?.password) {
      if (!currentPassword.trim()) {
        toast.error('Please enter the reservation password');
        return;
      }
      if (currentPassword !== reservation.password) {
        setPasswordError(true);
        toast.error('Incorrect password');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const joinResponse = await fetch(`/api/reservations/${reservation?.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isGoing,
          hasPaid,
          password: currentPassword,
        }),
      });

      if (!joinResponse.ok) {
        const error = await joinResponse.json();
        throw new Error(error.message || 'Failed to join reservation');
      }

      toast.success('Successfully joined the reservation');
      router.push(`/reservations/${reservation?.id}`);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to join the reservation');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = (newValue: string) => {
    setPassword(newValue);
    if (passwordError) {
      setPasswordError(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading reservation details...</div>;
  }

  if (!reservation) {
    return <div className="flex justify-center items-center min-h-screen">Reservation not found</div>;
  }

  const ReservationDetails = () => (
    <>
      <h1 className="text-2xl font-bold">{reservation.name}</h1>
      
      <div>
        <h2 className="text-lg font-semibold mb-2">{reservation.court.name}</h2>
        <p className="text-gray-600">{reservation.court.description}</p>
      </div>

      <div>
        <h3 className="font-medium text-gray-700">Date & Time (PT)</h3>
        <p>
          {formatInTimeZone(new Date(reservation.startTime), timeZone, 'EEEE, MMMM d, yyyy')}
          <br />
          {formatInTimeZone(new Date(reservation.startTime), timeZone, 'h:mm a')} -{' '}
          {formatInTimeZone(new Date(reservation.endTime), timeZone, 'h:mm a')}
        </p>
      </div>

      {reservation.description && (
        <div>
          <h3 className="font-medium text-gray-700">Notes:</h3>
          <p className="text-gray-600 whitespace-pre-wrap mt-2 bg-gray-50 p-3 rounded-lg">
            {reservation.description}
          </p>
        </div>
      )}

      {reservation.paymentRequired && (
        <div>
          <h3 className="font-medium text-gray-700">Payment Information</h3>
          <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-gray-800 whitespace-pre-wrap">{reservation.paymentInfo}</p>
          </div>
        </div>
      )}
    </>
  );

  const JoinSection = () => {
    if (status === 'loading') {
      return (
        <div className="text-center p-4">
          <div className="animate-pulse">Checking authentication status...</div>
        </div>
      );
    }

    if (status === 'unauthenticated') {
      return (
        <div className="space-y-4 bg-gray-50 p-6 rounded-lg text-center">
          <h3 className="font-medium text-gray-700">Sign in to Join Reservation</h3>
          <p className="text-gray-600">Please sign in with your account to join this reservation.</p>
          <button
            onClick={handleSignIn}
            className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center justify-center space-x-2"
          >
            <span>Sign in with Google</span>
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-700 mb-4">Your Response</h3>
        
        <div className="flex items-center justify-between">
          <label className="font-medium text-gray-700">Are you going?</label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setIsGoing(true)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isGoing
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Going
            </button>
            <button
              type="button"
              onClick={() => setIsGoing(false)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !isGoing
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Not Going
            </button>
          </div>
        </div>

        {reservation.paymentRequired && (
          <div className="flex items-center justify-between">
            <label className="font-medium text-gray-700">Payment Status</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setHasPaid(true)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  hasPaid
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Paid
              </button>
              <button
                type="button"
                onClick={() => setHasPaid(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  !hasPaid
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Not Paid
              </button>
            </div>
          </div>
        )}

        {reservation.password && (
          <PasswordInput
            ref={passwordInputRef}
            onPasswordSubmit={setPassword}
          />
        )}

        <button
          type="button"
          onClick={handleJoin}
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
        >
          {isSubmitting ? 'Joining...' : 'Join Reservation'}
        </button>
      </div>
    );
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <ReservationDetails />
          <JoinSection />
        </div>
      </div>
    </main>
  );
} 