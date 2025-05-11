import { redirect } from 'next/navigation';

// Twitter OAuth Constants
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID || '';
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET || '';
const TWITTER_API_KEY = process.env.TWITTER_API_KEY || '';
const TWITTER_API_KEY_SECRET = process.env.TWITTER_API_KEY_SECRET || '';

// Use the correct callback URL that matches what's registered in Twitter Developer Console
// This must match EXACTLY what's registered in your Twitter App settings
const TWITTER_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/twitter/callback`;

// Essential Twitter OAuth scopes
const TWITTER_SCOPE = 'tweet.read tweet.write users.read offline.access';

// Generate Twitter OAuth 2.0 URL with PKCE
export async function getTwitterAuthUrl() {
  // Log the values to help debug
  console.log('Twitter OAuth values:', {
    clientId: TWITTER_CLIENT_ID ? 'Set' : 'Not set',
    redirectUri: TWITTER_REDIRECT_URI
  });

  // Generate PKCE code challenge
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  const state = generateRandomState();
  
  // Build the authorization URL with proper encoding
  const authUrl = `https://twitter.com/i/oauth2/authorize?` +
    `response_type=code&` +
    `client_id=${encodeURIComponent(TWITTER_CLIENT_ID)}&` +
    `redirect_uri=${encodeURIComponent(TWITTER_REDIRECT_URI)}&` +
    `scope=${encodeURIComponent(TWITTER_SCOPE)}&` +
    `state=${encodeURIComponent(state)}&` +
    `code_challenge=${encodeURIComponent(codeChallenge)}&` +
    `code_challenge_method=S256`;
    
  console.log('Twitter Auth URL:', authUrl);
  
  return { url: authUrl, codeVerifier, state };
}

// Generate a random code verifier for PKCE (between 43-128 chars)
function generateCodeVerifier() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < 96; i++) { // Using 96 for a good length
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Generate a code challenge from the code verifier using SHA-256
async function generateCodeChallenge(codeVerifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  return base64UrlEncode(digest);
}

// Base64Url encoding for PKCE
function base64UrlEncode(buffer: ArrayBuffer) {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Generate a random state parameter for security (up to 500 chars)
function generateRandomState() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Exchange authorization code for tokens
export async function getTwitterTokens(code: string, codeVerifier: string) {
  const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
  
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', TWITTER_REDIRECT_URI);
  params.append('client_id', TWITTER_CLIENT_ID);
  params.append('code_verifier', codeVerifier);

  try {
    console.log('Token exchange parameters:', {
      code: code.substring(0, 10) + '...',
      redirectUri: TWITTER_REDIRECT_URI,
      codeVerifier: codeVerifier.substring(0, 10) + '...'
    });
    
    const headers: HeadersInit = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    
    // Add Authorization header only if client secret is provided (for confidential clients)
    if (TWITTER_CLIENT_SECRET) {
      const basicAuth = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64');
      headers['Authorization'] = `Basic ${basicAuth}`;
    }
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: headers,
      body: params.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Token exchange error response:', errorBody);
      throw new Error(`Twitter token exchange failed: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error exchanging Twitter code for tokens:', error);
    throw error;
  }
}

// Get user info using the access token
export async function getTwitterUserInfo(accessToken: string) {
  try {
    const response = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,name,username', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Twitter user info: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Twitter user info:', error);
    throw error;
  }
}

// Refresh an expired access token using the refresh token
export async function refreshTwitterToken(refreshToken: string) {
  const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
  
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);
  params.append('client_id', TWITTER_CLIENT_ID);

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    
    // Add Authorization header only if client secret is provided (for confidential clients)
    if (TWITTER_CLIENT_SECRET) {
      const basicAuth = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64');
      headers['Authorization'] = `Basic ${basicAuth}`;
    }
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: headers,
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh Twitter token: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error refreshing Twitter token:', error);
    throw error;
  }
}

// Direct authentication using the access token
export async function authenticateWithToken(accessToken: string) {
  try {
    // Get user info from Twitter
    const userInfo = await getTwitterUserInfo(accessToken);
    
    if (!userInfo || !userInfo.data || !userInfo.data.id) {
      throw new Error('Failed to get user information from Twitter');
    }
    
    return {
      success: true,
      userInfo: userInfo.data
    };
  } catch (error) {
    console.error('Error authenticating with token:', error);
    throw error;
  }
}

// Sign in with Twitter - redirect to Twitter auth URL
export async function signInWithTwitter() {
  const { url } = await getTwitterAuthUrl();
  redirect(url);
}

// Post a tweet using the access token
export async function postTweet(accessToken: string, text: string) {
  try {
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        `Twitter API error: ${response.status} ${response.statusText}${
          errorData ? ` - ${JSON.stringify(errorData)}` : ''
        }`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error posting tweet:', error);
    throw error;
  }
}