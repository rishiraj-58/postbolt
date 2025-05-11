import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { currentUser } from '@clerk/nextjs/server';
import { checkUserUsage, savePost } from '../../../lib/posts';
import { prisma } from '../../../lib/prisma';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://postpilot.app",
    "X-Title": "PostPilot",
  },
});

export async function POST(req: NextRequest) {
  try {
    // Check authentication using Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let dbUser;
    try {
      // Find the user in our database using Clerk's userId
      dbUser = await prisma.user.findUnique({
        where: { authId: user.id },
      });
      
      // If user doesn't exist in database yet, create one
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            authId: user.id,
            email: user.emailAddresses[0]?.emailAddress || '',
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
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        error: 'Database connection issue. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      }, { status: 500 });
    }

    let usage;
    try {
      // Check usage limits
      usage = await checkUserUsage(dbUser.id);
      if (usage.hasReachedLimit) {
        return NextResponse.json({
          error: 'You have reached your usage limit for the free plan',
          usage,
        }, { status: 403 });
      }
    } catch (usageError) {
      console.error('Usage check error:', usageError);
      usage = { 
        hasReachedLimit: false,
        postsGenerated: 0,
        maxPosts: 10,
        isPremium: false,
        postsRemaining: 10
      };
    }

    // Get prompt from request
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: 'No prompt provided.' }, { status: 400 });
    }

    // Generate post with OpenAI
    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-prover-v2:free",
      messages: [
        { role: 'system', content: 'You are a helpful assistant that writes engaging LinkedIn posts.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.8,
    });
    const post = completion.choices[0]?.message?.content?.trim() || '';

    // Save to database
    try {
      if (post) {
        await savePost(dbUser.id, post, prompt);
      }
    } catch (saveError) {
      console.error('Error saving post:', saveError);
      // Continue even if saving fails
    }

    return NextResponse.json({ 
      post,
      usage: usage ? {
        ...usage,
        postsRemaining: Math.max(0, usage.postsRemaining - 1),
        postsGenerated: usage.postsGenerated + 1
      } : null
    });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json({ error: 'Failed to generate post.' }, { status: 500 });
  }
} 