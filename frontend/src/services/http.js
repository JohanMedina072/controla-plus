export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const requestJson = async (
  url,
  options = {},
  fallbackMessage = 'No se pudo completar la solicitud',
) => {
  let response

  try {
    response = await fetch(url, options)
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.',
    )
  }

  const rawBody = await response.text()
  let result = null

  if (rawBody) {
    try {
      result = JSON.parse(rawBody)
    } catch {
      if (!response.ok) {
        throw new ApiError(fallbackMessage, response.status)
      }

      throw new ApiError(
        'El servidor devolvió una respuesta no válida.',
        response.status,
      )
    }
  }

  if (!response.ok) {
    throw new ApiError(
      result?.message || fallbackMessage,
      response.status,
    )
  }

  return result?.data
}
