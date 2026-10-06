const MAX_INITIAL_BALANCE = 99999999.99
const MAX_NAME_LENGTH = 80

const validateAccount = (formData) => {
  if (
    typeof formData.name !== 'string' ||
    !formData.name.trim()
  ) {
    return 'Ingresa el nombre de la cuenta.'
  }

  if (formData.name.trim().length > MAX_NAME_LENGTH) {
    return `El nombre no puede superar ${MAX_NAME_LENGTH} caracteres.`
  }

  if (
    formData.initialBalance === '' ||
    formData.initialBalance === null
  ) {
    return 'Ingresa el saldo inicial.'
  }

  const numericBalance = Number(formData.initialBalance)

  if (!Number.isFinite(numericBalance) || numericBalance < 0) {
    return 'El saldo inicial debe ser cero o mayor.'
  }

  if (numericBalance > MAX_INITIAL_BALANCE) {
    return 'El saldo inicial no puede superar S/ 99,999,999.99.'
  }

  const decimalPart = numericBalance.toString().split('.')[1]

  if (decimalPart && decimalPart.length > 2) {
    return 'El saldo inicial solo puede tener hasta dos decimales.'
  }

  return ''
}

export default validateAccount
