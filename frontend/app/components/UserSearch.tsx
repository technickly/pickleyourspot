'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { debounce } from 'lodash';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface UserSearchProps {
  onSelect: (user: User) => void;
  placeholder?: string;
  className?: string;
}

export default function UserSearch({ onSelect, placeholder = 'Search users...', className = '' }: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchUsers = debounce(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setUsers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
    }
    setLoading(false);
  }, 300);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    searchUsers(value);
  };

  const handleSelect = (user: User) => {
    onSelect(user);
    setQuery('');
    setIsOpen(false);
    setUsers([]);
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
      
      {loading && (
        <div className="absolute right-3 top-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        </div>
      )}

      {isOpen && users.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-3"
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
                {user.name && <div className="font-medium">{user.name}</div>}
                <div className="text-sm text-gray-600">{user.email}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 