const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getDefaultUserId = () => {
  const userId = process.env.DEFAULT_USER_ID?.trim();

  if (!userId) {
    const error = new Error(
      "DEFAULT_USER_ID no está configurado en el archivo .env del backend",
    );
    error.statusCode = 500;
    throw error;
  }

  if (!UUID_PATTERN.test(userId)) {
    const error = new Error("DEFAULT_USER_ID no tiene un UUID válido");
    error.statusCode = 500;
    throw error;
  }

  return userId;
};

const assertAppConfig = () => {
  getDefaultUserId();
};

module.exports = {
  getDefaultUserId,
  assertAppConfig,
};
