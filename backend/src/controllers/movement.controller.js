const movementService = require("../services/movement.service");
const {
  validateMovementId,
  validateMovementPayload,
} = require("../validators/movement.validator");

const listMovements = async (req, res, next) => {
  try {
    const movements = await movementService.getAllMovements(req.user.id);

    res.json({
      ok: true,
      data: movements,
    });
  } catch (error) {
    next(error);
  }
};

const createMovement = async (req, res, next) => {
  try {
    const {
      type,
      amount,
      description,
      date,
      categoryId,
      paymentMethodId,
      accountId,
    } = req.body;

    const validationMessage = validateMovementPayload({
      type,
      amount,
      description,
      date,
      categoryId,
      paymentMethodId,
      accountId,
    });

    if (validationMessage) {
      return res.status(400).json({
        ok: false,
        message: validationMessage,
      });
    }

    const movement = await movementService.createMovement({
      type,
      amount,
      description: description?.trim(),
      date,
      userId: req.user.id,
      categoryId,
      paymentMethodId,
      accountId,
    });

    res.status(201).json({
      ok: true,
      message: "Movimiento creado correctamente",
      data: movement,
    });
  } catch (error) {
    next(error);
  }
};

const deleteMovement = async (req, res, next) => {
  try {
    const { id } = req.params;

    const validationMessage = validateMovementId(id);

    if (validationMessage) {
      return res.status(400).json({
        ok: false,
        message: validationMessage,
      });
    }

    await movementService.deleteMovement(id, req.user.id);

    res.json({
      ok: true,
      message: "Movimiento eliminado correctamente",
    });
  } catch (error) {
    next(error);
  }
};

const updateMovement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      type,
      amount,
      description,
      date,
      categoryId,
      paymentMethodId,
      accountId,
    } = req.body;

    const idValidationMessage = validateMovementId(id);

    if (idValidationMessage) {
      return res.status(400).json({
        ok: false,
        message: idValidationMessage,
      });
    }

    const validationMessage = validateMovementPayload({
      type,
      amount,
      description,
      date,
      categoryId,
      paymentMethodId,
      accountId,
    });

    if (validationMessage) {
      return res.status(400).json({
        ok: false,
        message: validationMessage,
      });
    }

    const movement = await movementService.updateMovement(id, req.user.id, {
      type,
      amount,
      description: description?.trim(),
      date,
      categoryId,
      paymentMethodId,
      accountId,
    });

    res.json({
      ok: true,
      message: "Movimiento actualizado correctamente",
      data: movement,
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  listMovements,
  createMovement,
  deleteMovement,
  updateMovement,
};
