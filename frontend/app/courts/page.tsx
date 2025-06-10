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
  city: string;
  state: string;
  location: string;
}

export default function CourtsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('San Francisco, CA');
  const [locations, setLocations] = useState<string[]>(['San Francisco, CA']);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    if (!session && status !== 'loading') {
      router.push('/');
      return;
    }

    fetchCourts();
  }, [session, status, router]);

  const fetchCourts = async () => {
    try {
      const response = await fetch('/api/courts');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCourts(data);
      
      // Get unique locations
      const uniqueLocations = Array.from(new Set(data.map((court: Court) => court.location))) as string[];
      setLocations(uniqueLocations);
    } catch (error) {
      console.error('Error fetching courts:', error);
      toast.error('Failed to fetch courts');
    }
  };

  const handleRequestNewCourt = () => {
    setShowRequestModal(true);
  };

  const handleCloseModal = () => {
    setShowRequestModal(false);
  };

  const handleSubmitRequest = () => {
    toast.success('Thank you for your request! We will review it and get back to you.');
    setShowRequestModal(false);
  };

  const filteredCourts = courts.filter(court => court.location === selectedLocation);

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div>
            <h1 className="text-3xl font-bold">Available Courts</h1>
            <p className="text-gray-600 mt-2">Select a court you previously booked a reservation for</p>
          </div>
          
          <div className="mt-6">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Location
            </label>
            <select
              id="location"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full md:w-64 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourts.map((court) => (
            <div
              key={court.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/courts/${court.id}/reserve`)}
            >
              <div className="relative h-48">
                <Image
                  src={court.imageUrl}
                  alt={court.name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2">{court.name}</h2>
                <p className="text-gray-600 text-sm mb-2">{court.location}</p>
                <p className="text-gray-700 line-clamp-3">{court.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={handleRequestNewCourt}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <span>Request Unavailable Court</span>
          </button>
        </div>

        {showRequestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full">
              <h2 className="text-2xl font-bold mb-4">Request New Court</h2>
              <p className="text-gray-600 mb-4">
                Please enter the court details below and we will look into adding it to our system.
              </p>
              <textarea
                className="w-full p-3 border rounded-lg mb-4 h-32"
                placeholder="Please enter Court, Court Description, Available times, City and State in this box and we will look into adding it, thanks!"
              />
              <div className="flex justify-end gap-4">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequest}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 