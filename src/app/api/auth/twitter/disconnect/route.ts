import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    // Get the Twitter ID from the URL query parameter or from cookies
    const url = new URL(request.url);
    let twitterId = url.searchParams.get('id');
    
    // If no specific Twitter ID is provided, use the one from cookies (currently active)
    if (!twitterId) {
      twitterId = cookieStore.get('twitter_id')?.value || null;
    }

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    if (!twitterId) {
      return NextResponse.json({ error: 'No Twitter account specified' }, { status: 400 });
    }

    // Get the Twitter account
    const twitterAccount = await prisma.twitterAccount.findFirst({
      where: {
        userId: userId,
        twitterId: twitterId
      }
    });

    if (!twitterAccount) {
      return NextResponse.json({ error: 'Twitter account not found for this user' }, { status: 404 });
    }

    // Check if this is the default account
    const isDefault = twitterAccount.isDefault;

    // Delete the Twitter account
    await prisma.twitterAccount.delete({
      where: {
        id: twitterAccount.id
      }
    });

    // If the deleted account was the default, set a new default if any accounts remain
    if (isDefault) {
      const remainingAccount = await prisma.twitterAccount.findFirst({
        where: {
          userId: userId
        }
      });

      if (remainingAccount) {
        await prisma.twitterAccount.update({
          where: {
            id: remainingAccount.id
          },
          data: {
            isDefault: true
          }
        });
      }
    }

    // Clear Twitter cookies
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?twitter=disconnected`);
    
    response.cookies.delete('twitter_token');
    response.cookies.delete('twitter_id');
    response.cookies.delete('twitter_code_verifier');
    response.cookies.delete('twitter_auth_state');

    return response;
  } catch (error: any) {
    console.error('Error disconnecting Twitter:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?error=twitter_disconnect_failed`);
  }
} 