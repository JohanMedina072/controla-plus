const prisma = require("../config/prisma");

const getAllMovements = async () => {
  return prisma.movement.findMany({
    include: {
      category: true,
      paymentMethod: true,
    },
    orderBy: {
      date: "desc",
    },
  });
};

const createMovement = async (data) => {
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

module.exports = {
  getAllMovements,
  createMovement,
};