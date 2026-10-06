const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");

const serializeAccount = (account) => {
  let currentBalance = new Prisma.Decimal(account.initialBalance);

  for (const movement of account.movements || []) {
    const amount = new Prisma.Decimal(movement.amount);

    currentBalance =
      movement.type === "INCOME"
        ? currentBalance.plus(amount)
        : currentBalance.minus(amount);
  }

  const { movements, ...accountData } = account;

  return {
    ...accountData,
    initialBalance: new Prisma.Decimal(account.initialBalance).toFixed(2),
    currentBalance: currentBalance.toFixed(2),
  };
};

const getAllAccounts = async (userId) => {
  const accounts = await prisma.account.findMany({
    where: {
      userId,
    },
    include: {
      movements: {
        select: {
          type: true,
          amount: true,
        },
      },
    },
    orderBy: [
      { isActive: "desc" },
      { name: "asc" },
    ],
  });

  return accounts.map(serializeAccount);
};

const createAccount = async ({ userId, name, initialBalance }) => {
  const account = await prisma.account.create({
    data: {
      name: name.trim(),
      initialBalance: initialBalance.toString(),
      userId,
    },
    include: {
      movements: {
        select: {
          type: true,
          amount: true,
        },
      },
    },
  });

  return serializeAccount(account);
};

module.exports = {
  getAllAccounts,
  createAccount,
};
