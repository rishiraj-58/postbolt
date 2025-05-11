'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/login');
    }
  }, [isSignedIn, router]);

  return (
    <div className="min-h-screen bg-gray-100">
      {children}
    </div>
  );
};

export default DashboardLayout; 