const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
).replace(/\/$/, '')

export const API_URL = `${API_BASE_URL}/movements`

export const CATALOG_URL = `${API_BASE_URL}/catalog`
