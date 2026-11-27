const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET?.trim();
  if (!/^[a-f0-9]{64}$/i.test(secret ?? "")) {
    throw new Error("JWT_SECRET debe contener 32 bytes aleatorios codificados en hexadecimal");
  }
  return secret;
};

const getJwtExpiresIn = () => {
  const value = process.env.JWT_EXPIRES_IN?.trim() || "8h";
  const match = /^([1-9]\d{0,5})([smhd])$/.exec(value);
  const units = { s: 1, m: 60, h: 3600, d: 86400 };
  const seconds = match && Number(match[1]) * units[match[2]];
  if (!seconds || seconds > 7 * units.d) {
    throw new Error("JWT_EXPIRES_IN debe usar s, m, h o d y no superar 7 días");
  }
  return seconds;
};

const getCorsOrigins = () =>
  (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173")
    .split(",").map((origin) => origin.trim()).filter(Boolean);

const assertAppConfig = () => {
  getJwtSecret();
  getJwtExpiresIn();
};

module.exports = {
  getJwtSecret,
  getJwtExpiresIn,
  getCorsOrigins,
  assertAppConfig,
};
