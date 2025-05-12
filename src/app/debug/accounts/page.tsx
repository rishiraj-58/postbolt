'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Account {
  id: string;
  name: string | null;
  email: string | null;
  profilePic: string | null;
}

interface LinkedInAccount extends Account {
  linkedinSub: string;
  isDefault: boolean;
}

interface TwitterAccount extends Account {
  twitterId: string;
  username: string | null;
  isDefault: boolean;
  isActive: boolean;
}

interface UserData {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    profilePic: string | null;
  };
  linkedinAccounts: LinkedInAccount[];
  currentLinkedInInfo: any;
}

export const dynamic = 'force-dynamic';

export default function DebugAccountsPage() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<{
    linkedin: any[];
    twitter: any[];
  }>({ linkedin: [], twitter: [] });

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/login');
      return;
    }

    const fetchAccounts = async () => {
      try {
        const response = await fetch('/api/debug/accounts');
        const data = await response.json();
        setAccounts(data);
      } catch (error) {
        console.error('Error fetching accounts:', error);
      }
    };

    if (isSignedIn) {
      fetchAccounts();
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || !isSignedIn) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Accounts</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">LinkedIn Accounts</h2>
        <div className="space-y-4">
          {accounts.linkedin.map((account) => (
            <div key={account.id} className="border p-4 rounded">
              <p>Name: {account.name}</p>
              <p>Email: {account.email}</p>
              <p>LinkedIn Sub: {account.linkedinSub}</p>
              <p>Is Default: {account.isDefault ? 'Yes' : 'No'}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Twitter Accounts</h2>
        <div className="space-y-4">
          {accounts.twitter.map((account) => (
            <div key={account.id} className="border p-4 rounded">
              <p>Name: {account.name}</p>
              <p>Username: {account.username}</p>
              <p>Twitter ID: {account.twitterId}</p>
              <p>Is Default: {account.isDefault ? 'Yes' : 'No'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 