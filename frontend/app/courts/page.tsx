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

// Add helper function to convert URLs to clickable links
const convertUrlsToLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${url}</a>`);
};

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Pickleball Courts</h1>
          <div className="flex items-center space-x-4">
            <label htmlFor="location" className="text-gray-700 font-medium">Filter by Location:</label>
            <select
              id="location"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>
        </div>
        
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
            {filteredCourts.map((court, index) => (
              <div
                key={court.id}
                ref={index === filteredCourts.length - 1 ? lastCourtRef : null}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative h-48">
                  <Image
                    src={court.imageUrl || '/images/default-court.jpg'}
                    alt={court.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4 flex flex-col h-[200px]">
                  <h3 className="text-xl font-semibold mb-2">{court.name}</h3>
                  <p 
                    className="text-gray-600 mb-4 flex-grow"
                    dangerouslySetInnerHTML={{ __html: convertUrlsToLinks(court.description) }}
                  />
                  <button
                    onClick={() => router.push(`/courts/${court.id}/reserve`)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors duration-300 cursor-pointer"
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
            onClick={handleRequestNewCourt}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium shadow-lg hover:shadow-xl"
          >
            Request Additional Court
          </button>
        </div>

        {showRequestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-8 max-w-2xl w-full relative shadow-2xl">
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-3xl font-bold mb-6 text-center">Request New Court</h2>
              <p className="text-gray-600 mb-6 text-center text-lg">
                Please provide the details of the court you'd like to add to our system.
              </p>
              <textarea
                className="w-full p-4 border-2 border-gray-200 rounded-lg mb-6 h-40 text-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                placeholder="Please include:
• Court name
• Location (address)
• Available times
• Any additional details"
              />
              <div className="flex justify-center gap-4">
                <button
                  onClick={handleCloseModal}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequest}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium shadow-md hover:shadow-lg transition-all"
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