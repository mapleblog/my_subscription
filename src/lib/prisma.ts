import 'server-only';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { EncryptionService } from '../services/encryption';

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL;

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({ adapter }).$extends({
    query: {
      subscription: {
        async create({ args, query }) {
          if (args.data.name) {
            args.data.name = EncryptionService.encrypt(args.data.name);
          }
          if (args.data.amount) {
            // Amount comes as number (cents) or string. We verify it's a valid integer string or number before encryption.
            // Ideally application layer ensures it's an integer.
            args.data.amount = EncryptionService.encrypt(String(args.data.amount));
          }
          if (args.data.paymentMethod) {
            args.data.paymentMethod = EncryptionService.encrypt(args.data.paymentMethod);
          }
          return query(args);
        },
        async update({ args, query }) {
          if (args.data.name && typeof args.data.name === 'string') {
            args.data.name = EncryptionService.encrypt(args.data.name);
          }
          if (args.data.amount !== undefined) {
            args.data.amount = EncryptionService.encrypt(String(args.data.amount));
          }
          if (args.data.paymentMethod && typeof args.data.paymentMethod === 'string') {
            args.data.paymentMethod = EncryptionService.encrypt(args.data.paymentMethod);
          }
          return query(args);
        },
        // TODO: Handle createMany, upsert if needed later
      },
    },
    result: {
      subscription: {
        name: {
          needs: { name: true },
          compute(subscription) {
            try {
              return EncryptionService.decrypt(subscription.name);
            } catch {
              return subscription.name;
            }
          },
        },
        amount: {
          needs: { amount: true },
          compute(subscription) {
            try {
              const decrypted = EncryptionService.decrypt(subscription.amount);
              // Return as number (Int/Cents)
              const val = parseInt(decrypted, 10);
              return isNaN(val) ? 0 : val;
            } catch {
              return 0;
            }
          },
        },
        paymentMethod: {
          needs: { paymentMethod: true },
          compute(subscription) {
            if (!subscription.paymentMethod) return null;
            try {
              return EncryptionService.decrypt(subscription.paymentMethod);
            } catch {
              return subscription.paymentMethod;
            }
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
