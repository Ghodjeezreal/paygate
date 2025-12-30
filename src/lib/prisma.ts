import { PrismaClient } from '../../src/generated/prisma/client';

const prismaClientSingleton = () => {
  const accelerateUrl = process.env.DATABASE_URL;
  
  if (!accelerateUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  console.log('Initializing Prisma Client with Accelerate URL');
  
  return new PrismaClient({
    accelerateUrl,
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
