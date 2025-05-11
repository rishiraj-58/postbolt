import { NextRequest, NextResponse } from 'next/server';
import { getTwitterTokens, getTwitterUserInfo } from '../../../../../lib/twitter-auth';
import { prisma } from '../../../../../lib/prisma';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Extract the authorization code and state from the URL
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');
    
    // Handle Twitter errors
    if (error) {
      console.error('Twitter auth error:', error, errorDescription);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?error=twitter_${error}`);
    }

    // Validate authorization code
    if (!code) {
      console.error('Missing authorization code');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?error=missing_code`);
    }
    
    // Get the code verifier and stored state from cookies
    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get('twitter_code_verifier')?.value;
    const storedState = cookieStore.get('twitter_auth_state')?.value;
    
    // Verify state parameter to prevent CSRF attacks
    if (!storedState || !state || storedState !== state) {
      console.error('Invalid state parameter', { storedState, receivedState: state });
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?error=invalid_state`);
    }
    
    if (!codeVerifier) {
      console.error('Missing code verifier');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?error=missing_verifier`);
    }

    console.log('Exchanging code for tokens with verifier:', codeVerifier.substring(0, 10) + '...');
    
    // Exchange the authorization code for tokens
    const tokenResponse = await getTwitterTokens(code, codeVerifier);
    const { access_token, refresh_token } = tokenResponse;

    if (!access_token) {
      console.error('Failed to get Twitter tokens');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?error=token_error`);
    }

    // Get the user's profile information
    const userInfoResponse = await getTwitterUserInfo(access_token);
    const userInfo = userInfoResponse.data;
    
    if (!userInfo || !userInfo.id) {
      console.error('Failed to get Twitter user info');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?error=user_info_error`);
    }

    console.log('Twitter user info:', userInfo);

    // First, check if the user is already logged in via cookies
    const userId = cookieStore.get('user_id')?.value;

    if (userId) {
      // User is already logged in, connect Twitter account to their profile
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          twitterAccounts: true
        }
      });

      if (existingUser) {
        // Check if this Twitter account is already connected to this user
        const existingAccount = existingUser.twitterAccounts.find(
          (account: { twitterId: string }) => account.twitterId === userInfo.id
        );

        if (existingAccount) {
          // Update the existing Twitter account with new tokens
          await prisma.twitterAccount.update({
            where: { id: existingAccount.id },
            data: {
              username: userInfo.username,
              name: userInfo.name,
              profilePic: userInfo.profile_image_url,
              refreshToken: refresh_token,
              accessToken: access_token,
              updatedAt: new Date()
            }
          });
        } else {
          // Create a new Twitter account for this user
          // If this is the first Twitter account, set it as default
          const isDefault = existingUser.twitterAccounts.length === 0;
          
          await prisma.twitterAccount.create({
            data: {
              userId: userId,
              twitterId: userInfo.id,
              username: userInfo.username,
              name: userInfo.name,
              profilePic: userInfo.profile_image_url,
              refreshToken: refresh_token,
              accessToken: access_token,
              isDefault: isDefault
            }
          });
        }

        // Set Twitter token in cookies
        const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?twitter=connected`);
        
        response.cookies.set('twitter_token', access_token, { 
          httpOnly: true, 
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 3600 // 1 hour
        });
        
        // Store the Twitter ID in a cookie to identify which account is active
        response.cookies.set('twitter_id', userInfo.id, {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 3600 // 1 hour
        });
        
        // Clear the code verifier and state cookies
        response.cookies.delete('twitter_code_verifier');
        response.cookies.delete('twitter_auth_state');
        
        return response;
      }
    }

    // If not connected to a logged-in user, check if this Twitter account is already linked to any user
    const existingTwitterAccount = await prisma.twitterAccount.findUnique({
      where: {
        twitterId: userInfo.id
      },
      include: {
        user: true
      }
    });

    if (existingTwitterAccount) {
      // This Twitter account is already linked to a user, log them in
      const user = existingTwitterAccount.user;
      
      // Update the Twitter account with new tokens
      await prisma.twitterAccount.update({
        where: { id: existingTwitterAccount.id },
        data: {
          username: userInfo.username,
          name: userInfo.name,
          profilePic: userInfo.profile_image_url,
          refreshToken: refresh_token,
          accessToken: access_token,
          updatedAt: new Date()
        }
      });
      
      // Store the token in secure, httpOnly cookies
      const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?twitter=connected`);
      
      response.cookies.set('twitter_token', access_token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600 // 1 hour
      });
      
      response.cookies.set('twitter_id', userInfo.id, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600 // 1 hour
      });
      
      // Set user ID cookie
      response.cookies.set('user_id', user.id, { 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600 * 24 * 30 // 30 days
      });
      
      // Clear the code verifier and state cookies
      response.cookies.delete('twitter_code_verifier');
      response.cookies.delete('twitter_auth_state');
      
      return response;
    }

    // Create a new user with this Twitter account if no existing user
    // This is a fresh signup via Twitter
    const newUser = await prisma.user.create({
      data: {
        email: `${userInfo.id}@twitter.com`, // Placeholder email with Twitter ID
        name: userInfo.name || '',
        profilePic: userInfo.profile_image_url || null,
        twitterAccounts: {
          create: {
            twitterId: userInfo.id,
            username: userInfo.username,
            name: userInfo.name,
            profilePic: userInfo.profile_image_url,
            refreshToken: refresh_token,
            accessToken: access_token,
            isDefault: true // First account is default
          }
        },
        usageLimit: {
          create: {
            maxPosts: 10,
            postsGenerated: 0,
            isPremium: false,
          }
        }
      }
    });

    // Store the token in secure, httpOnly cookies
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?twitter=connected`);
    
    // Set secure, httpOnly cookies for the token
    response.cookies.set('twitter_token', access_token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 // 1 hour
    });
    
    response.cookies.set('twitter_id', userInfo.id, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 // 1 hour
    });
    
    // Also set a user ID cookie
    response.cookies.set('user_id', newUser.id, { 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 * 24 * 30 // 30 days
    });
    
    // Clear the code verifier and state cookies
    response.cookies.delete('twitter_code_verifier');
    response.cookies.delete('twitter_auth_state');

    return response;
  } catch (error) {
    console.error('Twitter callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?error=twitter_callback_error`);
  }
} 