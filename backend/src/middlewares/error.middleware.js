const notFoundHandler = (req, res) => {
  res.status(404).json({
    ok: false,
    message: "La ruta solicitada no existe",
  });
};

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error("Error de API:", error);

  let statusCode = error.statusCode || 500;
  let message = error.message;

  if (error.code === "P2025") {
    statusCode = 404;
    message = "El recurso solicitado no existe";
  }

  if (error.code === "P2002") {
    statusCode = 409;
    message = "Ya existe un registro con esos datos";
  }

  if (error.code === "P2003" || error.code === "P2023") {
    statusCode = 400;
    message = "Una de las referencias enviadas no es válida";
  }

  if (statusCode >= 500) {
    message = "Ocurrió un error interno en el servidor";
  }

  return res.status(statusCode).json({
    ok: false,
    message: message || "Ocurrió un error inesperado",
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
