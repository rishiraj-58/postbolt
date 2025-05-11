import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '../../../../lib/prisma';
import { getLinkedInUserInfo } from '../../../../lib/linkedin-auth';

export async function GET(request: NextRequest) {
  try {
    // Get user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    const linkedinToken = cookieStore.get('linkedin_token')?.value;
    
    if (!userId) {
      return NextResponse.json({ error: 'User not logged in' }, { status: 401 });
    }
    
    // Get the user with their LinkedIn accounts
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        linkedinAccounts: true
      }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Get the current LinkedIn profile info if we have a token
    let currentLinkedInInfo = null;
    if (linkedinToken) {
      try {
        currentLinkedInInfo = await getLinkedInUserInfo(linkedinToken);
      } catch (error) {
        console.error('Error fetching current LinkedIn info:', error);
      }
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic
      },
      linkedinAccounts: user.linkedinAccounts,
      currentLinkedInInfo
    });
  } catch (error) {
    console.error('Debug LinkedIn info error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 