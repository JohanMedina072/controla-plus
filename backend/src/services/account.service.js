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


const deleteAccount = async ({ userId, accountId }) => {
  const account = await prisma.account.findFirst({
    where: {
      id: accountId,
      userId,
    },
    select: {
      id: true,
      _count: {
        select: {
          movements: true,
        },
      },
    },
  });

  if (!account) {
    const error = new Error('Cuenta no encontrada.');
    error.statusCode = 404;
    error.code = 'ACCOUNT_NOT_FOUND';
    throw error;
  }

  if (account._count.movements > 0) {
    const error = new Error(
      'No puedes eliminar una cuenta que tiene movimientos asociados. Conserva la cuenta para mantener el historial.',
    );
    error.statusCode = 409;
    error.code = 'ACCOUNT_HAS_MOVEMENTS';
    throw error;
  }

  await prisma.account.delete({
    where: {
      id: account.id,
    },
  });
};

module.exports = {
  getAllAccounts,
  createAccount,
  deleteAccount,
};
