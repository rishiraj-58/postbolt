import { redirect } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

// LinkedIn OAuth Constants
const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '';
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || '';

// Use the correct callback URL that matches what's registered in LinkedIn Developer Console
// This must match EXACTLY what's registered in your LinkedIn App settings
const LINKEDIN_REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/api/auth/linkedin/callback';

// OpenID Connect scopes + w_member_social for sharing posts
const LINKEDIN_SCOPE = 'openid profile email w_member_social';

// Static access token for testing (will be used if no token is available in cookies)
export const STATIC_ACCESS_TOKEN = 'AQXWGGTotBPZg2f2a9jHVMRUWxsHgBTh-7yUGcY0ALpNCoiGx90lphabFtx1gaxKKJqiZRfw9Qn9GP_VCB5yWxXHYWAKoVqKCd42JmlO_tco5ulbeOv9mNaQHHTCiH5oozP6It3fRVYHkUKtl7S7bvOSEOGTrMGl5kR-Lixxn8fo4jmrnwALq5jL9cR0B7djJP0oh8cj8b_wqrTciFaY1_ETJ5CI2LeBOLLXvu5U-TULGfe39qn3QTw15k9Tf-wgceHlk6RXoH7Yug2gFAYnVFp8F8r51l3zkNuGnMCsBLiUeKTZelKlcAQ1CNR3oXDDz7BE8QSJ9Az2LKi7dI6Z8XQTD6-O_g';

// Generate LinkedIn OAuth URL with OpenID Connect scopes
export function getLinkedInAuthUrl() {
  // Log the values to help debug
  console.log('LinkedIn OAuth values:', {
    clientId: LINKEDIN_CLIENT_ID ? 'Set' : 'Not set',
    clientSecret: LINKEDIN_CLIENT_SECRET ? 'Set' : 'Not set',
    redirectUri: LINKEDIN_REDIRECT_URI
  });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINKEDIN_CLIENT_ID,
    redirect_uri: LINKEDIN_REDIRECT_URI,
    state: generateRandomState(),
    scope: LINKEDIN_SCOPE,
  });

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  console.log('LinkedIn Auth URL:', authUrl);
  
  return authUrl;
}

// Generate a random state parameter for security
function generateRandomState() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Exchange authorization code for tokens (will return both access_token and id_token)
export async function getLinkedInTokens(code: string) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: LINKEDIN_REDIRECT_URI,
    client_id: LINKEDIN_CLIENT_ID,
    client_secret: LINKEDIN_CLIENT_SECRET,
  });

  try {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      throw new Error(`LinkedIn token exchange failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error exchanging LinkedIn code for tokens:', error);
    throw error;
  }
}

// Get user info using the access token (userinfo endpoint as per OpenID Connect)
export async function getLinkedInUserInfo(accessToken: string) {
  try {
    const response = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch LinkedIn user info: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching LinkedIn user info:', error);
    throw error;
  }
}

// Direct authentication using the access token
export async function authenticateWithToken(accessToken: string) {
  try {
    // Get user info from LinkedIn
    const userInfo = await getLinkedInUserInfo(accessToken);
    
    if (!userInfo || !userInfo.sub) {
      throw new Error('Failed to get user information from LinkedIn');
    }
    
    return {
      success: true,
      userInfo
    };
  } catch (error) {
    console.error('Error authenticating with token:', error);
    throw error;
  }
}

// Decode ID token to get user information
export function decodeIdToken(idToken: string) {
  try {
    return jwtDecode(idToken);
  } catch (error) {
    console.error('Error decoding ID token:', error);
    throw error;
  }
}

// Sign in with LinkedIn - redirect to LinkedIn auth URL
export function signInWithLinkedIn() {
  const authUrl = getLinkedInAuthUrl();
  redirect(authUrl);
} 