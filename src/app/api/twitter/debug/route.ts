import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication with Clerk
    const authRequest = await auth();
    
    if (!authRequest || !authRequest.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get cookies for user identification
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    const currentTwitterId = cookieStore.get('twitter_id')?.value;
    const twitterToken = cookieStore.get('twitter_token')?.value;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found. Please sign in again.' }, { status: 401 });
    }
    
    // Fetch all Twitter accounts for the user
    const twitterAccounts = await prisma.twitterAccount.findMany({
      where: {
        userId: userId
      },
      select: {
        id: true,
        twitterId: true,
        username: true,
        name: true,
        profilePic: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
        // Mask the tokens for security
        accessToken: token => !!token,
        refreshToken: token => !!token
      }
    });
    
    // Get user profile
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true
      }
    });
    
    // Check token validity with a simple request to the Twitter API
    let tokenStatus = 'unknown';
    let profileInfo = null;
    
    if (twitterToken) {
      try {
        const response = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,description', {
          headers: {
            'Authorization': `Bearer ${twitterToken}`
          }
        });
        
        if (response.ok) {
          profileInfo = await response.json();
          tokenStatus = 'valid';
        } else {
          const errorData = await response.json().catch(() => null);
          tokenStatus = `invalid: ${response.status} ${response.statusText} ${JSON.stringify(errorData || {})}`;
        }
      } catch (error) {
        tokenStatus = `error: ${error.message}`;
      }
    }
    
    return NextResponse.json({
      userProfile,
      twitter: {
        accounts: twitterAccounts,
        currentId: currentTwitterId,
        hasToken: !!twitterToken,
        tokenStatus,
        profileInfo
      }
    });
  } catch (error) {
    console.error('Twitter debug error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Twitter debug info', details: error.message },
      { status: 500 }
    );
  }
} 