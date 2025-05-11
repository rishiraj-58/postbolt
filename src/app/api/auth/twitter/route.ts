import { NextRequest, NextResponse } from 'next/server';
import { getTwitterAuthUrl } from '../../../../lib/twitter-auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Generate Twitter auth URL with PKCE
    const { url, codeVerifier, state } = await getTwitterAuthUrl();
    
    // Store the code verifier and state in a cookie to use later in the callback
    const response = NextResponse.redirect(url);
    
    // Set a cookie with the code verifier
    response.cookies.set('twitter_code_verifier', codeVerifier, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 // 1 hour
    });
    
    // Store the state for CSRF protection
    response.cookies.set('twitter_auth_state', state, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 // 1 hour
    });
    
    // Redirect to Twitter authorization page
    return response;
  } catch (error) {
    console.error('Twitter auth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?error=twitter_auth_error`);
  }
} 