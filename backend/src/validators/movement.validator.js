const MOVEMENT_TYPES = ["INCOME", "EXPENSE"];
const MAX_AMOUNT = 99999999.99;
const MAX_DESCRIPTION_LENGTH = 255;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUuid = (value) =>
  typeof value === "string" && UUID_PATTERN.test(value);

const validateMovementPayload = (payload = {}) => {
  const {
    type,
    amount,
    description,
    categoryId,
    paymentMethodId,
    date,
  } = payload;

  if (!MOVEMENT_TYPES.includes(type)) {
    return "type debe ser INCOME o EXPENSE";
  }

  if (amount === undefined || amount === null || amount === "") {
    return "amount es obligatorio";
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return "amount debe ser un número mayor que cero";
  }

  if (numericAmount > MAX_AMOUNT) {
    return "amount no puede superar 99,999,999.99";
  }

  const decimalPart = numericAmount.toString().split(".")[1];

  if (decimalPart && decimalPart.length > 2) {
    return "amount solo puede tener hasta dos decimales";
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    return "description debe ser texto";
  }

  if (
    typeof description === "string" &&
    description.trim().length > MAX_DESCRIPTION_LENGTH
  ) {
    return `description no puede superar ${MAX_DESCRIPTION_LENGTH} caracteres`;
  }

  if (!isValidUuid(categoryId)) {
    return "categoryId debe ser un UUID válido";
  }

  if (!isValidUuid(paymentMethodId)) {
    return "paymentMethodId debe ser un UUID válido";
  }

  if (
    date !== undefined &&
    date !== null &&
    (typeof date !== "string" || Number.isNaN(new Date(date).getTime()))
  ) {
    return "date debe contener una fecha válida";
  }

  return null;
};

const validateMovementId = (id) =>
  isValidUuid(id) ? null : "El id del movimiento no es válido";

module.exports = {
  validateMovementPayload,
  validateMovementId,
};
