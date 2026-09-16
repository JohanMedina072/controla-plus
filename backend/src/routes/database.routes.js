const express = require("express");
const prisma = require("../config/prisma");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT NOW() AS current_time`;

    res.json({
      ok: true,
      message: "Conexión con PostgreSQL funcionando correctamente",
      databaseTime: result[0].current_time,
    });
  } catch (error) {
    console.error("Error de conexión con PostgreSQL:", error);

    res.status(500).json({
      ok: false,
      message: "No se pudo conectar con PostgreSQL",
    });
  }
});

module.exports = router;