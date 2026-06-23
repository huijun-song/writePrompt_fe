const TOKEN_KEY = 'writePrompt.accessToken'
const REFRESH_TOKEN_KEY = 'writePrompt.refreshToken'
const MEMBER_KEY = 'writePrompt.member'

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getCurrentMember() {
  const raw = localStorage.getItem(MEMBER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveSession({ accessToken, refreshToken, member }) {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  if (member) localStorage.setItem(MEMBER_KEY, JSON.stringify(member))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(MEMBER_KEY)
}

export const logout = clearSession
