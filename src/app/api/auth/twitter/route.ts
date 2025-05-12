import { NextRequest, NextResponse } from 'next/server';
import { getTwitterAuthUrl } from '../../../../lib/twitter-auth';
import { cookies } from 'next/headers';

export async function GET(_request: NextRequest) {
  try {
    const { url, codeVerifier, state } = await getTwitterAuthUrl();
    
    // Store the code verifier and state in cookies
    const response = NextResponse.redirect(url);
    
    response.cookies.set('twitter_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 // 1 hour
    });
    
    response.cookies.set('twitter_auth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 // 1 hour
    });
    
    return response;
  } catch (error) {
    console.error('Twitter auth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=twitter_auth_error`);
  }
} 