import { NextRequest, NextResponse } from 'next/server';

// Utility function to clean markdown for Twitter
function stripMarkdown(text: string): string {
  // Handle code blocks - completely remove them including content
  text = text.replace(/```[\s\S]*?```/g, '');
  
  // Strip all possible markdown formatting
  text = text.replace(/^#+\s+/gm, '');               // Headings
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');       // Bold
  text = text.replace(/\*(.*?)\*/g, '$1');           // Italic
  text = text.replace(/__(.*?)__/g, '$1');           // Bold
  text = text.replace(/_(.*?)_/g, '$1');             // Italic
  text = text.replace(/~~(.*?)~~/g, '$1');           // Strikethrough
  text = text.replace(/`(.*?)`/g, '$1');             // Inline code
  text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');    // Links
  text = text.replace(/!\[(.*?)\]\(.*?\)/g, '');     // Images (remove completely)
  text = text.replace(/<[^>]*>/g, '');               // HTML tags
  text = text.replace(/^[\s-]*[-•*]\s+/gm, '• ');    // Bullet points
  text = text.replace(/^\d+\.\s+/gm, '• ');          // Numbered lists
  text = text.replace(/^>\s+/gm, '');                // Blockquotes
  text = text.replace(/\n{3,}/g, '\n\n');            // Multiple newlines
  
  // Replace emoji markers with actual emojis
  text = text.replace(/:rocket:/g, '🚀');
  text = text.replace(/:sparkles:/g, '✨');
  text = text.replace(/:robot:/g, '🤖');
  
  // Clean up
  text = text.trim();
  
  // Ensure tweet stays within Twitter's character limit (280)
  if (text.length > 280) {
    text = text.substring(0, 277) + '...';
  }
  
  return text;
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }
    
    const formattedText = stripMarkdown(text);
    
    return NextResponse.json({ 
      original: text, 
      formatted: formattedText,
      originalLength: text.length,
      formattedLength: formattedText.length
    });
  } catch (error) {
    console.error('Text formatting error:', error);
    return NextResponse.json(
      { error: 'Failed to format text', details: error.message },
      { status: 500 }
    );
  }
}

// Also support GET requests with the text as a query parameter
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const text = url.searchParams.get('text');
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }
    
    const formattedText = stripMarkdown(text);
    
    return NextResponse.json({ 
      original: text, 
      formatted: formattedText,
      originalLength: text.length,
      formattedLength: formattedText.length
    });
  } catch (error) {
    console.error('Text formatting error:', error);
    return NextResponse.json(
      { error: 'Failed to format text', details: error.message },
      { status: 500 }
    );
  }
} 