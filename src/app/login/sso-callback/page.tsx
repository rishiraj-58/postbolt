'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';

export default function SSOCallback() {
  const searchParams = useSearchParams();
  const { session } = useClerk();
  
  useEffect(() => {
    // Get redirect URL from query parameters
    const redirectUrl = searchParams.get('redirect_url') || 
                       searchParams.get('after_sign_in_url') || 
                       '/dashboard';
    
    // Force a direct navigation to dashboard after a short delay
    setTimeout(() => {
      console.log('Redirecting to dashboard...');
      window.location.href = '/dashboard';
    }, 2000);
    
  }, [searchParams, session]);
  
  // Handle manual navigation to dashboard
  const handleNavigateToDashboard = () => {
    window.location.href = '/dashboard';
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Completing authentication...</h1>
        <p className="mb-6 text-gray-800">Please wait while we redirect you.</p>
        <button 
          onClick={handleNavigateToDashboard}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg shadow-md"
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
} 