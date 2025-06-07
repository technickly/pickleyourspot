import React from 'react';
import Image from 'next/image';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-ping"></div>
          <div className="absolute inset-0 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
          <Image
            src="/logo.png"
            alt="Pickle Your Spot"
            width={48}
            height={48}
            className="absolute inset-0 m-auto"
          />
        </div>
        <p className="text-gray-600 animate-pulse">Loading...</p>
      </div>
    </div>
  );
} 