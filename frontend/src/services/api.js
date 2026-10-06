const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
).replace(/\/$/, '')

export const API_URL = `${API_BASE_URL}/movements`

export const CATALOG_URL = `${API_BASE_URL}/catalog`

export const ACCOUNTS_URL = `${API_BASE_URL}/accounts`

export const REMINDERS_URL = `${API_BASE_URL}/reminders`

export const AUTH_URL = `${API_BASE_URL}/auth`
