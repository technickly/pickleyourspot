'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface PageProps {
  params: Promise<{
    shortUrl: string;
  }>;
}

export default function ShortUrlRedirect({ params }: PageProps) {
  const router = useRouter();
  const { shortUrl } = React.use(params);

  useEffect(() => {
    const fetchReservationId = async () => {
      try {
        const response = await fetch(`/api/reservations/short/${shortUrl}`);
        if (!response.ok) {
          throw new Error('Reservation not found');
        }
        const data = await response.json();
        router.push(`/reservations/${data.id}`);
      } catch (error) {
        toast.error('Invalid or expired reservation link');
        router.push('/');
      }
    };

    fetchReservationId();
  }, [shortUrl, router]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading reservation...</p>
      </div>
    </div>
  );
} 