const TOKEN_KEY = 'writePrompt.accessToken'
const MEMBER_KEY = 'writePrompt.member'

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY)
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

export function saveSession({ accessToken, member }) {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken)
  if (member) localStorage.setItem(MEMBER_KEY, JSON.stringify(member))
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(MEMBER_KEY)
}
