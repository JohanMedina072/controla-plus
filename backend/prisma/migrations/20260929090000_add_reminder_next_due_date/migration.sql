-- Add the actual next occurrence so reminders can start in a future month.
ALTER TABLE "PaymentReminder" ADD COLUMN "nextDueDate" DATE;

-- Existing reminders keep their configured monthly day and start from the
-- current month's occurrence. They can be corrected from the form if needed.
UPDATE "PaymentReminder"
SET "nextDueDate" = make_date(
  EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  EXTRACT(MONTH FROM CURRENT_DATE)::integer,
  LEAST(
    "dueDay",
    EXTRACT(
      DAY FROM (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')
    )::integer
  )
)
WHERE "nextDueDate" IS NULL;

ALTER TABLE "PaymentReminder" ALTER COLUMN "nextDueDate" SET NOT NULL;
