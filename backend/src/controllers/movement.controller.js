const movementService = require("../services/movement.service");

const listMovements = async (req, res) => {
  try {
    const movements = await movementService.getAllMovements();

    res.json({
      ok: true,
      data: movements,
    });
  } catch (error) {
    console.error("Error al listar movimientos:", error);

    res.status(500).json({
      ok: false,
      message: "No se pudieron obtener los movimientos",
    });
  }
};

const createMovement = async (req, res) => {
  try {
    const {
      type,
      amount,
      description,
      date,
      userId,
      categoryId,
      paymentMethodId,
    } = req.body;

    if (
      !type ||
      amount === undefined ||
      !userId ||
      !categoryId ||
      !paymentMethodId
    ) {
      return res.status(400).json({
        ok: false,
        message:
          "type, amount, userId, categoryId y paymentMethodId son obligatorios",
      });
    }

    if (!["INCOME", "EXPENSE"].includes(type)) {
      return res.status(400).json({
        ok: false,
        message: "type debe ser INCOME o EXPENSE",
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        ok: false,
        message: "amount debe ser mayor que cero",
      });
    }

    const movement = await movementService.createMovement({
      type,
      amount,
      description,
      date,
      userId,
      categoryId,
      paymentMethodId,
    });

    res.status(201).json({
      ok: true,
      message: "Movimiento creado correctamente",
      data: movement,
    });
  } catch (error) {
    console.error("Error al crear movimiento:", error);

    res.status(500).json({
      ok: false,
      message: "No se pudo crear el movimiento",
    });
  }
};

const deleteMovement = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        ok: false,
        message: "El id del movimiento es obligatorio",
      });
    }

    await movementService.deleteMovement(id);

    res.json({
      ok: true,
      message: "Movimiento eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar movimiento:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        ok: false,
        message: "Movimiento no encontrado",
      });
    }

    res.status(500).json({
      ok: false,
      message: "No se pudo eliminar el movimiento",
    });
  }
};




module.exports = {
  listMovements,
  createMovement,
  deleteMovement,

};