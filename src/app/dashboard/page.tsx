'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, useAuth, SignOutButton } from '@clerk/nextjs';
import Image from 'next/image';
import PostForm from '../../components/PostForm';
import PostCard from '../../components/PostCard';
import { getUserPosts } from '../../lib/posts';
import LinkedInButton from '../../components/LinkedInButton';
import TwitterButton from '../../components/TwitterButton';
import TwitterShareButton from '../../components/TwitterShareButton';

type UsageInfo = {
  postsGenerated: number;
  maxPosts: number;
  isPremium: boolean;
  postsRemaining: number;
};

type Post = {
  id: string;
  content: string;
  prompt: string;
  createdAt: Date;
};

type UserProfileData = {
  id: string;
  email: string;
  name: string | null;
  profilePic: string | null;
  linkedinConnected: boolean;
  twitterConnected: boolean;
  twitterUsername: string | null;
  linkedinAccounts: Array<{
    id: string;
    linkedinSub: string;
    name: string | null;
    email: string | null;
    profilePic: string | null;
    profileUrl: string | null;
    isDefault: boolean;
  }>;
  twitterAccounts: Array<{
    id: string;
    twitterId: string;
    username: string | null;
    name: string | null;
    profilePic: string | null;
    isDefault: boolean;
    isActive: boolean;
  }>;
};

