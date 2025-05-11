'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  // Simple layout that ensures the dashboard is accessible
  return (
    <div className="min-h-screen bg-gray-100">
      {children}
    </div>
  );
} 