import { PrismaClient } from '@prisma/client';

async function testPrisma() {
  console.log('Starting Prisma test');
  
  try {
    const prisma = new PrismaClient({
      log: ['info', 'warn', 'error'],
    });
    console.log('PrismaClient initialized');
    
    // Log all available models and fields
    console.log('Available models:', Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$')));
    
    // Test finding a user with accounts
    const user = await prisma.user.findFirst({
      include: {
        linkedinAccounts: true,
        twitterAccounts: true,
        posts: true,
        usageLimit: true
      }
    });
    
    console.log('User query successful:', user ? 'User found' : 'No users in DB');
    
    if (user) {
      console.log('User relation properties:', Object.keys(user));
    }
    
    // Close connection
    await prisma.$disconnect();
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error in Prisma test:', error);
  }
}

testPrisma(); 