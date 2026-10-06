const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 160;
const MIN_PASSWORD_LENGTH = 8;

const validateRegisterPayload = (payload = {}) => {
  const { name, email, password } = payload;

  if (typeof name !== "string" || !name.trim()) {
    return "El nombre es obligatorio";
  }

  if (name.trim().length > MAX_NAME_LENGTH) {
    return `El nombre no puede superar ${MAX_NAME_LENGTH} caracteres`;
  }

  if (typeof email !== "string" || !email.trim()) {
    return "El correo es obligatorio";
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (
    normalizedEmail.length > MAX_EMAIL_LENGTH ||
    !EMAIL_PATTERN.test(normalizedEmail)
  ) {
    return "El correo no tiene un formato válido";
  }

  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;
  }

  if (password.length > 128) {
    return "La contraseña no puede superar 128 caracteres";
  }

  return null;
};

const validateLoginPayload = (payload = {}) => {
  const { email, password } = payload;

  if (typeof email !== "string" || !email.trim()) {
    return "El correo es obligatorio";
  }

  if (typeof password !== "string" || !password) {
    return "La contraseña es obligatoria";
  }

  return null;
};

const validateProfilePayload = (payload = {}) => {
  const { name, email, currentPassword, newPassword } = payload;

  if (typeof name !== "string" || !name.trim()) {
    return "El nombre es obligatorio";
  }

  if (name.trim().length > MAX_NAME_LENGTH) {
    return `El nombre no puede superar ${MAX_NAME_LENGTH} caracteres`;
  }

  if (typeof email !== "string" || !email.trim()) {
    return "El correo es obligatorio";
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (
    normalizedEmail.length > MAX_EMAIL_LENGTH ||
    !EMAIL_PATTERN.test(normalizedEmail)
  ) {
    return "El correo no tiene un formato válido";
  }

  if (typeof currentPassword !== "string" || !currentPassword) {
    return "Debes escribir tu contraseña actual para guardar cambios";
  }

  if (newPassword !== undefined && newPassword !== "") {
    if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LENGTH) {
      return `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;
    }

    if (newPassword.length > 128) {
      return "La nueva contraseña no puede superar 128 caracteres";
    }
  }

  return null;
};

module.exports = {
  validateRegisterPayload,
  validateLoginPayload,
  validateProfilePayload,
};
