import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { SeedEncryption } from './seed-utils';

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './dev.db';
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding ...');

  // Clean up existing data
  try {
    await prisma.subscription.deleteMany();
    await prisma.category.deleteMany();
    await prisma.currency.deleteMany();
  } catch (e) {
    console.warn('Cleanup failed (maybe empty db):', e);
  }

  // Helper function
  const encrypt = SeedEncryption.encrypt;


  // Create Currencies
  await prisma.currency.create({
    data: {
      code: 'MYR',
      symbol: 'RM',
      precision: 2,
    },
  });

  await prisma.currency.create({
    data: {
      code: 'USD',
      symbol: '$',
      precision: 2,
    },
  });

  console.log('Created currencies: MYR, USD');

  // Create Categories
  const productivity = await prisma.category.create({
    data: {
      name: 'Productivity',
      slug: 'productivity',
      icon: 'layout-grid',
      color: '#007AFF', // Blue
    },
  });

  const entertainment = await prisma.category.create({
    data: {
      name: 'Entertainment',
      slug: 'entertainment',
      icon: 'play-circle',
      color: '#AF52DE', // Purple
    },
  });

  const services = await prisma.category.create({
    data: {
      name: 'Services',
      slug: 'services',
      icon: 'cloud',
      color: '#8E8E93', // Grey
    },
  });

  // Health category - created but not used for initial subscriptions yet
  await prisma.category.create({
    data: {
      name: 'Health',
      slug: 'health',
      icon: 'heart', 
      color: '#34C759', // Green
    },
  });

  console.log('Created categories: Productivity, Entertainment, Services, Health');

  // Create Subscriptions
  // Note: We need to manually encrypt here because the seed script uses raw PrismaClient,
  // NOT the extended client from src/lib/prisma.ts (which is for app usage).
  // Or we could import the extended client, but usually seed scripts are standalone.
  // However, since we defined the encryption logic in the extension, if we use raw client, data won't be encrypted!
  // BUT, the schema says `String`. If we insert "Netflix" into `name` (String), it works.
  // BUT when the app reads it, it will try to decrypt "Netflix" and fail (or return "Netflix" if catch block works).
  // To be correct, we should encrypt in seed too.

  //  const encrypt = (text: string) => EncryptionService.encrypt(text);

  await prisma.subscription.create({
    data: {
      name: encrypt('Apple One'),
      amount: encrypt('3490'), // 34.90 MYR
      currencyCode: 'MYR',
      cycle: 'Monthly',
      startDate: new Date(),
      nextBillingDate: new Date(new Date().setDate(new Date().getDate() + 15)), // Random future date
      paymentMethod: encrypt('Apple Pay'),
      categoryId: services.id,
      isAutoRenew: true,
    },
  });

  await prisma.subscription.create({
    data: {
      name: encrypt('iCloud+'),
      amount: encrypt('390'), // 3.90 MYR
      currencyCode: 'MYR',
      cycle: 'Monthly',
      startDate: new Date(),
      nextBillingDate: new Date(new Date().setDate(new Date().getDate() + 5)),
      paymentMethod: encrypt('Apple Pay'),
      categoryId: services.id,
      isAutoRenew: true,
    },
  });

  await prisma.subscription.create({
    data: {
      name: encrypt('ChatGPT Plus'),
      amount: encrypt('2000'), // 20.00 USD
      currencyCode: 'USD',
      cycle: 'Monthly',
      startDate: new Date(),
      nextBillingDate: new Date(new Date().setDate(new Date().getDate() + 2)),
      paymentMethod: encrypt('Credit Card'),
      categoryId: productivity.id,
      isAutoRenew: true,
    },
  });

  await prisma.subscription.create({
    data: {
      name: encrypt('Netflix'),
      amount: encrypt('5500'), // 55.00 MYR
      currencyCode: 'MYR',
      cycle: 'Monthly',
      startDate: new Date(),
      nextBillingDate: new Date(new Date().setDate(new Date().getDate() + 20)),
      paymentMethod: encrypt('Credit Card'),
      categoryId: entertainment.id,
      isAutoRenew: true,
    },
  });

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await prisma.$disconnect();
    process.exit(1);
  });
