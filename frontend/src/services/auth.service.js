import { AUTH_URL } from './api'
import { requestJson } from './http'

const jsonOptions = (data) => ({
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
})

export const login = async (data) => {
  return requestJson(
    `${AUTH_URL}/login`,
    jsonOptions(data),
    'No se pudo iniciar sesión',
  )
}

export const register = async (data) => {
  return requestJson(
    `${AUTH_URL}/register`,
    jsonOptions(data),
    'No se pudo crear la cuenta',
  )
}
