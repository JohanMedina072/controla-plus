const prisma = require("../config/prisma");
const AppError = require("../errors/app.error");

const getAllMovements = async (userId) => {
  return prisma.movement.findMany({
    where: {
      userId,
    },
    include: {
      category: true,
      paymentMethod: true,
    },
    orderBy: {
      date: "desc",
    },
  });
};

const validateReferences = async ({ userId, type, categoryId, paymentMethodId }) => {
  const [category, paymentMethod] = await Promise.all([
    prisma.category.findFirst({
      where: {
        id: categoryId,
        userId,
        type,
      },
    }),
    prisma.paymentMethod.findFirst({
      where: {
        id: paymentMethodId,
        userId,
      },
    }),
  ]);

  if (!category) {
    throw new AppError(
      "La categoría no existe, no pertenece al usuario o no corresponde al tipo de movimiento",
      400,
      "INVALID_CATEGORY",
    );
  }

  if (!paymentMethod) {
    throw new AppError(
      "El método de pago no existe o no pertenece al usuario",
      400,
      "INVALID_PAYMENT_METHOD",
    );
  }
};

const createMovement = async (data) => {
  await validateReferences(data);

  return prisma.movement.create({
    data: {
      type: data.type,
      amount: data.amount.toString(),
      description: data.description || null,
      date: data.date ? new Date(data.date) : undefined,
      userId: data.userId,
      categoryId: data.categoryId,
      paymentMethodId: data.paymentMethodId,
    },
    include: {
      category: true,
      paymentMethod: true,
    },
  });
};

const deleteMovement = async (id, userId) => {
  const result = await prisma.movement.deleteMany({
    where: {
      id,
      userId,
    },
  });

  if (result.count === 0) {
    throw new AppError("Movimiento no encontrado", 404, "NOT_FOUND");
  }

  return result;
};

const updateMovement = async (id, userId, data) => {
  await validateReferences({ ...data, userId });

  return prisma.$transaction(async (transaction) => {
    const result = await transaction.movement.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        type: data.type,
        amount: data.amount.toString(),
        description: data.description || null,
        date: data.date ? new Date(data.date) : undefined,
        categoryId: data.categoryId,
        paymentMethodId: data.paymentMethodId,
      },
    });

    if (result.count === 0) {
      throw new AppError("Movimiento no encontrado", 404, "NOT_FOUND");
    }

    return transaction.movement.findUnique({
      where: { id },
      include: {
        category: true,
        paymentMethod: true,
      },
    });
  });
};

module.exports = {
  getAllMovements,
  createMovement,
  deleteMovement,
  updateMovement,
};
