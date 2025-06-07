import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface User {
  name: string | null;
  email: string;
  image: string | null;
}

interface Props {
  onSelect: (email: string) => Promise<void>;
  selectedUsers: { email: string }[];
  placeholder?: string;
}

export default function UserSearch({ onSelect, selectedUsers, placeholder }: Props) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const searchUsers = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Failed to search users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to handle debounced search
  useEffect(() => {
    searchUsers(debouncedQuery);
  }, [debouncedQuery]);

  const handleSelect = async (email: string) => {
    await onSelect(email);
    setQuery('');
    setUsers([]);
  };

  const isUserSelected = (email: string) => {
    return selectedUsers.some(user => user.email === email);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder || "Search users..."}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {isLoading && (
        <div className="absolute right-3 top-2.5">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        </div>
      )}

      {users.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto">
          {users.map((user) => {
            const isSelected = isUserSelected(user.email);
            return (
              <button
                key={user.email}
                onClick={() => !isSelected && handleSelect(user.email)}
                disabled={isSelected}
                className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 ${
                  isSelected ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              >
                {user.image && (
                  <img
                    src={user.image}
                    alt={user.name || user.email}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div>
                  <div className="font-medium">{user.name || user.email}</div>
                  {user.name && <div className="text-sm text-gray-500">{user.email}</div>}
                </div>
                {isSelected && (
                  <span className="ml-auto text-sm text-gray-500">Already added</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
} 