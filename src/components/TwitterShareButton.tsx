'use client';

import React, { useState } from 'react';

type TwitterShareButtonProps = {
  className?: string;
  content: string;
  accountId?: string;
  onSuccess?: (tweetId: string) => void;
  onError?: (error: string) => void;
};

// Function to clean text for Twitter - removing ALL markdown and formatting
const cleanTextForTwitter = (text: string): string => {
  // First, check if the text starts with markdown indicator and remove it all
  if (text.startsWith('```')) {
    // Strip entire markdown code block including the content
    text = text.replace(/```[\s\S]*?```/g, '');
  }
  
  // Strip all possible markdown formatting
  text = text.replace(/^#+\s+/gm, '');               // Headings
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');       // Bold
  text = text.replace(/\*(.*?)\*/g, '$1');           // Italic
  text = text.replace(/__(.*?)__/g, '$1');           // Bold
  text = text.replace(/_(.*?)_/g, '$1');             // Italic
  text = text.replace(/~~(.*?)~~/g, '$1');           // Strikethrough
  text = text.replace(/`(.*?)`/g, '$1');             // Inline code
  text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');    // Links
  text = text.replace(/!\[(.*?)\]\(.*?\)/g, '$1');   // Images
  text = text.replace(/<[^>]*>/g, '');               // HTML tags
  text = text.replace(/^[\s-]*[-•*]\s+/gm, '• ');    // Bullet points
  text = text.replace(/^\d+\.\s+/gm, '• ');          // Numbered lists
  text = text.replace(/^>\s+/gm, '');                // Blockquotes
  text = text.replace(/\n{3,}/g, '\n\n');            // Multiple newlines
  
  // Replace emojis in markdown format with actual emojis
  text = text.replace(/:rocket:/g, '🚀');
  text = text.replace(/:sparkles:/g, '✨');
  text = text.replace(/:robot:/g, '🤖');
  
  // Trim extra whitespace and limit length
  text = text.trim();
  
  // Ensure tweet stays within Twitter's character limit (280)
  if (text.length > 280) {
    text = text.substring(0, 277) + '...';
  }
  
  return text;
};

export default function TwitterShareButton({
  className = '',
  content,
  accountId,
  onSuccess,
  onError
}: TwitterShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      console.log("Sharing content about Indo-Pak War of 1971");
      console.log("Content length:", content.length);
      
      // Use our simplified endpoint that's guaranteed to work
      const response = await fetch('/api/twitter/simple-content-tweet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: content,
          accountId: accountId 
        })
      });
      
      const data = await response.json();
      console.log("Tweet response:", data);
      
      if (data.success) {
        onSuccess?.(data.tweetId);
        alert(`Successfully posted to Twitter${data.accountUsername ? ` as @${data.accountUsername}` : ''}!`);
      } else {
        const errorMessage = data.details || data.error || 'Failed to post tweet';
        console.error("Tweet error:", errorMessage);
        alert(`Error: ${errorMessage}`);
        onError?.(errorMessage);
        
        // Handle authentication errors specifically
        if (response.status === 401) {
          if (confirm('Your Twitter session may have expired. Would you like to reconnect your account?')) {
            window.location.href = '/api/auth/twitter';
          }
        }
      }
    } catch (error) {
      console.error('Twitter share error:', error);
      alert('An unexpected error occurred while posting to Twitter.');
      onError?.('An unexpected error occurred');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className={`flex items-center justify-center gap-2 rounded-md bg-[#1da1f2] px-4 py-2 text-white hover:bg-[#0c85d0] disabled:opacity-70 ${className}`}
      style={{ minWidth: '140px' }}
    >
      <svg 
        width="16" 
        height="16" 
        fill="currentColor" 
        viewBox="0 0 24 24" 
        aria-hidden="true"
      >
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
      </svg>
      {isSharing ? 'Posting...' : 'Post to Twitter'}
    </button>
  );
} 