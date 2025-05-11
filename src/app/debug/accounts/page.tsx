'use client';

import React, { useEffect, useState } from 'react';
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

export default function DebugAccountsPage() {
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/debug/linkedin-info');
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8">Loading account information...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  if (!data) {
    return <div className="p-8">No account data found.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Account Debug Information</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Account */}
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">User Account</h2>
          <div className="flex items-center mb-4">
            {data.user.profilePic && (
              <div className="relative w-16 h-16 rounded-full overflow-hidden mr-4">
                <Image
                  src={data.user.profilePic}
                  alt="User Profile"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <div className="font-medium">{data.user.name || 'No name'}</div>
              <div className="text-gray-600">{data.user.email || 'No email'}</div>
              <div className="text-xs text-gray-500 mt-1">ID: {data.user.id}</div>
            </div>
          </div>
        </div>

        {/* Current LinkedIn Info */}
        <div className="border rounded-lg p-6 bg-blue-50">
          <h2 className="text-xl font-semibold mb-4">Current LinkedIn API Info</h2>
          {data.currentLinkedInInfo ? (
            <div>
              <div className="flex items-center mb-4">
                {data.currentLinkedInInfo.picture && (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden mr-4">
                    <Image
                      src={data.currentLinkedInInfo.picture}
                      alt="LinkedIn Profile"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <div className="font-medium">{data.currentLinkedInInfo.name || 'No name'}</div>
                  <div className="text-gray-600">{data.currentLinkedInInfo.email || 'No email'}</div>
                  <div className="text-xs text-gray-500 mt-1">Sub: {data.currentLinkedInInfo.sub}</div>
                </div>
              </div>
              <pre className="mt-4 text-xs bg-white p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(data.currentLinkedInInfo, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-gray-600">No current LinkedIn information available</div>
          )}
        </div>
      </div>

      {/* LinkedIn Accounts */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">LinkedIn Accounts ({data.linkedinAccounts.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.linkedinAccounts.map(account => (
            <div key={account.id} className={`border rounded-lg p-4 ${account.isDefault ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}>
              <div className="flex items-center">
                {account.profilePic && (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
                    <Image
                      src={account.profilePic}
                      alt={account.name || 'LinkedIn Profile'}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <div className="font-medium">{account.name || 'No name'}</div>
                  <div className="text-gray-600">{account.email || 'No email'}</div>
                  <div className="text-xs text-gray-500">ID: {account.linkedinSub}</div>
                  {account.isDefault && (
                    <div className="text-xs text-blue-600 mt-1 font-medium">Default Account</div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {data.linkedinAccounts.length === 0 && (
            <div className="text-gray-600 col-span-2">No LinkedIn accounts connected</div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <a href="/dashboard" className="text-blue-600 hover:underline">Return to Dashboard</a>
      </div>
    </div>
  );
} 