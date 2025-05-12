'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

export const dynamic = 'force-dynamic';

export default function DebugAccountsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<{
    linkedinAccounts: any[];
    twitterAccounts: any[];
  }>({ linkedinAccounts: [], twitterAccounts: [] });

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/login');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (isSignedIn) {
      fetch('/api/debug/accounts')
        .then(res => res.json())
        .then(data => {
          setAccounts(data);
        })
        .catch(error => {
          console.error('Error fetching accounts:', error);
        });
    }
  }, [isSignedIn]);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Accounts</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">LinkedIn Accounts</h2>
        {accounts.linkedinAccounts.map(account => (
          <div key={account.id} className="border p-4 mb-2 rounded">
            <p>Name: {account.name}</p>
            <p>Email: {account.email}</p>
            <p>LinkedIn Sub: {account.linkedinSub}</p>
            <p>Default: {account.isDefault ? 'Yes' : 'No'}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Twitter Accounts</h2>
        {accounts.twitterAccounts.map(account => (
          <div key={account.id} className="border p-4 mb-2 rounded">
            <p>Name: {account.name}</p>
            <p>Username: {account.username}</p>
            <p>Twitter ID: {account.twitterId}</p>
            <p>Default: {account.isDefault ? 'Yes' : 'No'}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 