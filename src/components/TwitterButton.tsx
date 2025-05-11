'use client';

import React, { useState } from 'react';

type TwitterButtonProps = {
  className?: string;
  label?: string;
};

export default function TwitterButton({ className = '', label = 'Connect Twitter' }: TwitterButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = () => {
    setIsLoading(true);
    // Redirect to Twitter OAuth endpoint
    window.location.href = '/api/auth/twitter';
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={handleConnect}
        disabled={isLoading}
        className={`flex items-center justify-center gap-3 rounded-md bg-[#1da1f2] px-4 py-2 text-white hover:bg-[#0c85d0] disabled:opacity-70 ${className}`}
      >
        <svg 
          width="20" 
          height="20" 
          fill="currentColor" 
          viewBox="0 0 24 24" 
          aria-hidden="true"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
        </svg>
        {isLoading ? 'Connecting...' : label}
      </button>
      
      {error && (
        <div className="mt-2 text-red-600 text-sm">{error}</div>
      )}
    </div>
  );
} 