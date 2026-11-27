const bcrypt = require("bcryptjs");

const BCRYPT_ROUNDS = 12;
const isBcryptHash = (value) => /^\$2[aby]\$(?:0[4-9]|[12]\d|3[01])\$[./A-Za-z0-9]{53}$/.test(value);
const validBcryptLength = (password) => !bcrypt.truncates(password);
const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);

module.exports = { isBcryptHash, validBcryptLength, hashPassword };
