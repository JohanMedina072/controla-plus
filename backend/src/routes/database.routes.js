const express = require("express");
const prisma = require("../config/prisma");
const AppError = require("../errors/app.error");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const result = await prisma.$queryRaw`SELECT NOW() AS current_time`;

    res.json({
      ok: true,
      message: "Conexión con PostgreSQL funcionando correctamente",
      databaseTime: result[0].current_time,
    });
  } catch (error) {
    next(new AppError("No se pudo conectar con PostgreSQL", 503, "DATABASE_UNAVAILABLE"));
  }
});

module.exports = router;
