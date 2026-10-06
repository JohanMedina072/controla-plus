const accountService = require("../services/account.service");
const { getDefaultUserId } = require("../config/app");
const { validateAccountPayload } = require("../validators/account.validator");

const listAccounts = async (req, res, next) => {
  try {
    const accounts = await accountService.getAllAccounts(getDefaultUserId());

    res.json({
      ok: true,
      data: accounts,
    });
  } catch (error) {
    next(error);
  }
};

const createAccount = async (req, res, next) => {
  try {
    const { name, initialBalance } = req.body;
    const validationMessage = validateAccountPayload({
      name,
      initialBalance,
    });

    if (validationMessage) {
      return res.status(400).json({
        ok: false,
        message: validationMessage,
      });
    }

    const account = await accountService.createAccount({
      userId: getDefaultUserId(),
      name,
      initialBalance,
    });

    res.status(201).json({
      ok: true,
      message: "Cuenta creada correctamente",
      data: account,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAccounts,
  createAccount,
};
