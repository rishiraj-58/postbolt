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
    
    // Get userId from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found. Please sign in again.' }, { status: 401 });
    }
    
    // Find all Twitter accounts for this user
    const twitterAccounts = await prisma.twitterAccount.findMany({
      where: {
        userId: userId,
        isActive: true
      },
      select: {
        id: true,
        username: true,
        name: true,
        profilePic: true,
        isDefault: true
      },
      orderBy: {
        isDefault: 'desc'
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      accounts: twitterAccounts
    });
  } catch (error: any) {
    console.error('Twitter accounts fetch error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch Twitter accounts', details: error.message },
      { status: 500 }
    );
  }
} 