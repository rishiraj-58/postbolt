'use server';

import { prisma } from './prisma';

// Save a post to the database
export async function savePost(userId: string, content: string, prompt: string) {
  try {
    // Create post
    const post = await prisma.post.create({
      data: {
        content,
        prompt,
        userId,
      },
    });

    // Update usage limit
    await prisma.usageLimit.update({
      where: { userId },
      data: {
        postsGenerated: {
          increment: 1
        }
      }
    });

    return post;
  } catch (error) {
    console.error('Error saving post:', error);
    throw error;
  }
}

// Get all posts for a user
export async function getUserPosts(userId: string) {
  try {
    const posts = await prisma.post.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return posts;
  } catch (error) {
    console.error('Error getting user posts:', error);
    throw error;
  }
}

// Check if user has reached their usage limit
export async function checkUserUsage(userId: string) {
  try {
    // Get or create usage limit record
    let limit = await prisma.usageLimit.findUnique({
      where: { userId },
    });

    if (!limit) {
      limit = await prisma.usageLimit.create({
        data: {
          userId,
          maxPosts: 10, // Free tier default
          postsGenerated: 0,
          isPremium: false,
        },
      });
    }

    const hasReachedLimit = !limit.isPremium && limit.postsGenerated >= limit.maxPosts;

    return {
      hasReachedLimit,
      postsGenerated: limit.postsGenerated,
      maxPosts: limit.maxPosts,
      isPremium: limit.isPremium,
      postsRemaining: limit.maxPosts - limit.postsGenerated,
    };
  } catch (error) {
    console.error('Error checking user usage:', error);
    throw error;
  }
} 