const DashboardPage = () => {
  const [post, setPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'saved'>('generate');
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [savedPostsLoading, setSavedPostsLoading] = useState(false);
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [twitterConnected, setTwitterConnected] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/login');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    // Check URL parameters for notifications or errors
    const linkedInStatus = searchParams.get('linkedin');
    const twitterStatus = searchParams.get('twitter');
    const error = searchParams.get('error');
    
    if (linkedInStatus === 'connected') {
      setNotification('Successfully connected to LinkedIn!');
      // Clear the notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    } else if (twitterStatus === 'connected') {
      setNotification('Successfully connected to Twitter!');
      // Clear the notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    } else if (linkedInStatus === 'disconnected') {
      setNotification('Successfully disconnected from LinkedIn.');
      setTimeout(() => setNotification(null), 5000);
    } else if (twitterStatus === 'disconnected') {
      setNotification('Successfully disconnected from Twitter.');
      setTimeout(() => setNotification(null), 5000);
    } else if (error) {
      setNotification(`Error: ${error.replace(/_/g, ' ')}`);
      // Clear the notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    // Check if LinkedIn is connected by looking for the LinkedIn token cookie
    const linkedInToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('linkedin_token='));
    
    // Check if Twitter is connected by looking for the Twitter token cookie
    const twitterToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('twitter_token='));
    
    setLinkedInConnected(!!linkedInToken);
    setTwitterConnected(!!twitterToken);
    
    // If user is signed in, fetch their profile data from our database
    if (isSignedIn && user) {
      fetchUserProfile();
    }
  }, [isSignedIn, user]);

  useEffect(() => {
    if (isSignedIn && user && activeTab === 'saved') {
      loadSavedPosts();
    }
  }, [isSignedIn, user, activeTab]);

  const loadSavedPosts = useCallback(async () => {
    if (!user) return;
    
    setSavedPostsLoading(true);
    try {
      // Get the database user from Clerk's user ID
      const res = await fetch('/api/user');
      
      if (!res.ok) {
        console.error('Failed to fetch user data:', await res.text());
        throw new Error('Failed to fetch user data');
      }
      
      const data = await res.json();
      
      if (!data.id) {
        console.error('Could not find database user ID');
        setSavedPosts([]);
        return;
      }
      
      // Now fetch posts with the database user ID
      try {
        const posts = await getUserPosts(data.id);
        setSavedPosts(posts);
      } catch (postsError) {
        console.error('Error fetching posts:', postsError);
        setSavedPosts([]);
      }
    } catch (error) {
      console.error('Error loading saved posts:', error);
      setSavedPosts([]);
    } finally {
      setSavedPostsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isSignedIn && user) {
      loadSavedPosts();
    }
  }, [isSignedIn, user, loadSavedPosts]);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch('/api/user');
      
      if (!res.ok) {
        console.error('Failed to fetch user profile:', await res.text());
        return;
      }
      
      const data = await res.json();
      setUserProfile(data);
      
      // Also update connection status based on database info
      if (data.linkedinConnected) {
        setLinkedInConnected(true);
      }
      
      if (data.twitterConnected) {
        setTwitterConnected(true);
      }
      
      console.log("User profile loaded:", { 
        linkedinConnected: data.linkedinConnected, 
        twitterConnected: data.twitterConnected,
        twitterAccounts: data.twitterAccounts?.length || 0,
        linkedinAccounts: data.linkedinAccounts?.length || 0
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const handleGenerate = async (input: string) => {
    setLoading(true);
    setPost('');
    setCopied(false);
    setError(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setPost(data.post || '');
        setUsage(data.usage || null);
      } else {
        setPost(data.error || 'Error generating post.');
        setUsage(data.usage || null);
      }
    } catch (err) {
      setPost('Error generating post.');
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (post) {
      navigator.clipboard.writeText(post);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4 text-gray-800">Loading...</p>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">
      {/* Notification Banner */}
      {notification && (
        <div className={`py-2 px-4 text-center ${notification.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {notification}
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">PostBolt</h1>
          <div className="flex items-center gap-4">
            {/* User profile section */}
            <div className="flex items-center">
              {/* Show LinkedIn profile picture if available, otherwise fallback to user profile picture */}
              {linkedInConnected && userProfile?.linkedinAccounts && userProfile.linkedinAccounts.length > 0 && 
               userProfile.linkedinAccounts.find(account => account.isDefault)?.profilePic ? (
                <div className="h-8 w-8 rounded-full overflow-hidden relative mr-2">
                  <Image
                    src={userProfile.linkedinAccounts.find(account => account.isDefault)?.profilePic || '/default-avatar.png'}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="object-cover"
                    onError={(e) => {
                      // Fallback to a default avatar if profile image fails to load
                      e.currentTarget.src = '/default-avatar.png';
                    }}
                  />
                </div>
              ) : userProfile?.profilePic ? (
                <div className="h-8 w-8 rounded-full overflow-hidden relative mr-2">
                  <Image
                    src={userProfile.profilePic || '/default-avatar.png'}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="object-cover"
                    onError={(e) => {
                      // Fallback to a default avatar if profile image fails to load
                      e.currentTarget.src = '/default-avatar.png';
                    }}
                  />
                </div>
              ) : null}
              
              {/* Show LinkedIn name if available, otherwise fallback to user name */}
              <span className="text-sm text-gray-600">
                {linkedInConnected && userProfile?.linkedinAccounts && userProfile.linkedinAccounts.length > 0 && 
                 userProfile.linkedinAccounts.find(account => account.isDefault)?.name ? 
                 userProfile.linkedinAccounts.find(account => account.isDefault)?.name : 
                 userProfile?.name || 'User'}
              </span>
            
              {/* Social accounts section */}
              <div className="flex items-center ml-2 gap-1">
                {/* LinkedIn default account - now just showing a badge since we already show the profile pic/name above */}
                {linkedInConnected && userProfile?.linkedinAccounts && userProfile.linkedinAccounts.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs px-2 py-1 bg-[#0A66C2] text-white rounded">
                      LinkedIn
                    </span>
                  </div>
                )}

                {/* Twitter username */}
                {twitterConnected && userProfile?.twitterAccounts && userProfile.twitterAccounts.length > 0 && (
                  <div className="flex items-center gap-1">
                    {userProfile.twitterAccounts
                      .filter(account => account.isDefault || account.isActive)
                      .map(account => (
                        <div key={account.id} className="flex items-center">
                          {account.profilePic && (
                            <div className="h-5 w-5 rounded-full overflow-hidden relative">
                              <Image
                                src={account.profilePic}
                                alt={account.username || 'Twitter'}
                                width={20}
                                height={20}
                                className="object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/default-avatar.png';
                                }}
                              />
                            </div>
                          )}
                          <span className="ml-1 text-xs px-2 py-1 bg-[#1da1f2] text-white rounded">
                            @{account.username || 'Twitter'}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Reconnect button for server errors */}
              {linkedInConnected && searchParams.get('error') === 'server_error' && (
                <button 
                  onClick={() => window.location.href = '/api/auth/linkedin'}
                  className="ml-2 text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Reconnect LinkedIn
                </button>
              )}
              
              {/* Disconnect buttons */}
              <div className="ml-2 flex gap-1">
                {linkedInConnected && (
                  <button 
                    onClick={() => window.location.href = '/api/auth/linkedin/disconnect'}
                    className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Disconnect LinkedIn
                  </button>
                )}
                
                {twitterConnected && (
                  <button 
                    onClick={() => window.location.href = '/api/auth/twitter/disconnect'}
                    className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Disconnect Twitter
                  </button>
                )}
              </div>
            </div>

            <span className="text-gray-800">{user?.emailAddresses[0]?.emailAddress}</span>
            <SignOutButton>
              <button className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded">
                Logout
              </button>
            </SignOutButton>
          </div>
        </div>
      </header>

      {/* LinkedIn Connection Banner */}
      {!linkedInConnected && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center">
            <div className="text-blue-800 mb-3 sm:mb-0">
              <span className="font-medium">Connect LinkedIn</span> to share posts directly to your profile
            </div>
            <LinkedInButton label="Connect LinkedIn" className="text-sm" />
          </div>
        </div>
      )}

      {!twitterConnected && (
        <div className="bg-[#e8f5fd] border-b border-[#c8e5fd]">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center">
            <div className="text-[#1a91da] mb-3 sm:mb-0">
              <span className="font-medium">Connect Twitter</span> to post tweets directly from your dashboard
            </div>
            <TwitterButton label="Connect Twitter" className="text-sm" />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto">
          <div className="flex">
            <button
              className={`px-6 py-3 text-sm font-medium ${activeTab === 'generate' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('generate')}
            >
              Generate Posts
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${activeTab === 'saved' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('saved')}
            >
              Saved Posts
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center py-10">
        {/* Debug section for Twitter */}
        <div className="w-full max-w-xl mb-6 bg-gray-100 p-4 rounded">
          <h3 className="text-lg font-semibold mb-2">Twitter Connection Status</h3>
          <div>
            <p>Twitter Connected: {twitterConnected ? 'Yes' : 'No'}</p>
            <p>Cookie Status: {document.cookie.includes('twitter_token') ? 'Twitter token exists' : 'No Twitter token found'}</p>
            {userProfile?.twitterAccounts && (
              <p>Twitter Accounts: {userProfile.twitterAccounts.length}</p>
            )}
          </div>
          <div className="mt-2">
            <button 
              onClick={() => window.location.href = '/api/auth/twitter'}
              className="bg-[#1da1f2] text-white px-4 py-2 rounded hover:bg-[#0c85d0] mr-2"
            >
              Connect Twitter
            </button>
            <button
              onClick={() => {
                // Test post to Twitter
                if (twitterConnected && userProfile?.twitterAccounts && userProfile.twitterAccounts.length > 0) {
                  const defaultAccount = userProfile.twitterAccounts.find(acc => acc.isDefault);
                  const testPost = "This is a test tweet from PostBolt! " + new Date().toISOString();
                  
                  fetch('/api/twitter/tweet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      text: testPost,
                      accountId: defaultAccount?.id
                    })
                  })
                  .then(response => response.json())
                  .then(data => {
                    if (data.success) {
                      alert(`Test tweet posted successfully as @${data.accountUsername}!`);
                    } else {
                      alert(`Error posting tweet: ${data.error || 'Unknown error'}`);
                    }
                  })
                  .catch(err => {
                    alert(`Error: ${err.message}`);
                  });
                } else {
                  alert("Please connect to Twitter first");
                }
              }}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mr-2"
            >
              Test Tweet
            </button>
            <a 
              href="/test-tweet"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 inline-block"
            >
              Indo-Pak War Tweet
            </a>
          </div>
        </div>

        {activeTab === 'generate' ? (
          <>
            <h2 className="text-xl font-bold mb-6">Generate a Social Media Post</h2>
            <PostForm onSubmit={handleGenerate} usage={usage || undefined} />
            {loading && <div className="mt-4 text-blue-600">Generating...</div>}
            {post && <PostCard 
              post={post} 
              onCopy={handleCopy} 
              showLinkedInShare={linkedInConnected} 
              showTwitterShare={twitterConnected} 
              linkedinAccountId={userProfile?.linkedinAccounts?.find(acc => acc.isDefault)?.id}
              twitterAccountId={userProfile?.twitterAccounts?.find(acc => acc.isDefault)?.id}
            />}
            {copied && <div className="text-green-600 mt-2">Copied!</div>}
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-6">Your Saved Posts</h2>
            {savedPostsLoading ? (
              <div className="text-blue-600">Loading saved posts...</div>
            ) : savedPosts.length === 0 ? (
              <div className="text-gray-700">No saved posts yet.</div>
            ) : (
              <div className="w-full max-w-xl space-y-4">
                {savedPosts.map((post) => (
                  <div key={post.id} className="bg-white rounded shadow p-4">
                    <div className="text-sm text-gray-500 mb-2">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                    <div className="whitespace-pre-line mb-2">{post.content}</div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(post.content);
                          alert('Copied to clipboard!');
                        }}
                        className="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                      >
                        Copy
                      </button>
                      {linkedInConnected && userProfile?.linkedinAccounts && userProfile.linkedinAccounts.length > 0 && (
                        <button
                          onClick={() => {
                            const defaultAccount = userProfile?.linkedinAccounts?.find(acc => acc.isDefault);
                            window.location.href = `/api/linkedin/share?content=${encodeURIComponent(post.content)}${defaultAccount ? `&accountId=${defaultAccount.id}` : ''}`;
                          }}
                          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          Share on LinkedIn
                        </button>
                      )}
                      {twitterConnected && (
                        <TwitterShareButton
                          content={post.content}
                          className="text-sm px-3 py-1"
                          accountId={userProfile?.twitterAccounts?.find(acc => acc.isDefault)?.id}
                          onSuccess={() => alert('Successfully posted to Twitter!')}
                          onError={(error) => alert(`Error: ${error}`)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default DashboardPage; 