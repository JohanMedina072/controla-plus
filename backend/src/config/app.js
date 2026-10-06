const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    const error = new Error(
      "JWT_SECRET no está configurado en el archivo .env del backend",
    );
    error.statusCode = 500;
    throw error;
  }

  if (secret.length < 32) {
    const error = new Error("JWT_SECRET debe tener al menos 32 caracteres");
    error.statusCode = 500;
    throw error;
  }

  return secret;
};

const getJwtExpiresIn = () => process.env.JWT_EXPIRES_IN?.trim() || "7d";

const assertAppConfig = () => {
  getJwtSecret();
};

module.exports = {
  getJwtSecret,
  getJwtExpiresIn,
  assertAppConfig,
};
