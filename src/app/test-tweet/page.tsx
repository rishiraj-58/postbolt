'use client';

import React, { useState, useEffect } from 'react';
import TwitterShareButton from '../../components/TwitterShareButton';

export default function TestTweetPage() {
  const [content, setContent] = useState<string>(`
Here's my post about the Indo-Pak War of 1971:

The Indo-Pakistani War of 1971 was a military confrontation between India and Pakistan that occurred during the Bangladesh Liberation War. It began with preemptive Pakistani air strikes on 11 Indian airbases on December 3, 1971, and lasted just 13 days, making it one of the shortest wars in history.

The war resulted in the independence of East Pakistan, which became Bangladesh. India's decisive victory led to the largest military surrender since World War II, with approximately 93,000 Pakistani soldiers surrendering.

Key Facts:
• Started: December 3, 1971
• Ended: December 16, 1971 (13 days)
• Result: Decisive Indian victory, creation of Bangladesh
• Pakistani POWs: ~93,000 surrendered
  `.trim());
  
  const [twitterAccounts, setTwitterAccounts] = useState<Array<{id: string, username: string}>>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    // Check if user is connected to Twitter
    fetch('/api/twitter/accounts')
      .then(res => res.json())
      .then(data => {
        if (data.accounts && data.accounts.length > 0) {
          setTwitterAccounts(data.accounts);
          setSelectedAccountId(data.accounts.find((acc: any) => acc.isDefault)?.id || data.accounts[0].id);
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      })
      .catch(err => {
        console.error('Error fetching Twitter accounts:', err);
        setIsConnected(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Test Tweet - Indo-Pak War 1971</h1>
        
        {!isConnected ? (
          <div className="mb-6 bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 mb-2">You need to connect your Twitter account first.</p>
            <a 
              href="/api/auth/twitter" 
              className="bg-[#1da1f2] text-white px-4 py-2 rounded hover:bg-[#0c85d0] inline-block"
            >
              Connect Twitter
            </a>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-green-600 mb-2">
                Connected to Twitter as {twitterAccounts.find(acc => acc.id === selectedAccountId)?.username || 'unknown'}
              </p>
              
              {twitterAccounts.length > 1 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Twitter Account:
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    {twitterAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        @{account.username}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </>
        )}
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content about Indo-Pak War 1971:
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
          <p className="text-sm text-gray-500 mt-1">
            Character count: {content.length} 
            {content.length > 280 && (
              <span className="text-red-500"> (Will be truncated to fit Twitter's 280 character limit)</span>
            )}
          </p>
        </div>
        
        {isConnected && (
          <div className="flex justify-end">
            <TwitterShareButton 
              content={content}
              accountId={selectedAccountId}
              onSuccess={(tweetId) => {
                console.log("Tweet posted with ID:", tweetId);
              }}
              onError={(error) => {
                console.error("Error posting tweet:", error);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
} 