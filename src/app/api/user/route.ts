import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '../../../lib/prisma';
import { cookies } from 'next/headers';

// Define interfaces for account types
interface LinkedInAccount {
  id: string;
  linkedinSub: string;
  name: string | null;
  email: string | null;
  profilePic: string | null;
  profileUrl: string | null;
  isDefault: boolean;
}

interface TwitterAccount {
  id: string;
  twitterId: string;
  username: string | null;
  name: string | null;
  profilePic: string | null;
  isDefault: boolean;
}

export async function GET() {
  try {
    // Get the current authenticated user from Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
      // Find the user in our database using Clerk's user ID
      let dbUser = await prisma.user.findFirst({
        where: { authId: user.id },
        include: {
          linkedinAccounts: true,
          twitterAccounts: true
        }
      });
      
      // If user doesn't exist, create one
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            authId: user.id,
            email: user.emailAddresses[0]?.emailAddress || '',
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            profilePic: user.imageUrl,
            usageLimit: {
              create: {
                maxPosts: 10,
                postsGenerated: 0,
                isPremium: false,
              },
            },
          },
          include: {
            linkedinAccounts: true,
            twitterAccounts: true
          }
        });
      }
      
      // Get active Twitter account from cookies if available
      const cookieStore = await cookies();
      const twitterId = cookieStore.get('twitter_id')?.value;
      
      // Find default accounts for both platforms
      const defaultLinkedInAccount = dbUser.linkedinAccounts.find(
        (account: LinkedInAccount) => account.isDefault
      );
      const defaultTwitterAccount = dbUser.twitterAccounts.find(
        (account: TwitterAccount) => account.isDefault
      );
      
      // Find active Twitter account if it exists
      const activeTwitterAccount = twitterId 
        ? dbUser.twitterAccounts.find(
            (account: TwitterAccount) => account.twitterId === twitterId
          )
        : null;
      
      // Use active account if available, otherwise use default
      const primaryTwitterAccount = activeTwitterAccount || defaultTwitterAccount;
      
      // Return the user data with all necessary fields
      return NextResponse.json({
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        profilePic: dbUser.profilePic,
        
        // For backward compatibility, include flags and primary account details
        linkedinConnected: dbUser.linkedinAccounts.length > 0,
        linkedinSub: defaultLinkedInAccount?.linkedinSub || null,
        
        twitterConnected: dbUser.twitterAccounts.length > 0,
        twitterId: primaryTwitterAccount?.twitterId || null,
        twitterUsername: primaryTwitterAccount?.username || null,
        
        // Include full account lists for new UI
        linkedinAccounts: dbUser.linkedinAccounts.map((account: LinkedInAccount) => ({
          id: account.id,
          linkedinSub: account.linkedinSub,
          name: account.name,
          email: account.email,
          profilePic: account.profilePic,
          profileUrl: account.profileUrl,
          isDefault: account.isDefault
        })),
        
        twitterAccounts: dbUser.twitterAccounts.map((account: TwitterAccount) => ({
          id: account.id,
          twitterId: account.twitterId,
          username: account.username,
          name: account.name,
          profilePic: account.profilePic,
          isDefault: account.isDefault,
          isActive: account.twitterId === twitterId
        }))
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        error: 'Database connection issue. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? String(dbError) : undefined
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
} 