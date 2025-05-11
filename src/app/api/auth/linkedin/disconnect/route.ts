import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    // Get the LinkedIn ID from the URL query parameter or from cookies
    const url = new URL(request.url);
    let linkedinSub = url.searchParams.get('id');
    
    // If no specific LinkedIn ID is provided, use the one from cookies (currently active)
    if (!linkedinSub) {
      linkedinSub = cookieStore.get('linkedin_sub')?.value || null;
    }

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    if (!linkedinSub) {
      return NextResponse.json({ error: 'No LinkedIn account specified' }, { status: 400 });
    }

    // Get the LinkedIn account
    const linkedinAccount = await prisma.linkedInAccount.findFirst({
      where: {
        userId: userId,
        linkedinSub: linkedinSub
      }
    });

    if (!linkedinAccount) {
      return NextResponse.json({ error: 'LinkedIn account not found for this user' }, { status: 404 });
    }

    // Check if this is the default account
    const isDefault = linkedinAccount.isDefault;

    // Delete the LinkedIn account
    await prisma.linkedInAccount.delete({
      where: {
        id: linkedinAccount.id
      }
    });

    // If the deleted account was the default, set a new default if any accounts remain
    if (isDefault) {
      const remainingAccount = await prisma.linkedInAccount.findFirst({
        where: {
          userId: userId
        }
      });

      if (remainingAccount) {
        await prisma.linkedInAccount.update({
          where: {
            id: remainingAccount.id
          },
          data: {
            isDefault: true
          }
        });
      }
    }

    // Clear LinkedIn cookies
    const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?linkedin=disconnected`);
    
    response.cookies.delete('linkedin_token');
    response.cookies.delete('linkedin_id_token');
    response.cookies.delete('linkedin_sub');

    return response;
  } catch (error: any) {
    console.error('Error disconnecting LinkedIn:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?error=disconnect_failed`);
  }
} 