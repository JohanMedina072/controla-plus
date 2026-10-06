import { REMINDERS_URL } from './api'
import { requestJson } from './http'

export const getReminders = async () => {
  return requestJson(
    REMINDERS_URL,
    {},
    'No se pudieron obtener los recordatorios',
  )
}

export const saveReminder = async ({ reminderId, data }) => {
  const isEditing = Boolean(reminderId)

  return requestJson(
    isEditing ? `${REMINDERS_URL}/${reminderId}` : REMINDERS_URL,
    {
      method: isEditing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
    'No se pudo guardar el recordatorio',
  )
}

export const completeReminder = async (reminderId) => {
  return requestJson(
    `${REMINDERS_URL}/${reminderId}/complete`,
    {
      method: 'PATCH',
    },
    'No se pudo marcar el recordatorio como pagado',
  )
}

export const removeReminder = async (reminderId) => {
  return requestJson(
    `${REMINDERS_URL}/${reminderId}`,
    {
      method: 'DELETE',
    },
    'No se pudo eliminar el recordatorio',
  )
}
