'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface Court {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

export default function CourtsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [courts, setCourts] = useState<Court[]>([]);

  useEffect(() => {
    if (!session && status !== 'loading') {
      router.push('/');
      return;
    }

    fetchCourts();
  }, [session, status, router]);

  const fetchCourts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courts`);
      const data = await response.json();
      setCourts(data);
    } catch (error) {
      toast.error('Failed to fetch courts');
    }
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Available Courts</h1>
          <p className="text-gray-600 mt-2">Select a court to make your reservation</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courts.map((court) => (
            <div
              key={court.id}
              className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-w-16 aspect-h-9 relative h-48">
                <Image
                  src={court.imageUrl}
                  alt={court.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority
                />
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{court.name}</h2>
                <p className="text-gray-600 mb-4">{court.description}</p>
                <button
                  onClick={() => router.push(`/courts/${court.id}/reserve`)}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Select Time Slot
                </button>
              </div>
            </div>
          ))}

          {courts.length === 0 && (
            <p className="col-span-full text-center text-gray-500 py-8">
              No courts available at the moment.
            </p>
          )}
        </div>
      </div>
    </main>
  );
} 