const VALID_TYPES = ['INCOME', 'EXPENSE']
const MAX_AMOUNT = 99999999.99
const MAX_DESCRIPTION_LENGTH = 255

const validateMovement = (formData) => {
  if (!VALID_TYPES.includes(formData.type)) {
    return 'Selecciona un tipo de movimiento válido.'
  }

  if (formData.amount === '' || formData.amount === null) {
    return 'Ingresa un monto.'
  }

  const numericAmount = Number(formData.amount)

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return 'Ingresa un monto mayor que cero.'
  }

  if (numericAmount > MAX_AMOUNT) {
    return 'El monto no puede superar S/ 99,999,999.99.'
  }

  const decimalPart = numericAmount.toString().split('.')[1]

  if (decimalPart && decimalPart.length > 2) {
    return 'El monto solo puede tener hasta dos decimales.'
  }

  if (!formData.categoryId) {
    return 'Selecciona una categoría.'
  }

  if (!formData.paymentMethodId) {
    return 'Selecciona un método de pago.'
  }

  if (
    typeof formData.description !== 'string' ||
    formData.description.trim().length > MAX_DESCRIPTION_LENGTH
  ) {
    return `La descripción no puede superar ${MAX_DESCRIPTION_LENGTH} caracteres.`
  }

  return ''
}

export default validateMovement
