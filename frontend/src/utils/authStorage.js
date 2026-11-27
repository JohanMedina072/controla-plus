export const AUTH_STORAGE_KEY = 'controla_auth'

export const getStoredAuth = () => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    const rawValue = sessionStorage.getItem(AUTH_STORAGE_KEY)

    if (!rawValue) return null

    const parsedValue = JSON.parse(rawValue)

    if (!parsedValue?.token || !parsedValue?.user?.id) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    return parsedValue
  } catch {
    return null
  }
}

export const getStoredToken = () => getStoredAuth()?.token || ''

export const saveStoredAuth = (auth) => {
  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
}

export const clearStoredAuth = () => {
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
}
