const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

export const parseDateOnly = (value) => {
  if (!value) return null

  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)

  if (![year, month, day].every(Number.isInteger)) return null

  return new Date(year, month - 1, day)
}

export const getReminderDueDate = (reminder, referenceDate = new Date()) => {
  const configuredDate = parseDateOnly(reminder.nextDueDate)

  if (configuredDate) return configuredDate

  // Fallback only for data created by the previous reminder version.
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()

  return new Date(year, month, Math.min(Number(reminder.dueDay), lastDay))
}

export const getReminderStatus = (
  reminder,
  referenceDate = new Date(),
) => {
  const today = startOfDay(referenceDate)
  const dueDate = getReminderDueDate(reminder, referenceDate)
  const daysUntilDue = Math.round(
    (dueDate.getTime() - today.getTime()) / 86400000,
  )

  if (daysUntilDue < 0) {
    return {
      label: 'Vencido',
      className: 'overdue',
      dueDate,
    }
  }

  if (daysUntilDue === 0) {
    return {
      label: 'Vence hoy',
      className: 'upcoming',
      dueDate,
    }
  }

  if (daysUntilDue <= 7) {
    return {
      label: 'Próximo',
      className: 'upcoming',
      dueDate,
    }
  }

  return {
    label: 'Pendiente',
    className: 'pending',
    dueDate,
  }
}

export const formatReminderDate = (date) =>
  new Intl.DateTimeFormat('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
