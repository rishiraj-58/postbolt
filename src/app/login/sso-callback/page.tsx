'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SSOCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      console.error('SSO error:', error);
      router.push('/login?error=sso_error');
      return;
    }

    if (!code) {
      console.error('No code received from SSO provider');
      router.push('/login?error=no_code');
      return;
    }

    // Handle the SSO callback
    const handleCallback = async () => {
      try {
        const response = await fetch('/api/auth/sso/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          throw new Error('Failed to process SSO callback');
        }

        router.push('/dashboard');
      } catch (error) {
        console.error('Error processing SSO callback:', error);
        router.push('/login?error=callback_error');
      }
    };

    handleCallback();
  }, [code, error, router]);

  return <div>Processing SSO callback...</div>;
}

export default function SSOCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SSOCallbackContent />
    </Suspense>
  );
} 