-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "cycle" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "nextBillingDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT,
    "isAutoRenew" BOOLEAN NOT NULL DEFAULT true,
    "isUpcoming" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "Currency" ("code") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Subscription_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Subscription" ("amount", "categoryId", "createdAt", "currencyCode", "cycle", "id", "isActive", "isAutoRenew", "name", "nextBillingDate", "paymentMethod", "startDate", "updatedAt") SELECT "amount", "categoryId", "createdAt", "currencyCode", "cycle", "id", "isActive", "isAutoRenew", "name", "nextBillingDate", "paymentMethod", "startDate", "updatedAt" FROM "Subscription";
DROP TABLE "Subscription";
ALTER TABLE "new_Subscription" RENAME TO "Subscription";
CREATE INDEX "Subscription_nextBillingDate_idx" ON "Subscription"("nextBillingDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
