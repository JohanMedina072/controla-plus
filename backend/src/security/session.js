const { createHmac, randomUUID, timingSafeEqual } = require("node:crypto");
const jwt = require("jsonwebtoken");
const { getJwtExpiresIn, getJwtSecret } = require("../config/app");

const algorithm = "HS256";
const issuer = "controla-plus";
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const revision = (passwordHash, secret) =>
  createHmac("sha256", secret).update("controla-session-v1\0").update(passwordHash).digest();

const signSession = (user) => {
  const secret = getJwtSecret();
  return jwt.sign({ rev: revision(user.passwordHash, secret).toString("hex") }, secret, {
    algorithm, issuer, subject: user.id, jwtid: randomUUID(), expiresIn: getJwtExpiresIn(),
  });
};

const verifySession = (token) => {
  const payload = jwt.verify(token, getJwtSecret(), { algorithms: [algorithm], issuer });
  if (!payload || !uuid.test(payload.sub) || !Number.isSafeInteger(payload.exp)
    || typeof payload.rev !== "string" || !/^[a-f0-9]{64}$/.test(payload.rev)) {
    throw new Error("Sesión inválida");
  }
  return payload;
};

const matchesSession = (payload, user) =>
  timingSafeEqual(Buffer.from(payload.rev, "hex"), revision(user.passwordHash, getJwtSecret()));

module.exports = { signSession, verifySession, matchesSession };
