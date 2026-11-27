const AppError = require("../errors/app.error");
const prisma = require("../config/prisma");
const { verifySession, matchesSession } = require("../security/session");

const invalidSession = () => new AppError(
  "La sesión expiró o no es válida. Inicia sesión nuevamente",
  401,
  "INVALID_TOKEN",
);

const requireAuth = async (req, res, next) => {
  const authorization = req.headers.authorization || "";
  const [scheme, token, extra] = authorization.split(" ");

  if (scheme !== "Bearer" || !token || extra !== undefined) {
    return next(
      new AppError(
        "Debes iniciar sesión para continuar",
        401,
        "AUTH_REQUIRED",
      ),
    );
  }

  let payload;
  try {
    payload = verifySession(token);
  } catch {
    return next(invalidSession());
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, passwordHash: true },
  });
  if (!user || !matchesSession(payload, user)) return next(invalidSession());

  req.user = { id: user.id };
  return next();
};

module.exports = {
  requireAuth,
};
