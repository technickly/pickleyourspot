'use client';

import { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FiFilter, FiX } from 'react-icons/fi';

interface FilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  courts: { id: string; name: string }[];
}

export interface FilterOptions {
  status: string[];
  courts: string[];
  date: Date | null;
}

export default function ReservationFilters({ onFilterChange, courts }: FilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    courts: [],
    date: null,
  });

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'past', label: 'Past' },
  ];

  const handleStatusChange = (status: string) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    
    const newFilters = { ...filters, status: newStatuses };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCourtChange = (courtId: string) => {
    const newCourts = filters.courts.includes(courtId)
      ? filters.courts.filter(c => c !== courtId)
      : [...filters.courts, courtId];
    
    const newFilters = { ...filters, courts: newCourts };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateChange = (date: Date | null) => {
    const newFilters = { ...filters, date };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const newFilters = {
      status: [],
      courts: [],
      date: null,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const hasActiveFilters = filters.status.length > 0 || filters.courts.length > 0 || filters.date !== null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <FiFilter className="h-5 w-5" />
          Filter Reservations
          {hasActiveFilters && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {filters.status.length + filters.courts.length + (filters.date ? 1 : 0)}
            </span>
          )}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-gray-600 hover:text-gray-800 text-sm flex items-center gap-1"
          >
            <FiX className="h-4 w-4" />
            Clear all
          </button>
        )}
      </div>

      {isOpen && (
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Status</h3>
              <div className="space-y-2">
                {statusOptions.map(option => (
                  <label key={option.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(option.value)}
                      onChange={() => handleStatusChange(option.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Court Filter */}
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Courts</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {courts.map(court => (
                  <label key={court.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.courts.includes(court.id)}
                      onChange={() => handleCourtChange(court.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{court.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Filter */}
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Date</h3>
              <DatePicker
                selected={filters.date}
                onChange={handleDateChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholderText="Select a date"
                isClearable
                dateFormat="MMM d, yyyy"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 