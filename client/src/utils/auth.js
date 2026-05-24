const AUTH_EVENT = 'auth-changed'

export function getAuthUser() {
  const raw = localStorage.getItem('user')
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function isLoggedIn() {
  return !!localStorage.getItem('accessToken')
}

export function setAuth(data) {
  if (data.accessToken) localStorage.setItem('accessToken', data.accessToken)
  if (data.user) localStorage.setItem('user', JSON.stringify(data.user))
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export function clearAuth() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('user')
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export function subscribeAuth(handler) {
  window.addEventListener(AUTH_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(AUTH_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}