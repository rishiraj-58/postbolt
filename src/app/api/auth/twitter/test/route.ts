import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.TWITTER_CLIENT_ID || '';
  const clientSecret = process.env.TWITTER_CLIENT_SECRET || '';
  
  // Test encoding the credentials
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  // Test creating a token endpoint URL
  const redirectUri = 'http://localhost:3000/api/auth/twitter/callback';
  const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  
  return NextResponse.json({
    credentials: {
      clientId: clientId.substring(0, 10) + '...',
      clientSecret: clientSecret.substring(0, 5) + '...',
      basicAuth: basicAuth.substring(0, 10) + '...',
    },
    urls: {
      redirectUri,
      authUrl,
    }
  });
} 