export const AUTH_STORAGE_KEY = 'controla_auth'

export const getStoredAuth = () => {
  try {
    const rawValue = localStorage.getItem(AUTH_STORAGE_KEY)

    if (!rawValue) return null

    const parsedValue = JSON.parse(rawValue)

    if (!parsedValue?.token || !parsedValue?.user?.id) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    return parsedValue
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export const getStoredToken = () => getStoredAuth()?.token || ''

export const saveStoredAuth = (auth) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
}

export const clearStoredAuth = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}
