const jwt = require("jsonwebtoken");
const AppError = require("../errors/app.error");
const { getJwtSecret } = require("../config/app");
const prisma = require("../config/prisma");

const requireAuth = async (req, res, next) => {
  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(
      new AppError(
        "Debes iniciar sesión para continuar",
        401,
        "AUTH_REQUIRED",
      ),
    );
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());

    if (typeof payload.sub !== "string") {
      throw new Error("El token no contiene un usuario válido");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true },
    });

    if (!user) {
      throw new Error("El usuario del token no existe");
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(
      new AppError(
        "La sesión expiró o no es válida. Inicia sesión nuevamente",
        401,
        "INVALID_TOKEN",
      ),
    );
  }
};

module.exports = {
  requireAuth,
};
