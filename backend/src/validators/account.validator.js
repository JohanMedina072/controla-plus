const MAX_INITIAL_BALANCE = 99999999.99;
const MAX_NAME_LENGTH = 80;

const validateAccountPayload = (payload = {}) => {
  const { name, initialBalance } = payload;

  if (typeof name !== "string" || !name.trim()) {
    return "name es obligatorio";
  }

  if (name.trim().length > MAX_NAME_LENGTH) {
    return `name no puede superar ${MAX_NAME_LENGTH} caracteres`;
  }

  if (
    initialBalance === undefined ||
    initialBalance === null ||
    initialBalance === ""
  ) {
    return "initialBalance es obligatorio";
  }

  const numericBalance = Number(initialBalance);

  if (!Number.isFinite(numericBalance) || numericBalance < 0) {
    return "initialBalance debe ser un número mayor o igual que cero";
  }

  if (numericBalance > MAX_INITIAL_BALANCE) {
    return "initialBalance no puede superar 99,999,999.99";
  }

  const decimalPart = numericBalance.toString().split(".")[1];

  if (decimalPart && decimalPart.length > 2) {
    return "initialBalance solo puede tener hasta dos decimales";
  }

  return null;
};

module.exports = {
  validateAccountPayload,
};
