'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session && status !== 'loading') {
      router.push('/');
      return;
    }

    fetchCourts();
  }, [session, status, router]);

  const fetchCourts = async () => {
    try {
      const response = await fetch('/api/courts', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch courts');
      }
      const data = await response.json();
      setCourts(data);
      
      // Get unique locations
      const uniqueLocations = Array.from(new Set(data.map((court: Court) => court.location))) as string[];
      setLocations(uniqueLocations);
    } catch (error) {
      console.error('Error fetching courts:', error);
      toast.error('Failed to load courts');
    } finally {
      setIsLoading(false);
    }
  };

  // Implement virtual scrolling for better performance with large lists
  const [visibleCourts, setVisibleCourts] = useState<Court[]>([]);
  const [page, setPage] = useState(1);
  const courtsPerPage = 10;

  useEffect(() => {
    const start = (page - 1) * courtsPerPage;
    const end = start + courtsPerPage;
    setVisibleCourts(courts.slice(start, end));
  }, [courts, page]);

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  // Add intersection observer for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastCourtRef = useCallback((node: HTMLDivElement) => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && visibleCourts.length < courts.length) {
        loadMore();
      }
    });
    if (node) observerRef.current.observe(node);
  }, [visibleCourts.length, courts.length]);

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
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Pickleball Courts</h1>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleCourts.map((court, index) => (
              <div
                key={court.id}
                ref={index === visibleCourts.length - 1 ? lastCourtRef : null}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
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
                  <p className="text-gray-700 line-clamp-3 mb-4">{court.description}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/courts/${court.id}/reserve`);
                    }}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Choose Court
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => toast.success('Please email technickly@gmail.com with the court name, description, available times, etc.', {
              duration: 5000,
              position: 'bottom-center',
            })}
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
          >
            Request Court Addition
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