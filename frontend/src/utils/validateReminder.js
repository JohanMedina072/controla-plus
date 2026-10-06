const MAX_AMOUNT = 99999999.99

const REMINDER_NAMES = {
  CREDIT_CARD: ['Tarjeta BCP', 'Tarjeta IO'],
  CREDIT: ['Crédito BCP', 'Crédito Yape'],
}

const isValidDateOnly = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

const validateReminder = (formData) => {
  if (!REMINDER_NAMES[formData.type]?.includes(formData.name)) {
    return 'Selecciona un tipo y nombre de recordatorio válidos.'
  }

  if (!isValidDateOnly(formData.nextDueDate)) {
    return 'Selecciona la fecha del próximo pago, incluido el mes.'
  }

  if (formData.amount === '' || formData.amount === null) {
    return ''
  }

  const numericAmount = Number(formData.amount)

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return 'El monto debe ser mayor que cero.'
  }

  if (numericAmount > MAX_AMOUNT) {
    return 'El monto no puede superar S/ 99,999,999.99.'
  }

  const decimalPart = numericAmount.toString().split('.')[1]

  if (decimalPart && decimalPart.length > 2) {
    return 'El monto solo puede tener hasta dos decimales.'
  }

  return ''
}

export default validateReminder
