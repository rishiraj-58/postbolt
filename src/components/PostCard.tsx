'use client';

import React, { useState } from 'react';
import LinkedInShareButton from './LinkedInShareButton';
import TwitterShareButton from './TwitterShareButton';

type PostCardProps = {
  post: string;
  onCopy?: () => void;
  showLinkedInShare?: boolean;
  showTwitterShare?: boolean;
  linkedinAccountId?: string;
  twitterAccountId?: string;
};

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onCopy, 
  showLinkedInShare = false,
  showTwitterShare = false,
  linkedinAccountId,
  twitterAccountId
}) => {
  const [linkedInShareSuccess, setLinkedInShareSuccess] = useState(false);
  const [twitterShareSuccess, setTwitterShareSuccess] = useState(false);
  const [shareError, setShareError] = useState('');

  // Debug log for visibility of buttons
  console.log("PostCard props:", { showLinkedInShare, showTwitterShare, linkedinAccountId, twitterAccountId });

  const handleLinkedInShareSuccess = (_postId: string) => {
    setLinkedInShareSuccess(true);
    setShareError('');
    setTimeout(() => setLinkedInShareSuccess(false), 3000);
  };

  const handleTwitterShareSuccess = (_tweetId: string) => {
    setTwitterShareSuccess(true);
    setShareError('');
    setTimeout(() => setTwitterShareSuccess(false), 3000);
  };

  const handleShareError = (error: string) => {
    setShareError(error);
    setTimeout(() => setShareError(''), 3000);
  };

  // Check if we need to show any social share buttons
  const showSocialButtons = showLinkedInShare || showTwitterShare;

  const handleLinkedInShare = async (_postId: string) => {
    if (!linkedinAccountId) {
      alert('Please connect your LinkedIn account first');
      return;
    }
    window.location.href = `/api/linkedin/share?content=${encodeURIComponent(post)}&accountId=${linkedinAccountId}`;
  };

  const handleTwitterShare = async (_tweetId: string) => {
    if (!twitterAccountId) {
      alert('Please connect your Twitter account first');
      return;
    }
    // ... rest of the code ...
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 bg-gray-50 rounded shadow flex flex-col gap-2 mt-4">
      <div className="whitespace-pre-line text-gray-800">{post}</div>
      <div className={`flex mt-3 flex-wrap gap-2 ${showSocialButtons ? 'justify-between' : 'justify-end'}`}>
        <div className="flex gap-2">
          {showLinkedInShare && (
            <LinkedInShareButton 
              content={post} 
              accountId={linkedinAccountId}
              onSuccess={handleLinkedInShareSuccess}
              onError={handleShareError}
            />
          )}
          {showTwitterShare && (
            <TwitterShareButton 
              content={post} 
              accountId={twitterAccountId}
              onSuccess={handleTwitterShareSuccess}
              onError={handleShareError}
            />
          )}
        </div>
        <button
          className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition text-sm"
          onClick={onCopy}
        >
          Copy
        </button>
      </div>
      {linkedInShareSuccess && (
        <div className="mt-2 text-green-600 text-sm">Successfully shared to LinkedIn!</div>
      )}
      {twitterShareSuccess && (
        <div className="mt-2 text-green-600 text-sm">Successfully posted to Twitter!</div>
      )}
      {shareError && (
        <div className="mt-2 text-red-600 text-sm">{shareError}</div>
      )}
    </div>
  );
};

export default PostCard; 