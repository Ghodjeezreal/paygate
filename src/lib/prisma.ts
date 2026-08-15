import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prismaClientSingleton = () => {
  const datasourceUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

  if (!datasourceUrl) {
    throw new Error('DATABASE_URL or DIRECT_URL environment variable is not set');
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: datasourceUrl }),
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
