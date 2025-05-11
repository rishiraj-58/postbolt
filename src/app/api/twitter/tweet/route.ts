import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';
import { postTweet, refreshTwitterToken } from '../../../../lib/twitter-auth';
import { prisma } from '../../../../lib/prisma';

// Simple function to ensure text is Twitter-friendly
function cleanTweetText(text: string): string {
  // Strip any markdown formatting that might have slipped through
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`(.*?)`/g, '$1');
  
  // Remove URLs if they might cause issues
  // text = text.replace(/https?:\/\/\S+/g, '');
  
  // Ensure tweet isn't too long
  if (text.length > 280) {
    text = text.substring(0, 277) + '...';
  }
  
  return text.trim();
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication with Clerk
    const authRequest = await auth();
    
    if (!authRequest || !authRequest.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the tweet content and optional account ID from the request
    const { text, accountId } = await request.json();
    
    console.log("Tweet request:", { text: text?.substring(0, 30) + "...", accountId });
    
    if (!text) {
      return NextResponse.json({ error: 'Tweet text is required' }, { status: 400 });
    }

    // Clean the tweet text before posting
    const cleanedText = cleanTweetText(text);
    console.log("Cleaned tweet text:", cleanedText.substring(0, 50) + (cleanedText.length > 50 ? "..." : ""));

    // Get cookies for user identification
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    const currentTwitterId = cookieStore.get('twitter_id')?.value;
    const twitterToken = cookieStore.get('twitter_token')?.value;
    
    console.log("Cookie status:", { 
      hasUserId: !!userId, 
      hasTwitterId: !!currentTwitterId,
      hasTwitterToken: !!twitterToken
    });
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found. Please sign in again.' }, { status: 401 });
    }
    
    // Find the appropriate Twitter account to use for posting
    let twitterAccount;
    
    if (accountId) {
      // If an account ID is specified, use that account
      twitterAccount = await prisma.twitterAccount.findFirst({
        where: {
          id: accountId,
          userId: userId
        }
      });
      
      if (!twitterAccount) {
        return NextResponse.json({ 
          error: 'Specified Twitter account not found or does not belong to this user.'
        }, { status: 404 });
      }
    } else if (currentTwitterId && twitterToken) {
      // If no account ID is specified but there's an active account in the cookies, use that
      twitterAccount = await prisma.twitterAccount.findFirst({
        where: {
          twitterId: currentTwitterId,
          userId: userId
        }
      });
    } else {
      // If no specific account is identified, use the default account
      twitterAccount = await prisma.twitterAccount.findFirst({
        where: {
          userId: userId,
          isDefault: true
        }
      });
      
      // If no default account, use any Twitter account
      if (!twitterAccount) {
        twitterAccount = await prisma.twitterAccount.findFirst({
          where: {
            userId: userId
          }
        });
      }
    }
    
    if (!twitterAccount) {
      return NextResponse.json({ 
        error: 'No Twitter account connected. Please connect a Twitter account.' 
      }, { status: 401 });
    }
    
    console.log("Selected Twitter account:", { 
      id: twitterAccount.id,
      username: twitterAccount.username,
      hasAccessToken: !!twitterAccount.accessToken,
      hasRefreshToken: !!twitterAccount.refreshToken,
      isDefault: twitterAccount.isDefault
    });
    
    // Use the access token from cookies if it matches the selected account, otherwise use the account's token
    let accessToken = currentTwitterId === twitterAccount.twitterId ? twitterToken : null;
    
    if (!accessToken && twitterAccount.accessToken) {
      accessToken = twitterAccount.accessToken;
      console.log("Using stored access token from the database");
    }
    
    // If no valid token, try to refresh using the stored refresh token
    if (!accessToken && twitterAccount.refreshToken) {
      try {
        console.log("Attempting to refresh token");
        // Try to refresh the token
        const refreshResponse = await refreshTwitterToken(twitterAccount.refreshToken);
        accessToken = refreshResponse.access_token;
        
        console.log("Token refreshed successfully");
        
        // Update the account with the new tokens
        await prisma.twitterAccount.update({
          where: { id: twitterAccount.id },
          data: {
            accessToken: accessToken,
            refreshToken: refreshResponse.refresh_token,
            updatedAt: new Date()
          }
        });
        
        // If this is the current account, also update the cookie
        if (currentTwitterId === twitterAccount.twitterId && accessToken) {
          cookieStore.set('twitter_token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7200 // 2 hours
          });
        }
      } catch (refreshError) {
        console.error('Failed to refresh Twitter token:', refreshError);
        return NextResponse.json({ 
          error: 'Twitter session expired. Please reconnect your Twitter account.' 
        }, { status: 401 });
      }
    } else if (!accessToken && !twitterAccount.refreshToken) {
      return NextResponse.json({ 
        error: 'Twitter account is missing refresh token. Please reconnect your Twitter account.' 
      }, { status: 401 });
    }
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Failed to obtain Twitter access token. Please reconnect your Twitter account.' 
      }, { status: 401 });
    }

    console.log("Posting tweet with token:", accessToken.substring(0, 10) + "...");
    
    // Post to Twitter with cleaned text
    const tweetResponse = await postTweet(accessToken, cleanedText);
    
    console.log("Tweet posted successfully:", { tweetId: tweetResponse.data.id });

    return NextResponse.json({ 
      success: true, 
      tweetId: tweetResponse.data.id,
      text: tweetResponse.data.text,
      accountUsername: twitterAccount.username
    });
  } catch (error: any) {
    console.error('Twitter post error:', error);
    
    // Check for specific Twitter API errors
    if (error.message && error.message.includes('401')) {
      return NextResponse.json({ 
        error: 'Twitter authentication failed. Please reconnect your account.',
        details: error.message 
      }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Failed to post tweet', details: error.message },
      { status: 500 }
    );
  }
} 