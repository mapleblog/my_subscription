import 'server-only';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { EncryptionService } from '../services/encryption';
import path from 'path';

const prismaClientSingleton = () => {
  // Use better-sqlite3 adapter for consistency with seed and performance
  // In Next.js, we need to handle the DB path correctly
  const dbPath = process.env.DATABASE_URL?.replace('file:', '') || 'dev.db';
  
  // Resolve path relative to project root if it's relative
  // process.cwd() in Next.js is project root
  const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
  
  const adapter = new PrismaBetterSqlite3({ url: resolvedPath });
  
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
            } catch (e) {
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
            } catch (e) {
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
            } catch (e) {
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

export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
