import { API_URL, CATALOG_URL } from './api'

const readResponse = async (response, fallbackMessage) => {
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || fallbackMessage)
  }

  return result.data
}

export const getMovements = async () => {
  const response = await fetch(API_URL)

  return readResponse(
    response,
    'No se pudieron obtener los movimientos',
  )
}

export const getCatalog = async (userId) => {
  const response = await fetch(`${CATALOG_URL}?userId=${userId}`)

  return readResponse(response, 'No se pudo obtener el catálogo')
}

export const saveMovement = async ({ movementId, data }) => {
  const isEditing = Boolean(movementId)

  const response = await fetch(
    isEditing ? `${API_URL}/${movementId}` : API_URL,
    {
      method: isEditing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  )

  return readResponse(
    response,
    'No se pudo guardar el movimiento',
  )
}

export const removeMovement = async (movementId) => {
  const response = await fetch(`${API_URL}/${movementId}`, {
    method: 'DELETE',
  })

  return readResponse(
    response,
    'No se pudo eliminar el movimiento',
  )
}