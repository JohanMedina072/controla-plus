import { API_URL, CATALOG_URL } from './api'
import { requestJson } from './http'

export const getMovements = async () => {
  return requestJson(
    API_URL,
    {},
    'No se pudieron obtener los movimientos',
  )
}

export const getCatalog = async () => {
  return requestJson(
    CATALOG_URL,
    {},
    'No se pudo obtener el catálogo',
  )
}

export const saveMovement = async ({ movementId, data }) => {
  const isEditing = Boolean(movementId)

  return requestJson(
    isEditing ? `${API_URL}/${movementId}` : API_URL,
    {
      method: isEditing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
    'No se pudo guardar el movimiento',
  )
}

export const removeMovement = async (movementId) => {
  return requestJson(
    `${API_URL}/${movementId}`,
    {
      method: 'DELETE',
    },
    'No se pudo eliminar el movimiento',
  )
}
