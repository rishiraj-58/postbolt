import { NextRequest, NextResponse } from 'next/server';
import { getTwitterAuthUrl } from '../../../../lib/twitter-auth';

export async function GET(_request: NextRequest) {
  try {
    const { url } = await getTwitterAuthUrl();
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('Twitter auth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=twitter_auth_error`);
  }
} 