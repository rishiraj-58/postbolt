import { PrismaClient } from '@prisma/client';

// Add better error handling for the Prisma client
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
  isConnected: boolean | undefined;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Set initial connection state
globalForPrisma.isConnected = false;

// Add connection validation
export async function validateConnection() {
  try {
    // Test database connection with a simple query
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    globalForPrisma.isConnected = true;
    return true;
  } catch (e) {
    console.error('❌ Database connection failed:', e);
    globalForPrisma.isConnected = false;
    return false;
  }
}

// Check if database is connected
export function isDatabaseConnected() {
  return globalForPrisma.isConnected === true;
}

// Only run the validation in development
if (process.env.NODE_ENV === 'development') {
  validateConnection();
}

export default prisma; 