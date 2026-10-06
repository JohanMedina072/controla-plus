const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");
const AppError = require("../errors/app.error");

const getDaysInMonth = (year, month) =>
  new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

const parseDateOnly = (value) => {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
};

const formatDateOnly = (value) => {
  if (!value) return null;

  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getNextMonthlyDate = (dateValue, dueDay) => {
  const date = new Date(dateValue);
  const nextYear = date.getUTCFullYear();
  const nextMonth = date.getUTCMonth() + 1;
  const nextDay = Math.min(
    Number(dueDay),
    getDaysInMonth(nextYear, nextMonth),
  );

  return new Date(Date.UTC(nextYear, nextMonth, nextDay));
};

const serializeReminder = (reminder) => ({
  ...reminder,
  nextDueDate: formatDateOnly(reminder.nextDueDate),
  amount:
    reminder.amount === null
      ? null
      : new Prisma.Decimal(reminder.amount).toFixed(2),
});

const getAllReminders = async (userId) => {
  const reminders = await prisma.paymentReminder.findMany({
    where: {
      userId,
      isActive: true,
    },
    orderBy: [
      { nextDueDate: "asc" },
      { type: "asc" },
      { name: "asc" },
    ],
  });

  return reminders.map(serializeReminder);
};

const createReminder = async ({ userId, type, name, nextDueDate, amount }) => {
  const parsedNextDueDate = parseDateOnly(nextDueDate);

  const reminder = await prisma.paymentReminder.create({
    data: {
      type,
      name,
      dueDay: parsedNextDueDate.getUTCDate(),
      nextDueDate: parsedNextDueDate,
      amount:
        amount === undefined || amount === null || amount === ""
          ? null
          : amount.toString(),
      userId,
    },
  });

  return serializeReminder(reminder);
};

const updateReminder = async (id, userId, data) => {
  return prisma.$transaction(async (transaction) => {
    const result = await transaction.paymentReminder.updateMany({
      where: {
        id,
        userId,
        isActive: true,
      },
      data: {
        type: data.type,
        name: data.name,
        dueDay: parseDateOnly(data.nextDueDate).getUTCDate(),
        nextDueDate: parseDateOnly(data.nextDueDate),
        amount:
          data.amount === undefined || data.amount === null || data.amount === ""
            ? null
            : data.amount.toString(),
      },
    });

    if (result.count === 0) {
      throw new AppError("Recordatorio no encontrado", 404, "NOT_FOUND");
    }

    const reminder = await transaction.paymentReminder.findUnique({
      where: { id },
    });

    return serializeReminder(reminder);
  });
};

const deleteReminder = async (id, userId) => {
  const result = await prisma.paymentReminder.deleteMany({
    where: {
      id,
      userId,
      isActive: true,
    },
  });

  if (result.count === 0) {
    throw new AppError("Recordatorio no encontrado", 404, "NOT_FOUND");
  }

  return result;
};

const completeReminder = async (id, userId) => {
  return prisma.$transaction(async (transaction) => {
    const reminder = await transaction.paymentReminder.findFirst({
      where: {
        id,
        userId,
        isActive: true,
      },
    });

    if (!reminder) {
      throw new AppError("Recordatorio no encontrado", 404, "NOT_FOUND");
    }

    const updatedReminder = await transaction.paymentReminder.update({
      where: { id },
      data: {
        lastPaidAt: new Date(),
        nextDueDate: getNextMonthlyDate(reminder.nextDueDate, reminder.dueDay),
      },
    });

    return serializeReminder(updatedReminder);
  });
};

module.exports = {
  getAllReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  completeReminder,
};
