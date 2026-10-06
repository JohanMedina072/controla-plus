const REMINDER_TYPES = ["CREDIT_CARD", "CREDIT"];
const CREDIT_CARD_NAMES = ["Tarjeta BCP", "Tarjeta IO"];
const CREDIT_NAMES = ["Crédito BCP", "Crédito Yape"];
const MAX_AMOUNT = 99999999.99;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUuid = (value) =>
  typeof value === "string" && UUID_PATTERN.test(value);

const getAllowedNames = (type) => {
  if (type === "CREDIT_CARD") return CREDIT_CARD_NAMES;
  if (type === "CREDIT") return CREDIT_NAMES;
  return [];
};

const isValidDateOnly = (value) => {
  if (typeof value !== "string" || !DATE_ONLY_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const validateReminderPayload = (payload = {}) => {
  const { type, name, nextDueDate, amount } = payload;

  if (!REMINDER_TYPES.includes(type)) {
    return "type debe ser CREDIT_CARD o CREDIT";
  }

  if (!getAllowedNames(type).includes(name)) {
    return "name no corresponde al tipo de recordatorio seleccionado";
  }

  if (!isValidDateOnly(nextDueDate)) {
    return "nextDueDate debe tener una fecha válida con formato YYYY-MM-DD";
  }

  if (amount === undefined || amount === null || amount === "") {
    return null;
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

  return null;
};

const validateReminderId = (id) =>
  isValidUuid(id) ? null : "El id del recordatorio no es válido";

module.exports = {
  validateReminderPayload,
  validateReminderId,
  isValidDateOnly,
};
