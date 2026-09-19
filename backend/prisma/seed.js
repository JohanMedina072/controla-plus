const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: {
      email: "johan@example.com",
    },
    update: {},
    create: {
      name: "Johan",
      email: "johan@example.com",
      passwordHash: "demo-password",
    },
  });

  const categories = [
    { name: "Comida", type: "EXPENSE" },
    { name: "Transporte", type: "EXPENSE" },
    { name: "Salud", type: "EXPENSE" },
    { name: "Estudios", type: "EXPENSE" },
    { name: "Mudanzas", type: "INCOME" },
    { name: "taxi", type: "INCOME" },
    { name: "Marketplace", type: "INCOME" },
    { name: "Otros", type: "EXPENSE" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        name_userId: {
          name: category.name,
          userId: user.id,
        },
      },
      update: {
        type: category.type,
      },
      create: {
        name: category.name,
        type: category.type,
        userId: user.id,
      },
    });
  }

  const paymentMethods = ["Efectivo", "Yape", "Tarjeta BCP", "Tarjeta IO"];

  for (const methodName of paymentMethods) {
    const existingMethod = await prisma.paymentMethod.findFirst({
      where: {
        name: methodName,
        userId: user.id,
      },
    });

    if (!existingMethod) {
      await prisma.paymentMethod.create({
        data: {
          name: methodName,
          userId: user.id,
        },
      });
    }
  }

  console.log("Datos iniciales creados correctamente");
  console.log(`Usuario creado: ${user.email}`);
}

main()
  .catch((error) => {
    console.error("Error al crear datos iniciales:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });