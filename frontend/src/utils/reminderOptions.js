export const REMINDER_TYPES = [
  { value: 'CREDIT_CARD', label: 'Tarjeta de crédito' },
  { value: 'CREDIT', label: 'Crédito' },
]

export const REMINDER_NAMES = {
  CREDIT_CARD: ['Tarjeta BCP', 'Tarjeta IO'],
  CREDIT: ['Crédito BCP', 'Crédito Yape'],
}

export const getReminderTypeLabel = (type) =>
  REMINDER_TYPES.find((item) => item.value === type)?.label || type
