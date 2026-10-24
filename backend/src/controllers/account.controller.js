const accountService = require("../services/account.service");
const { validateAccountPayload } = require("../validators/account.validator");

const listAccounts = async (req, res, next) => {
  try {
    const accounts = await accountService.getAllAccounts(req.user.id);

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
      userId: req.user.id,
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

const deleteAccount = async (req, res, next) => {
  try {
    await accountService.deleteAccount({
      userId: req.user.id,
      accountId: req.params.id,
    })

    res.json({
      ok: true,
      message: 'Cuenta eliminada correctamente',
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  listAccounts,
  createAccount,
  deleteAccount,
};
