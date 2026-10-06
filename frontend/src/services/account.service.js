import { ACCOUNTS_URL } from './api'
import { requestJson } from './http'

export const getAccounts = async () => {
  return requestJson(
    ACCOUNTS_URL,
    {},
    'No se pudieron obtener las cuentas',
  )
}

export const saveAccount = async (data) => {
  return requestJson(
    ACCOUNTS_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
    'No se pudo crear la cuenta',
  )
}
