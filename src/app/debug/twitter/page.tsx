'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface TwitterAccount {
  id: string;
  twitterId: string;
  username: string | null;
  name: string | null;
  profilePic: string | null;
  isDefault: boolean;
  accessToken: boolean;
  updatedAt: string;
}

interface DebugInfo {
  userProfile: {
    id: string;
    email: string;
    name: string | null;
  };
  twitter: {
    accounts: TwitterAccount[];
    currentId: string | null;
    hasToken: boolean;
    tokenStatus: string;
    profileInfo: any | null;
  };
}

interface TweetResponse {
  status?: number;
  statusText?: string;
  data?: any;
  error?: string;
}

export default function TwitterDebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testTweet, setTestTweet] = useState('This is a test tweet from PostBolt! ' + new Date().toISOString());
  const [tweetResponse, setTweetResponse] = useState<TweetResponse | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const fetchDebugInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/twitter/debug');
      const data = await response.json();
      
      if (response.ok) {
        setDebugInfo(data);
        // Set default selected account if available
        if (data.twitter.accounts && data.twitter.accounts.length > 0) {
          const defaultAccount = data.twitter.accounts.find((acc: TwitterAccount) => acc.isDefault);
          setSelectedAccountId(defaultAccount?.id || data.twitter.accounts[0].id);
        }
      } else {
        setError(data.error || 'Failed to fetch debug info');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`An error occurred while fetching debug info: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestTweet = async () => {
    try {
      setTweetResponse(null);
      const response = await fetch('/api/twitter/tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: testTweet,
          accountId: selectedAccountId 
        })
      });
      
      const data = await response.json();
      setTweetResponse({
        status: response.status,
        statusText: response.statusText,
        data
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setTweetResponse({
        error: errorMessage
      });
    }
  };

  if (loading) {
    return <div className="p-4">Loading Twitter debug information...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <Link href="/dashboard" className="text-blue-600 hover:underline">Return to Dashboard</Link>
      </div>
    );
  }

  if (!debugInfo) {
    return <div className="p-4">No debug information available</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Twitter Debug Information</h1>
      
      <div className="mb-8">
        <Link href="/dashboard" className="text-blue-600 hover:underline">Return to Dashboard</Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-3">User Information</h2>
          <pre className="bg-gray-100 p-3 rounded overflow-auto text-sm max-h-[200px]">
            {JSON.stringify(debugInfo.userProfile, null, 2)}
          </pre>
        </div>
        
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-3">Twitter Session</h2>
          <div className="mb-3">
            <div><strong>Current Twitter ID:</strong> {debugInfo.twitter.currentId || 'None'}</div>
            <div><strong>Has Token:</strong> {debugInfo.twitter.hasToken ? 'Yes' : 'No'}</div>
            <div><strong>Token Status:</strong> {debugInfo.twitter.tokenStatus}</div>
          </div>
          
          {debugInfo.twitter.profileInfo && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Profile Info:</h3>
              <pre className="bg-gray-100 p-3 rounded overflow-auto text-sm max-h-[200px]">
                {JSON.stringify(debugInfo.twitter.profileInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <div className="bg-white shadow rounded p-4 md:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Twitter Accounts ({debugInfo.twitter.accounts.length})</h2>
          
          {debugInfo.twitter.accounts.length === 0 ? (
            <div className="py-2">
              <p>No Twitter accounts connected.</p>
              <Link href="/api/auth/twitter" className="text-blue-600 hover:underline">
                Connect Twitter Account
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {debugInfo.twitter.accounts.map((account: TwitterAccount) => (
                <div key={account.id} className="border rounded p-3 flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {account.profilePic && (
                      <div className="h-10 w-10 rounded-full overflow-hidden relative">
                        <Image
                          src={account.profilePic}
                          alt={account.username || 'Twitter'}
                          width={40}
                          height={40}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium">{account.name || 'Unknown'}</div>
                    <div className="text-sm text-gray-600">@{account.username || 'unknown'}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${account.isDefault ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {account.isDefault ? 'Default Account' : 'Secondary Account'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${account.accessToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {account.accessToken ? 'Has Token' : 'Missing Token'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ID: {account.twitterId} • Updated: {new Date(account.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {debugInfo.twitter.accounts.length > 0 && (
          <div className="bg-white shadow rounded p-4 md:col-span-2">
            <h2 className="text-lg font-semibold mb-3">Test Tweet</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Twitter Account
                </label>
                <select 
                  className="border rounded p-2 w-full"
                  value={selectedAccountId || ''}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                >
                  {debugInfo.twitter.accounts.map((account: TwitterAccount) => (
                    <option key={account.id} value={account.id}>
                      {account.name} (@{account.username})
                      {account.isDefault ? ' (Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tweet Content
                </label>
                <textarea
                  className="border rounded p-2 w-full"
                  rows={3}
                  value={testTweet}
                  onChange={(e) => setTestTweet(e.target.value)}
                />
              </div>
              
              <button
                onClick={handleSendTestTweet}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Send Test Tweet
              </button>
              
              {tweetResponse && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Response:</h3>
                  <pre className="bg-gray-100 p-3 rounded overflow-auto text-sm max-h-[200px]">
                    {JSON.stringify(tweetResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 