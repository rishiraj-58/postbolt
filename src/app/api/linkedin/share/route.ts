import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check authentication with Clerk
    const authRequest = await auth();
    
    if (!authRequest || !authRequest.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the post content from the request
    const { content, visibility = 'PUBLIC', accountId } = await request.json();
    
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Get LinkedIn token and active account ID from cookies
    const cookieStore = await cookies();
    const linkedinToken = cookieStore.get('linkedin_token')?.value;
    const userId = cookieStore.get('user_id')?.value;
    const linkedinSub = cookieStore.get('linkedin_sub')?.value;
    
    if (!linkedinToken) {
      return NextResponse.json({ error: 'LinkedIn token not found. Please sign in with LinkedIn.' }, { status: 401 });
    }
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found. Please sign in again.' }, { status: 401 });
    }
    
    // Find the appropriate LinkedIn account to use for posting
    let linkedinAccount;
    
    if (accountId) {
      // If an account ID is specified, use that account
      linkedinAccount = await prisma.linkedInAccount.findFirst({
        where: {
          id: accountId,
          userId: userId
        }
      });
      
      if (!linkedinAccount) {
        return NextResponse.json({ 
          error: 'Specified LinkedIn account not found or does not belong to this user.'
        }, { status: 404 });
      }
    } else if (linkedinSub) {
      // If no account ID is specified but there's an active account in the cookies, use that
      linkedinAccount = await prisma.linkedInAccount.findFirst({
        where: {
          linkedinSub: linkedinSub,
          userId: userId
        }
      });
    } else {
      // If no specific account is identified, use the default account
      linkedinAccount = await prisma.linkedInAccount.findFirst({
        where: {
          userId: userId,
          isDefault: true
        }
      });
      
      // If no default account, use any LinkedIn account
      if (!linkedinAccount) {
        linkedinAccount = await prisma.linkedInAccount.findFirst({
          where: {
            userId: userId
          }
        });
      }
    }
    
    if (!linkedinAccount) {
      return NextResponse.json({ 
        error: 'No LinkedIn account connected. Please connect a LinkedIn account.' 
      }, { status: 401 });
    }

    // Post to LinkedIn using the selected LinkedIn account
    const shareResponse = await shareToLinkedIn(linkedinToken, content, visibility, linkedinAccount.linkedinSub);

    return NextResponse.json({ 
      success: true, 
      postId: shareResponse.id,
      accountName: linkedinAccount.name || 'LinkedIn Account'
    });
  } catch (error: any) {
    console.error('LinkedIn share error:', error);
    return NextResponse.json(
      { error: 'Failed to share to LinkedIn', details: error.message },
      { status: 500 }
    );
  }
}

// Function to share content to LinkedIn
async function shareToLinkedIn(accessToken: string, content: string, visibility: string, linkedinSub: string) {
  // First get user's profile information to get the correct URN format
  try {
    const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!userInfoResponse.ok) {
      throw new Error(`Failed to get LinkedIn user info: ${userInfoResponse.status}`);
    }
    
    // Prepare the payload for LinkedIn's Share API
    const payload = {
      author: `urn:li:person:${linkedinSub}`,  // Use the proper LinkedIn member ID format
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': visibility
      }
    };

    console.log('LinkedIn share payload:', JSON.stringify(payload, null, 2));

    // Send POST request to LinkedIn UGC API
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      
      // Check for the specific permissions error
      if (errorData && 
          (errorData.serviceErrorCode === 100 || 
           errorData.message?.includes('ugcPosts.CREATE.NO_VERSION') ||
           errorData.message?.includes('Not enough permissions'))) {
        throw new Error(
          `LinkedIn sharing requires the w_member_social permission. Please disconnect and reconnect your LinkedIn account to grant this permission.`
        );
      }
      
      throw new Error(
        `LinkedIn API error: ${response.status} ${response.statusText}${
          errorData ? ` - ${JSON.stringify(errorData)}` : ''
        }`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error in shareToLinkedIn:', error);
    throw error;
  }
} 