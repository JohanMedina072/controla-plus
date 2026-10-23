/*
  Warnings:

  - A unique constraint covering the columns `[name,userId]` on the table `PaymentMethod` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Movement_userId_date_idx" ON "Movement"("userId", "date");

-- CreateIndex
CREATE INDEX "Movement_accountId_date_idx" ON "Movement"("accountId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_name_userId_key" ON "PaymentMethod"("name", "userId");

-- CreateIndex
CREATE INDEX "PaymentReminder_userId_nextDueDate_idx" ON "PaymentReminder"("userId", "nextDueDate");

-- Add database-level integrity checks
ALTER TABLE "Movement"
ADD CONSTRAINT "Movement_amount_positive_check"
CHECK ("amount" > 0);

ALTER TABLE "Account"
ADD CONSTRAINT "Account_initialBalance_nonnegative_check"
CHECK ("initialBalance" >= 0);

ALTER TABLE "Category"
ADD CONSTRAINT "Category_type_valid_check"
CHECK ("type" IN ('INCOME', 'EXPENSE'));

ALTER TABLE "PaymentReminder"
ADD CONSTRAINT "PaymentReminder_dueDay_valid_check"
CHECK ("dueDay" BETWEEN 1 AND 31);

ALTER TABLE "PaymentReminder"
ADD CONSTRAINT "PaymentReminder_amount_positive_check"
CHECK ("amount" IS NULL OR "amount" > 0);