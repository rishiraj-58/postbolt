import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../../lib/prisma';
import { getTwitterUserInfo } from '../../../../lib/twitter-auth';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    const twitterToken = cookieStore.get('twitter_token')?.value;
    const twitterId = cookieStore.get('twitter_id')?.value;
    
    if (!userId) {
      return NextResponse.json({ error: 'User not logged in' }, { status: 401 });
    }
    
    // Get the user with their Twitter accounts
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        twitterAccounts: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get the current Twitter profile info if we have a token
    let currentTwitterInfo = null;
    if (twitterToken) {
      try {
        currentTwitterInfo = await getTwitterUserInfo(twitterToken);
      } catch (error) {
        console.error('Error fetching current Twitter info:', error);
      }
    }
    
    // Return debug info
    return NextResponse.json({
      cookies: {
        twitter_token: twitterToken ? 'Present' : 'Absent',
        twitter_id: twitterId || 'Not set',
        user_id: userId
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      twitterAccounts: user.twitterAccounts,
      currentTwitterInfo
    });
  } catch (error) {
    console.error('Debug Twitter info error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 