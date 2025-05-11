import { NextRequest, NextResponse } from 'next/server';
import { getLinkedInAuthUrl } from '../../../../lib/linkedin-auth';

export async function GET(request: NextRequest) {
  try {
    // Generate LinkedIn auth URL
    const authUrl = getLinkedInAuthUrl();
    
    // Redirect to LinkedIn authorization page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('LinkedIn auth error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=linkedin_error`);
  }
} 