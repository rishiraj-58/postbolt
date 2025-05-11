import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';
import { postTweet } from '../../../../lib/twitter-auth';
import { prisma } from '../../../../lib/prisma';

// Simplify content to plain text that Twitter will accept
function simplifyContent(text: string): string {
  // Log the original content to debug
  console.log("Original content to simplify:", text.substring(0, 100) + "...");
  
  // Strip all markdown
  let simplified = text;
  
  // Remove markdown headings but preserve the text
  simplified = simplified.replace(/^#{1,6}\s+(.*?)$/gm, '$1');
  
  // Remove all markdown formatting but preserve the text
  simplified = simplified.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
  simplified = simplified.replace(/\*(.*?)\*/g, '$1');     // Italic
  simplified = simplified.replace(/__(.*?)__/g, '$1');     // Bold
  simplified = simplified.replace(/_(.*?)_/g, '$1');       // Italic
  simplified = simplified.replace(/~~(.*?)~~/g, '$1');     // Strikethrough
  simplified = simplified.replace(/`(.*?)`/g, '$1');       // Inline code
  simplified = simplified.replace(/```[\s\S]*?```/g, '');  // Code blocks
  simplified = simplified.replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Links
  simplified = simplified.replace(/!\[(.*?)\]\(.*?\)/g, ''); // Images
  simplified = simplified.replace(/<[^>]*>/g, '');          // HTML tags
  
  // Strip bullet points but keep the text (convert to a simple format)
  simplified = simplified.replace(/^[\s-]*[-•*]\s+/gm, '• ');
  
  // Attempt to preserve key historical dates and facts about Indo-Pak War
  // Look for keywords and ensure they're included in the simplified content
  const keywords = ['Indo-Pak War', '1971', 'Bangladesh', 'Pakistan', 'India', 'liberation'];
  
  // Check if this is likely historical content about the Indo-Pak War
  const isHistoricalContent = keywords.some(keyword => 
    text.toLowerCase().includes(keyword.toLowerCase())
  );
  
  let finalTweet = simplified.trim();
  
  // For historical content, ensure we capture the essence in the first part
  if (isHistoricalContent && finalTweet.length > 280) {
    // Prioritize the first part which typically contains the core facts
    finalTweet = finalTweet.substring(0, 275) + "...";
  } else if (finalTweet.length > 280) {
    // For non-historical content, just truncate
    finalTweet = finalTweet.substring(0, 275) + "...";
  }
  
  // Log the simplified content
  console.log("Simplified content for Twitter:", finalTweet);
  
  return finalTweet;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication with Clerk
    const authRequest = await auth();
    
    if (!authRequest || !authRequest.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the original content from request
    const { content } = await request.json();
    
    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }
    
    // Log the received content
    console.log("Received content for Twitter post:", content.substring(0, 100) + "...");
    
    // Get cookies for user identification
    const cookieStore = await cookies();
    const userId = cookieStore.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found. Please sign in again.' }, { status: 401 });
    }
    
    // Find the default Twitter account
    const twitterAccount = await prisma.twitterAccount.findFirst({
      where: {
        userId: userId,
        isDefault: true
      }
    });
    
    if (!twitterAccount || !twitterAccount.accessToken) {
      return NextResponse.json({ 
        error: 'No Twitter account connected or missing token. Please reconnect your Twitter account.' 
      }, { status: 401 });
    }
    
    // Create a simplified tweet using the actual content provided
    const simpleTweet = simplifyContent(content);
    
    console.log("Posting to Twitter as @" + twitterAccount.username);
    console.log("Original content length:", content.length);
    console.log("Simplified tweet length:", simpleTweet.length);
    
    // Post to Twitter
    const tweetResponse = await postTweet(twitterAccount.accessToken, simpleTweet);
    
    return NextResponse.json({ 
      success: true, 
      tweetId: tweetResponse.data.id,
      text: tweetResponse.data.text,
      accountUsername: twitterAccount.username,
      originalContent: content.substring(0, 100) + "...",
      postedContent: simpleTweet
    });
  } catch (error: any) {
    console.error('Twitter post error:', error);
    
    return NextResponse.json(
      { error: 'Failed to post tweet', details: error.message },
      { status: 500 }
    );
  }
} 