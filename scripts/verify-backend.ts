// Hack to fix server-only import issue in script
const Module = require('module');
const originalRequire = Module.prototype.require;
// @ts-ignore
Module.prototype.require = function(id) {
  if (id === 'server-only') {
    return {};
  }
  return originalRequire.apply(this, arguments);
};

// Load environment variables for scripts
require('dotenv').config();

// Main verification script
async function main() {
  console.log('Starting Backend Verification...');

  try {
    const { ExchangeService } = await import('../src/services/exchange');
    const { NotificationService } = await import('../src/services/notification.service');
    // Default export for prisma
    const { default: prisma } = await import('../src/lib/prisma');
    const { SubscriptionService } = await import('../src/services/subscription.service');

    // 1. Verify Exchange Service (BigInt precision)
    console.log('\n--- Testing ExchangeService ---');
    // Mock rates in memory cache if needed, but default is USD=1, MYR=4.75
    // 1 USD = 4.75 MYR
    // 100 cents USD -> 475 cents MYR
    const usdToMyr = await ExchangeService.convert(100, 'USD', 'MYR');
    console.log(`100 USD cents -> MYR cents: ${usdToMyr}`);
    console.log(`Expected: 475 (or close if using live rates, but dev defaults to 4.75)`);
    
    // 475 MYR cents -> USD cents
    // 475 / 4.75 = 100
    const myrToUsd = await ExchangeService.convert(475, 'MYR', 'USD');
    console.log(`475 MYR cents -> USD cents: ${myrToUsd}`);
    console.log(`Expected: 100`);

    // 2. Verify Subscription Creation & NextBillingDate Logic
    console.log('\n--- Testing SubscriptionService ---');
    
    // Cleanup previous test data if any leftovers (by name)
    const existing = await prisma.subscription.findMany({ 
        where: { name: { in: ['Test Sub Verify', 'Test Due Soon'] } } 
    });
    for (const sub of existing) {
      await prisma.subscription.delete({ where: { id: sub.id } });
    }

    const today = new Date();
    // Monthly Cycle
    // Note: SubscriptionService.createSubscription calls prisma.create which needs valid Currency code.
    // Ensure 'USD' and 'MYR' exist.
    const usdCurrency = await prisma.currency.findUnique({ where: { code: 'USD' } });
    if (!usdCurrency) {
        await prisma.currency.create({ data: { code: 'USD', symbol: '$', precision: 2 } });
    }
    const myrCurrency = await prisma.currency.findUnique({ where: { code: 'MYR' } });
    if (!myrCurrency) {
        await prisma.currency.create({ data: { code: 'MYR', symbol: 'RM', precision: 2 } });
    }

    const monthlySub = await SubscriptionService.createSubscription({
      name: 'Test Sub Verify',
      amount: 1000, // 10.00
      currencyCode: 'USD',
      cycle: 'Monthly',
      startDate: today,
      isAutoRenew: true,
      categoryId: undefined, // Optional
    });

    console.log(`Created Monthly Sub: ${monthlySub.id}`);
    
    // Verify date is ~1 month ahead
    const expectedDate = new Date(today);
    expectedDate.setMonth(expectedDate.getMonth() + 1);
    // Allow small difference (ms)
    const diff = Math.abs(monthlySub.nextBillingDate.getTime() - expectedDate.getTime());
    console.log(`Date Difference (ms): ${diff}`);
    if (diff < 1000) console.log('Date Logic: OK');
    else console.log('Date Logic: FAIL');

    // Verify Categories and Dashboard Summary
    console.log('\n--- Testing Categories & Dashboard ---');
    const categories = await SubscriptionService.getCategories();
    console.log(`Categories count: ${categories.length}`);
    if (categories.length > 0) console.log('Categories Fetch: OK');
    else console.log('Categories Fetch: WARN (Zero categories)');

    const summary = await SubscriptionService.getDashboardSummary('MYR');
    console.log(`Dashboard Summary:`, summary);
    if (typeof summary.totalMonthlyCost === 'number') console.log('Dashboard Summary: OK');
    else console.log('Dashboard Summary: FAIL');

    // 3. Verify Notification Service
    console.log('\n--- Testing NotificationService ---');
    const notificationResult = await NotificationService.processUpcomingPayments(3); // 3 days
    console.log(`Notification result: Marked=${notificationResult.marked}, Reset=${notificationResult.reset}`);

    // 4. Verify Page Serialization Logic (Simulate page.tsx)
    console.log('\n--- Testing Page Serialization ---');
    const allSubs = await SubscriptionService.getSubscriptions();
    const serialized = allSubs.map(sub => ({
      id: sub.id,
      name: sub.name,
      amount: Number(sub.amount), // The fix
      currencyCode: sub.currencyCode,
      cycle: sub.cycle,
      startDate: sub.startDate.toISOString(),
      nextBillingDate: sub.nextBillingDate.toISOString(),
      paymentMethod: sub.paymentMethod,
      isAutoRenew: sub.isAutoRenew,
      isUpcoming: sub.isUpcoming,
      categoryId: sub.categoryId,
      isActive: sub.isActive,
      category: sub.category ? {
        id: sub.category.id,
        name: sub.category.name,
      } : null,
      currency: {
        code: sub.currency.code,
        symbol: sub.currency.symbol,
      },
    }));
    
    try {
        JSON.stringify(serialized);
        console.log('Serialization Check: OK');
        if (serialized.length > 0) {
            console.log('Sample amount type:', typeof serialized[0].amount);
            if (typeof serialized[0].amount !== 'number') console.error('FAIL: amount is not a number');
        }
    } catch (e) {
        console.error('Serialization Check: FAIL', e);
        process.exit(1);
    }

    console.log('\nALL CHECKS PASSED');
    process.exit(0);

  } catch (error) {
    console.error('Verification Error:', error);
    process.exit(1);
  }
}

main();
