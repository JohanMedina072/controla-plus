const authService = require("../services/auth.service");
const {
  validateLoginPayload,
  validateRegisterPayload,
} = require("../validators/auth.validator");

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const validationMessage = validateRegisterPayload({
      name,
      email,
      password,
    });

    if (validationMessage) {
      return res.status(400).json({
        ok: false,
        message: validationMessage,
      });
    }

    const session = await authService.register({ name, email, password });

    return res.status(201).json({
      ok: true,
      message: "Cuenta creada correctamente",
      data: session,
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const validationMessage = validateLoginPayload({ email, password });

    if (validationMessage) {
      return res.status(400).json({
        ok: false,
        message: validationMessage,
      });
    }

    const session = await authService.login({ email, password });

    return res.json({
      ok: true,
      message: "Inicio de sesión correcto",
      data: session,
    });
  } catch (error) {
    return next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await authService.getPublicUser(req.user.id);

    return res.json({
      ok: true,
      data: user,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  me,
};
