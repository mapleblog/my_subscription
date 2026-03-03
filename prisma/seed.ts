import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { SeedEncryption } from './seed-utils';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL must be set in .env for seeding');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Start seeding ...');

  // Clean up existing data
  try {
    // Delete in order to avoid foreign key constraints
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
      startDate: new Date('2023-11-01'),
      nextBillingDate: new Date('2026-03-01'),
      paymentMethod: encrypt('Maybank Credit Card'),
      isAutoRenew: true,
      categoryId: services.id,
      isActive: true,
    },
  });

  await prisma.subscription.create({
    data: {
      name: encrypt('Netflix'),
      amount: encrypt('4500'), // 45.00 MYR
      currencyCode: 'MYR',
      cycle: 'Monthly',
      startDate: new Date('2023-01-15'),
      nextBillingDate: new Date('2026-03-15'),
      paymentMethod: encrypt('Visa Debit'),
      isAutoRenew: true,
      categoryId: entertainment.id,
      isActive: true,
    },
  });

  await prisma.subscription.create({
    data: {
      name: encrypt('Spotify Duo'),
      amount: encrypt('2150'), // 21.50 MYR
      currencyCode: 'MYR',
      cycle: 'Monthly',
      startDate: new Date('2022-05-20'),
      nextBillingDate: new Date('2026-03-20'),
      paymentMethod: encrypt('GrabPay'),
      isAutoRenew: true,
      categoryId: entertainment.id,
      isActive: true,
    },
  });

  await prisma.subscription.create({
    data: {
      name: encrypt('Notion Plus'),
      amount: encrypt('800'), // $8.00 USD
      currencyCode: 'USD',
      cycle: 'Monthly',
      startDate: new Date('2023-08-10'),
      nextBillingDate: new Date('2026-03-10'),
      paymentMethod: encrypt('PayPal'),
      isAutoRenew: true,
      categoryId: productivity.id,
      isActive: true,
    },
  });

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
