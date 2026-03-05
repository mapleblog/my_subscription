import 'server-only';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const prismaClientSingleton = () => {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    // Fallback to prevent crash; real queries will fail fast with clear error
    console.error('Prisma: DATABASE_URL/DIRECT_URL is not set. Check .env.');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({ adapter }).$extends({
    result: {
      subscription: {
        name: {
          needs: { name: true },
          compute(subscription) {
            return subscription.name;
          },
        },
        amount: {
          needs: { amount: true },
          compute(subscription) {
            const val = parseInt(subscription.amount as unknown as string, 10);
            return isNaN(val) ? 0 : val;
          },
        },
        paymentMethod: {
          needs: { paymentMethod: true },
          compute(subscription) {
            if (!subscription.paymentMethod) return null;
            return subscription.paymentMethod;
          },
        },
      },
    },
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
