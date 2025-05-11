'use client';

import React, { useState } from 'react';

type LinkedInShareButtonProps = {
  className?: string;
  content: string;
  accountId?: string;
  onSuccess?: (postId: string) => void;
  onError?: (error: string) => void;
};

export default function LinkedInShareButton({
  className = '',
  content,
  accountId,
  onSuccess,
  onError
}: LinkedInShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    
    try {
      const response = await fetch('/api/linkedin/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, accountId }),
      });

      const data = await response.json();
      
      if (response.ok) {
        onSuccess?.(data.postId);
        alert(`Successfully shared to LinkedIn${data.accountName ? ` as ${data.accountName}` : ''}!`);
      } else {
        // Handle authentication errors specifically
        if (response.status === 401) {
          // Redirect to LinkedIn auth
          alert('Please sign in with LinkedIn to share posts.');
          window.location.href = '/api/auth/linkedin';
          return;
        }
        
        // Handle permission errors
        if (data.details && (
          data.details.includes('w_member_social permission') || 
          data.details.includes('Not enough permissions') ||
          data.details.includes('ugcPosts.CREATE'))) {
          
          if (confirm('LinkedIn requires additional permissions to share posts. Would you like to disconnect and reconnect your LinkedIn account to grant these permissions?')) {
            window.location.href = '/api/auth/linkedin/disconnect';
          }
          return;
        }
        
        // Show detailed error message
        const errorMessage = data.details || data.error || 'Failed to share to LinkedIn';
        alert(`Error: ${errorMessage}`);
        onError?.(errorMessage);
      }
    } catch (error) {
      console.error('LinkedIn share error:', error);
      alert('An unexpected error occurred while sharing to LinkedIn.');
      onError?.('An unexpected error occurred');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className={`flex items-center justify-center gap-2 rounded-md bg-[#0A66C2] px-4 py-2 text-white hover:bg-[#004182] disabled:opacity-70 ${className}`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M17.0409 17.0413H14.0997V12.4012C14.0997 11.2938 14.0765 9.87131 12.5574 9.87131C11.0143 9.87131 10.7889 11.0751 10.7889 12.3209V17.0413H7.84772V7.49835H10.6698V8.80131H10.7156C11.1039 8.05506 12.1043 7.26756 13.5783 7.26756C16.5623 7.26756 17.0416 9.23506 17.0416 11.8051V17.0413H17.0409ZM4.44934 6.19506C3.49934 6.19506 2.73559 5.42756 2.73559 4.48131C2.73559 3.53506 3.49997 2.76756 4.44934 2.76756C5.39497 2.76756 6.16247 3.53506 6.16247 4.48131C6.16247 5.42756 5.39434 6.19506 4.44934 6.19506ZM5.92434 17.0413H2.97372V7.49835H5.92434V17.0413ZM18.5197 0.00131271H1.47372C0.665591 -0.00743729 0.00559097 0.63631 0.000591003 1.44506V18.5551C0.00559097 19.3645 0.665591 20.0082 1.47372 19.9995H18.5197C19.3297 20.0095 19.993 19.3651 19.9997 18.5551V1.44444C19.9923 0.635062 19.3297 -0.00868729 18.5197 0.000687271"
          fill="white"
        />
      </svg>
      {isSharing ? 'Sharing...' : 'Share on LinkedIn'}
    </button>
  );
} 