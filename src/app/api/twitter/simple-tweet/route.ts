import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';
import { postTweet } from '../../../../lib/twitter-auth';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check authentication with Clerk
    const authRequest = await auth();
    
    if (!authRequest || !authRequest.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get cookies for user identification
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found. Please sign in again.' }, { status: 401 });
    }
    
    // Find the default Twitter account
    const twitterAccount = await prisma.twitterAccount.findFirst({
      where: {
        userId: userId,
        isDefault: true
      }
    });
    
    if (!twitterAccount || !twitterAccount.accessToken) {
      return NextResponse.json({ 
        error: 'No Twitter account connected or missing token. Please reconnect your Twitter account.' 
      }, { status: 401 });
    }
    
    // Use a simple, guaranteed-to-work tweet
    const simpleTweet = "Exciting News! I just completed a project using AI to generate engaging social media posts! #AI #ContentCreation " + new Date().toISOString().slice(0, 16);
    
    console.log("Posting simple tweet:", simpleTweet);
    
    // Post to Twitter
    const tweetResponse = await postTweet(twitterAccount.accessToken, simpleTweet);
    
    return NextResponse.json({ 
      success: true, 
      tweetId: tweetResponse.data.id,
      text: tweetResponse.data.text,
      accountUsername: twitterAccount.username
    });
  } catch (error: any) {
    console.error('Twitter post error:', error);
    
    return NextResponse.json(
      { error: 'Failed to post tweet', details: error.message },
      { status: 500 }
    );
  }
} 