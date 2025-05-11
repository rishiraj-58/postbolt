import { NextRequest, NextResponse } from 'next/server';
import { getLinkedInUserInfo, authenticateWithToken } from '../../../../../lib/linkedin-auth';
import { prisma } from '../../../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Get token from request body
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    // Get user info with the provided token
    const userInfo = await getLinkedInUserInfo(token);

    if (!userInfo || !userInfo.sub) {
      return NextResponse.json(
        { error: 'Failed to fetch user information' },
        { status: 401 }
      );
    }

    console.log('User info from LinkedIn:', userInfo);

    // Check if user exists in database
    let user = await prisma.user.findFirst({
      where: {
        authId: userInfo.sub // Use authId field instead of linkedinId
      }
    });

    // Create user if they don't exist
    if (!user) {
      console.log('Creating new user with LinkedIn info:', {
        email: userInfo.email || `${userInfo.sub}@linkedin.com`,
        authId: userInfo.sub, // Store LinkedIn sub as authId
        name: userInfo.name || '',
      });

      user = await prisma.user.create({
        data: {
          email: userInfo.email || `${userInfo.sub}@linkedin.com`,
          authId: userInfo.sub, // Store LinkedIn sub as authId
          name: userInfo.name || '',
          usageLimit: {
            create: {
              maxPosts: 10,
              postsGenerated: 0,
              isPremium: false,
            },
          },
        },
      });
    }

    // Create response with cookies
    const response = NextResponse.json({ success: true, userId: user.id });

    // Set cookies for authentication
    response.cookies.set('linkedin_token', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600
    });
    
    // Set user ID cookie (not httpOnly, so client JS can access)
    response.cookies.set('user_id', user.id, { 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600
    });

    return response;
  } catch (error) {
    console.error('Direct LinkedIn auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
} 