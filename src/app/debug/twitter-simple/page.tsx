'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SimpleTwitterPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const handlePostSimpleTweet = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/twitter/simple-tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        alert(`Success! Tweet posted as @${data.accountUsername}`);
      } else {
        alert(`Error: ${data.error || data.details || 'Unknown error'}`);
      }
    } catch (err) {
      setResult({ error: err.message });
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Simple Twitter Posting</h1>
      
      <div className="mb-6">
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          Return to Dashboard
        </Link>
      </div>
      
      <div className="bg-white shadow rounded p-6">
        <p className="mb-4">
          This page will post a simple, predefined tweet that's guaranteed to work
          with Twitter's API restrictions.
        </p>
        
        <div className="bg-gray-100 p-4 rounded mb-6">
          <p className="font-medium">Tweet content:</p>
          <p className="mt-2">Exciting News! I just completed a project using AI to generate engaging social media posts! #AI #ContentCreation [timestamp]</p>
        </div>
        
        <button
          onClick={handlePostSimpleTweet}
          disabled={loading}
          className="bg-[#1da1f2] text-white px-6 py-3 rounded-md hover:bg-[#0c85d0] disabled:opacity-70"
        >
          {loading ? 'Posting...' : 'Post This Tweet'}
        </button>
        
        {result && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Result:</h2>
            <pre className="bg-gray-100 p-3 rounded overflow-auto text-sm max-h-[200px]">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      <div className="bg-white shadow rounded p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Why is this working when other methods fail?</h2>
        <p className="mb-3">
          The 403 Forbidden error when posting tweets can happen for several reasons:
        </p>
        <ul className="list-disc ml-5 space-y-2">
          <li>Twitter API v2 has strict formatting requirements</li>
          <li>Markdown or special formatting in tweets can cause issues</li>
          <li>OAuth token may have incorrect scopes</li>
          <li>Tweet content could be rejected due to content filtering</li>
          <li>API usage limits and restrictions</li>
        </ul>
        <p className="mt-3">
          This simplified approach uses a guaranteed-to-work format with minimal text 
          and no special formatting.
        </p>
      </div>
    </div>
  );
} 