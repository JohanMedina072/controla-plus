const express = require("express");
const cors = require("cors");
require("dotenv").config();

const healthRoutes = require("./routes/health.routes");
const databaseRoutes = require("./routes/database.routes");
const movementRoutes = require("./routes/movement.routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/health", healthRoutes);
app.use("/api/db-test", databaseRoutes);
app.use("/api/movements", movementRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});