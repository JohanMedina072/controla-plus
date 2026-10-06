const reminderService = require("../services/reminder.service");
const { getDefaultUserId } = require("../config/app");
const {
  validateReminderId,
  validateReminderPayload,
} = require("../validators/reminder.validator");

const listReminders = async (req, res, next) => {
  try {
    const reminders = await reminderService.getAllReminders(getDefaultUserId());

    res.json({
      ok: true,
      data: reminders,
    });
  } catch (error) {
    next(error);
  }
};

const createReminder = async (req, res, next) => {
  try {
    const { type, name, nextDueDate, amount } = req.body;
    const validationMessage = validateReminderPayload({
      type,
      name,
      nextDueDate,
      amount,
    });

    if (validationMessage) {
      return res.status(400).json({
        ok: false,
        message: validationMessage,
      });
    }

    const reminder = await reminderService.createReminder({
      userId: getDefaultUserId(),
      type,
      name,
      nextDueDate,
      amount,
    });

    res.status(201).json({
      ok: true,
      message: "Recordatorio creado correctamente",
      data: reminder,
    });
  } catch (error) {
    next(error);
  }
};

const updateReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, name, nextDueDate, amount } = req.body;
    const idValidationMessage = validateReminderId(id);

    if (idValidationMessage) {
      return res.status(400).json({
        ok: false,
        message: idValidationMessage,
      });
    }

    const validationMessage = validateReminderPayload({
      type,
      name,
      nextDueDate,
      amount,
    });

    if (validationMessage) {
      return res.status(400).json({
        ok: false,
        message: validationMessage,
      });
    }

    const reminder = await reminderService.updateReminder(
      id,
      getDefaultUserId(),
      { type, name, nextDueDate, amount },
    );

    res.json({
      ok: true,
      message: "Recordatorio actualizado correctamente",
      data: reminder,
    });
  } catch (error) {
    next(error);
  }
};

const removeReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validationMessage = validateReminderId(id);

    if (validationMessage) {
      return res.status(400).json({
        ok: false,
        message: validationMessage,
      });
    }

    await reminderService.deleteReminder(id, getDefaultUserId());

    res.json({
      ok: true,
      message: "Recordatorio eliminado correctamente",
    });
  } catch (error) {
    next(error);
  }
};

const completeReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validationMessage = validateReminderId(id);

    if (validationMessage) {
      return res.status(400).json({
        ok: false,
        message: validationMessage,
      });
    }

    const reminder = await reminderService.completeReminder(
      id,
      getDefaultUserId(),
    );

    res.json({
      ok: true,
      message: "Recordatorio marcado como pagado",
      data: reminder,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listReminders,
  createReminder,
  updateReminder,
  removeReminder,
  completeReminder,
};
