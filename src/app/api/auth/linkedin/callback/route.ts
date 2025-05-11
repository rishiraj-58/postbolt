import { NextRequest, NextResponse } from 'next/server';
import { getLinkedInTokens, getLinkedInUserInfo, decodeIdToken } from '../../../../../lib/linkedin-auth';
import { prisma } from '../../../../../lib/prisma';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Extract the authorization code from the URL
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    
    // Handle LinkedIn errors
    if (error) {
      console.error('LinkedIn auth error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=linkedin_error`);
    }

    // Validate authorization code
    if (!code) {
      console.error('Missing authorization code');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=missing_code`);
    }

    // Exchange the authorization code for access token and id_token
    const tokenResponse = await getLinkedInTokens(code);
    const { access_token, id_token, refresh_token } = tokenResponse;

    if (!access_token || !id_token) {
      console.error('Failed to get LinkedIn tokens');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=token_error`);
    }

    // Get the user's profile information from LinkedIn's userinfo endpoint
    const userInfo = await getLinkedInUserInfo(access_token);
    
    if (!userInfo || !userInfo.sub) {
      console.error('Failed to get LinkedIn user info');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=user_info_error`);
    }

    console.log('LinkedIn user info:', userInfo);

    // First, check if the user is already logged in via cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;

    if (userId) {
      // User is already logged in, connect LinkedIn account to their profile
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          linkedinAccounts: true
        }
      });

      if (existingUser) {
        // Check if this LinkedIn account is already connected to this user
        const existingAccount = existingUser.linkedinAccounts.find(
          (account: { linkedinSub: string }) => account.linkedinSub === userInfo.sub
        );

        if (existingAccount) {
          // Update the existing LinkedIn account with new tokens
          await prisma.linkedInAccount.update({
            where: { id: existingAccount.id },
            data: {
              accessToken: access_token,
              refreshToken: refresh_token || null,
              name: userInfo.name,
              email: userInfo.email,
              profilePic: userInfo.picture,
              updatedAt: new Date()
            }
          });
        } else {
          // Create a new LinkedIn account for this user
          // If this is the first LinkedIn account, set it as default
          const isDefault = existingUser.linkedinAccounts.length === 0;
          
          await prisma.linkedInAccount.create({
            data: {
              userId: userId,
              linkedinSub: userInfo.sub,
              accessToken: access_token,
              refreshToken: refresh_token || null,
              name: userInfo.name,
              email: userInfo.email,
              profilePic: userInfo.picture,
              isDefault: isDefault
            }
          });
        }

        // Set LinkedIn tokens in cookies
        const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?linkedin=connected`);
        
        response.cookies.set('linkedin_token', access_token, { 
          httpOnly: true, 
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 3600
        });
        
        response.cookies.set('linkedin_id_token', id_token, { 
          httpOnly: true, 
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 3600
        });
        
        // Store the LinkedIn ID in a cookie to identify which account is active
        response.cookies.set('linkedin_sub', userInfo.sub, {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 3600 // 1 hour
        });

        return response;
      }
    }

    // If not connected to a logged-in user, check if this LinkedIn account is already linked to any user
    const existingLinkedInAccount = await prisma.linkedInAccount.findFirst({
      where: {
        linkedinSub: userInfo.sub
      },
      include: {
        user: true
      }
    });

    if (existingLinkedInAccount) {
      // This LinkedIn account is already linked to a user, log them in
      const user = existingLinkedInAccount.user;
      
      // Update the LinkedIn account with new tokens
      await prisma.linkedInAccount.update({
        where: { id: existingLinkedInAccount.id },
        data: {
          accessToken: access_token,
          refreshToken: refresh_token || null,
          name: userInfo.name,
          email: userInfo.email,
          profilePic: userInfo.picture,
          updatedAt: new Date()
        }
      });
      
      // Store the token in secure, httpOnly cookies
      const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?linkedin=connected`);
      
      response.cookies.set('linkedin_token', access_token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600 // 1 hour
      });
      
      response.cookies.set('linkedin_id_token', id_token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600 // 1 hour
      });
      
      response.cookies.set('linkedin_sub', userInfo.sub, {
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
      
      return response;
    }

    // Check if a user exists with this email
    let existingUser = null;
    if (userInfo.email) {
      existingUser = await prisma.user.findFirst({
        where: {
          email: userInfo.email
        },
        include: {
          linkedinAccounts: true
        }
      });
    }

    if (existingUser) {
      // User exists with this email, connect the LinkedIn account
      await prisma.linkedInAccount.create({
        data: {
          userId: existingUser.id,
          linkedinSub: userInfo.sub,
          accessToken: access_token,
          refreshToken: refresh_token || null,
          name: userInfo.name,
          email: userInfo.email,
          profilePic: userInfo.picture,
          isDefault: existingUser.linkedinAccounts.length === 0
        }
      });

      // Store the tokens in secure, httpOnly cookies
      const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?linkedin=connected`);
      
      response.cookies.set('linkedin_token', access_token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600
      });
      
      response.cookies.set('linkedin_id_token', id_token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600
      });
      
      response.cookies.set('linkedin_sub', userInfo.sub, {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600 // 1 hour
      });
      
      response.cookies.set('user_id', existingUser.id, { 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600 * 24 * 30 // 30 days
      });

      return response;
    }

    // Create a new user with this LinkedIn account
    const newUser = await prisma.user.create({
      data: {
        email: userInfo.email || `${userInfo.sub}@linkedin.com`,
        name: userInfo.name || '',
        profilePic: userInfo.picture || null,
        linkedinAccounts: {
          create: {
            linkedinSub: userInfo.sub,
            accessToken: access_token,
            refreshToken: refresh_token || null,
            name: userInfo.name,
            email: userInfo.email,
            profilePic: userInfo.picture,
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

    // Store the tokens in secure, httpOnly cookies
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?linkedin=connected`);
    
    // Set secure, httpOnly cookies for the tokens
    response.cookies.set('linkedin_token', access_token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600
    });
    
    response.cookies.set('linkedin_id_token', id_token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600
    });
    
    response.cookies.set('linkedin_sub', userInfo.sub, {
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

    return response;
  } catch (error) {
    console.error('LinkedIn callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?error=server_error`);
  }
} 