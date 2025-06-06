import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useDebounce } from '@/lib/hooks';

interface User {
  email: string;
  name: string | null;
  image: string | null;
}

interface Props {
  onSelect: (user: User) => void;
  selectedUsers: User[];
  placeholder?: string;
}

export default function UserSearch({ onSelect, selectedUsers, placeholder = 'Search users...' }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (!response.ok) throw new Error('Failed to search users');
        const data = await response.json();
        
        // Filter out already selected users
        const filteredResults = data.filter(
          (user: User) => !selectedUsers.some(selected => selected.email === user.email)
        );
        
        setResults(filteredResults);
      } catch (error) {
        console.error('Error searching users:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    searchUsers();
  }, [debouncedQuery, selectedUsers]);

  const handleSelect = (user: User) => {
    onSelect(user);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {isOpen && (query.trim() || loading) && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : results.length > 0 ? (
            <ul>
              {results.map((user) => (
                <li
                  key={user.email}
                  onClick={() => handleSelect(user)}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                >
                  {user.image && (
                    <Image
                      src={user.image}
                      alt={user.name || user.email}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <div>
                    {user.name && (
                      <div className="font-medium">{user.name}</div>
                    )}
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : query.trim() ? (
            <div className="p-4 text-center text-gray-500">No users found</div>
          ) : null}
        </div>
      )}
    </div>
  );
} 