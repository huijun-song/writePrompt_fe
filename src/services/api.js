import { clearSession, getAccessToken, getCurrentMember, getRefreshToken, saveSession } from './session'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
const LEGACY_API_ORIGIN = 'http://43.200.202.174:8080'

function withBaseUrl(path) {
  if (path.startsWith(LEGACY_API_ORIGIN)) {
    return `${API_BASE_URL}${path.slice(LEGACY_API_ORIGIN.length)}`
  }

  if (/^https?:\/\//.test(path)) return path
  return `${API_BASE_URL}${path}`
}

function normalizeImageUrl(data) {
  const imageUrl = (
    typeof data === 'string'
      ? data
      : data?.imageUrl || data?.imageURL || data?.url || data?.fileUrl || data?.path
  )?.trim()

  if (!imageUrl) {
    throw new Error('이미지 URL을 찾을 수 없습니다.')
  }

  if (imageUrl.startsWith(LEGACY_API_ORIGIN)) {
    return withBaseUrl(imageUrl)
  }

  if (/^(https?:|data:image\/|blob:)/.test(imageUrl)) {
    return imageUrl
  }

  return withBaseUrl(imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`)
}

function normalizeOptionalImageUrl(data) {
  try {
    return normalizeImageUrl(data)
  } catch {
    return ''
  }
}

function normalizeQuizImage(quiz) {
  return {
    ...quiz,
    image: normalizeOptionalImageUrl(quiz?.image || quiz?.imageUrl || quiz?.url || quiz?.quiz?.image || quiz?.quiz?.imageUrl || quiz?.quiz?.url),
  }
}

function normalizeQuizList(quizList) {
  return (quizList || []).map((quiz) => normalizeQuizImage(quiz))
}

function toApiImagePath(imageUrl) {
  if (!imageUrl) return imageUrl

  if (imageUrl.startsWith('/uploads/images/')) {
    return imageUrl
  }

  if (API_BASE_URL && imageUrl.startsWith(API_BASE_URL)) {
    const path = imageUrl.slice(API_BASE_URL.length)
    return path.startsWith('/uploads/images/') ? path : imageUrl
  }

  if (imageUrl.startsWith(LEGACY_API_ORIGIN)) {
    const path = imageUrl.slice(LEGACY_API_ORIGIN.length)
    return path.startsWith('/uploads/images/') ? path : imageUrl
  }

  try {
    const url = new URL(imageUrl)
    return url.pathname.startsWith('/uploads/images/') ? url.pathname : imageUrl
  } catch {
    return imageUrl
  }
}

function extractList(payload, keys = []) {
  const candidates = [
    payload?.data,
    payload?.result,
    payload,
    ...keys.map((key) => payload?.data?.[key]),
    ...keys.map((key) => payload?.[key]),
    payload?.data?.content,
    payload?.data?.list,
    payload?.content,
    payload?.list,
  ]

  return candidates.find((candidate) => Array.isArray(candidate)) || []
}

let refreshPromise = null

function getPayloadData(payload) {
  return payload?.data ?? payload?.result ?? payload
}

function getTokenFromPayload(payload, key) {
  const data = getPayloadData(payload)

  if (typeof data === 'string' && key === 'accessToken') {
    return data
  }

  return data?.[key] ?? payload?.[key] ?? data?.token?.[key] ?? data?.tokens?.[key]
}

async function request(path, options = {}) {
  const { timeoutMs = 10000, auth = true, retryOnAuthError = auth, ...fetchOptions } = options
  const token = getAccessToken()
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)
  const isFormData = fetchOptions.body instanceof FormData
  const headers = {
    ...(fetchOptions.headers || {}),
  }

  if (fetchOptions.body && !isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  if (auth && token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    const response = await fetch(withBaseUrl(path), {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    })

    const text = await response.text()
    const contentType = response.headers.get('content-type') || ''
    const payload = text
      ? contentType.includes('application/json')
        ? JSON.parse(text)
        : text
      : {}

    if (!response.ok) {
      if (response.status === 401 && retryOnAuthError) {
        await refreshAccessToken()
        return request(path, {
          ...options,
          retryOnAuthError: false,
        })
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error('로그인이 만료되었거나 인증 정보가 없습니다. 다시 로그인해주세요.')
      }

      throw new Error(payload.message || '요청을 처리하지 못했습니다.')
    }

    return payload
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.')
    }
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}

function normalizeRole(role) {
  if (role === '교사') return 'TEACHER'
  if (role === '학생') return 'STUDENT'
  return role || 'STUDENT'
}

export async function login(credentials) {
  const payload = await request('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(credentials),
  })
  const data = getPayloadData(payload)
  const memberData = data?.member ?? data?.memberInfo ?? data?.user ?? data?.userInfo

  const member = {
    ...memberData,
    role: normalizeRole(memberData?.role),
  }

  saveSession({
    accessToken: getTokenFromPayload(payload, 'accessToken'),
    refreshToken: getTokenFromPayload(payload, 'refreshToken'),
    member,
  })

  return member
}

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    clearSession()
    throw new Error('로그인이 만료되었습니다. 다시 로그인해주세요.')
  }

  refreshPromise ||= request('/api/auth/refresh', {
    method: 'POST',
    auth: false,
    retryOnAuthError: false,
    body: JSON.stringify({ refreshToken }),
  })
    .then((payload) => {
      const accessToken = getTokenFromPayload(payload, 'accessToken')
      const nextRefreshToken = getTokenFromPayload(payload, 'refreshToken')

      if (!accessToken) {
        throw new Error('Access Token 재발급에 실패했습니다.')
      }

      saveSession({
        accessToken,
        refreshToken: nextRefreshToken,
      })

      return accessToken
    })
    .catch((error) => {
      clearSession()
      throw error
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

export async function logout() {
  const refreshToken = getRefreshToken()

  try {
    if (refreshToken) {
      await request('/api/auth/logout', {
        method: 'POST',
        auth: false,
        retryOnAuthError: false,
        body: JSON.stringify({ refreshToken }),
      })
    }
  } catch {
    // Local logout should still complete even if the server-side token cleanup fails.
  } finally {
    clearSession()
  }
}

export function signup(data) {
  const payload = {
    email: data.email,
    password: data.password,
    role: normalizeRole(data.role),
    nickname: data.nickname,
    age: data.age,
    gender: data.gender,
    profile: data.profile || 'default',
  }

  return request('/api/members', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(payload),
  })
}

export async function uploadProfileImage(file) {
  const formData = new FormData()
  formData.append('file', file)

  const payload = await request('/api/uploads/profile', {
    method: 'POST',
    timeoutMs: 30000,
    body: formData,
  })
  const data = getPayloadData(payload)
  const imageUrl = typeof data === 'string' ? data : data?.imageUrl || data?.url || data?.fileUrl || data?.path

  if (!imageUrl) {
    throw new Error('업로드된 프로필 이미지 URL을 찾을 수 없습니다.')
  }

  return imageUrl
}

export async function fetchQuizRooms() {
  const payload = await request('/api/play', { timeoutMs: 10000 })
  const rooms = extractList(payload, ['quizRoomList', 'quizRooms', 'rooms'])

  return Promise.all(
    rooms.map(async (room) => {
      const roomId = room?.quizRoomId || room?.quizroomId || room?.id

      if (!roomId) {
        return room
      }

      try {
        const detail = await fetchQuizRoom(roomId)
        return {
          ...room,
          ...detail,
          quizList: normalizeQuizList(detail?.quizList || room?.quizList || []),
        }
      } catch {
        return {
          ...room,
          quizList: normalizeQuizList(room?.quizList || []),
        }
      }
    }),
  )
}

export async function fetchQuizRoom(id) {
  const payload = await request(`/api/play/${id}`, { timeoutMs: 10000 })
  const room = payload.data

  return {
    ...room,
    quizList: normalizeQuizList(room?.quizList || []),
  }
}

export async function fetchTeacherQuizzes() {
  const payload = await request('/api/quiz')
  return extractList(payload, ['quizList', 'quizzes'])
}

export async function fetchTeacherQuizRooms() {
  const payload = await request('/api/quizroom')
  return extractList(payload, ['quizRoomList', 'quizRooms', 'rooms'])
}

export async function fetchTeacherQuizRoom(id) {
  const payload = await request(`/api/quizroom/${id}`)
  return payload?.data ?? payload
}

export async function generateImage(prompt) {
  const payload = await request('/api/ai/image', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
    timeoutMs: 60000,
  })

  return normalizeImageUrl(payload?.data ?? payload)
}

export async function compareImages(answerImageUrl, studentImageUrl) {
  const payload = await request('/api/ai/compare', {
    method: 'POST',
    timeoutMs: 60000,
    body: JSON.stringify({
      answerImageUrl: toApiImagePath(answerImageUrl),
      studentImageUrl: toApiImagePath(studentImageUrl),
    }),
  })

  return payload.data
}

export async function submitFinalFeedback(roomId, results) {
  const payload = await request(`/api/play/answer/${roomId}`, {
    method: 'POST',
    timeoutMs: 60000,
    body: JSON.stringify({ results }),
  })

  return payload.data
}

export async function increaseQuizRoomLike(roomId) {
  const payload = await request(`/api/play/like/${roomId}`, {
    method: 'POST',
  })

  return payload.data
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null)
}

function extractQuizRoomTitle(value) {
  return firstDefined(
    value?.quizRoomTitle,
    value?.quizRoomName,
    value?.roomTitle,
    value?.roomName,
    value?.quizTitle,
    value?.title,
    value?.name,
    value?.quizRoom?.quizRoomTitle,
    value?.quizRoom?.quizRoomName,
    value?.quizRoom?.roomTitle,
    value?.quizRoom?.roomName,
    value?.quizRoom?.title,
    value?.quizRoom?.name,
    value?.quizRoomResponse?.title,
    value?.quizRoomResponse?.name,
    value?.quizRoomDto?.title,
    value?.quizRoomDto?.name,
  )
}

function normalizeQuizResult(result) {
  return {
    ...result,
    id: firstDefined(result?.id, result?.resultId, result?.quizResultId),
    quizRoomId: firstDefined(result?.quizRoomId, result?.quizroomId, result?.roomId, result?.quizRoom?.id),
    quizRoomTitle: extractQuizRoomTitle(result),
    score: Number(firstDefined(result?.score, result?.point, result?.totalScore)) || 0,
    feedback: firstDefined(result?.feedback, result?.finalFeedback, result?.aiFeedback, ''),
    createdTime: firstDefined(result?.createdTime, result?.createdAt, result?.date, result?.solvedAt),
  }
}

async function enrichQuizRoomTitles(profile) {
  const missingRoomIds = [
    ...new Set(
      (profile.quizResults || [])
        .filter((result) => result.quizRoomId && !result.quizRoomTitle)
        .map((result) => result.quizRoomId),
    ),
  ]

  if (missingRoomIds.length === 0) return profile

  const titleEntries = await Promise.all(
    missingRoomIds.map(async (roomId) => {
      try {
        const room = await fetchQuizRoom(roomId)
        return [roomId, extractQuizRoomTitle(room)]
      } catch {
        return [roomId, null]
      }
    }),
  )
  const titlesByRoomId = Object.fromEntries(titleEntries.filter(([, title]) => title))

  return {
    ...profile,
    quizResults: profile.quizResults.map((result) => ({
      ...result,
      quizRoomTitle: result.quizRoomTitle || titlesByRoomId[result.quizRoomId] || '',
    })),
  }
}

function normalizeMyPageProfile(profile) {
  const quizResults = firstDefined(
    profile?.quizResults,
    profile?.quizResultList,
    profile?.learningRecords,
    profile?.histories,
    profile?.results,
    [],
  )
  const normalizedResults = Array.isArray(quizResults) ? quizResults.map(normalizeQuizResult) : []
  const averageScore = Number(firstDefined(profile?.averageScore, profile?.avgScore, profile?.scoreAverage))
  const solvedCount = Number(
    firstDefined(profile?.solvedCount, profile?.solvedCnt, profile?.quizResultCount, profile?.completedCount),
  )
  const highestScore = Number(firstDefined(profile?.highestScore, profile?.highScore, profile?.maxScore, profile?.bestScore))
  const resultScores = normalizedResults.map((result) => Number(result.score)).filter(Number.isFinite)

  return {
    ...profile,
    role: normalizeRole(profile?.role),
    profile: normalizeOptionalImageUrl(profile?.profile),
    averageScore: Number.isFinite(averageScore)
      ? averageScore
      : resultScores.length
        ? resultScores.reduce((sum, score) => sum + score, 0) / resultScores.length
        : 0,
    solvedCount: Number.isFinite(solvedCount) ? solvedCount : normalizedResults.length,
    highestScore: Number.isFinite(highestScore) ? highestScore : resultScores.length ? Math.max(...resultScores) : 0,
    quizResults: normalizedResults,
  }
}

function parseJsonObject(value) {
  if (typeof value !== 'string') return value

  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function hasMemberShape(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      (value.id ||
        value.email ||
        value.nickname ||
        value.role ||
        value.quizResults ||
        value.quizResultList ||
        value.learningRecords),
  )
}

function extractMemberProfile(payload) {
  const parsedPayload = parseJsonObject(payload)
  const candidates = [
    parsedPayload?.data,
    parsedPayload?.result,
    parsedPayload?.member,
    parsedPayload?.profile,
    parsedPayload?.user,
    parsedPayload?.memberInfo,
    parsedPayload?.userInfo,
    parsedPayload?.myPage,
    parsedPayload,
  ]

  for (const candidate of candidates) {
    const parsedCandidate = parseJsonObject(candidate)

    if (hasMemberShape(parsedCandidate)) {
      return parsedCandidate
    }

    const nested = [
      parsedCandidate?.data,
      parsedCandidate?.result,
      parsedCandidate?.member,
      parsedCandidate?.profile,
      parsedCandidate?.user,
      parsedCandidate?.memberInfo,
      parsedCandidate?.userInfo,
      parsedCandidate?.myPage,
    ]

    const found = nested.map(parseJsonObject).find(hasMemberShape)
    if (found) return found
  }

  return null
}

export async function fetchMyPage() {
  const payload = await request('/api/members/me')
  const profile = extractMemberProfile(payload) || getCurrentMember()

  if (!profile || typeof profile !== 'object') {
    throw new Error('마이페이지 정보를 불러오지 못했습니다.')
  }

  return enrichQuizRoomTitles(normalizeMyPageProfile(profile))
}

export async function updateMyPage(data) {
  const payload = {
    nickname: data.nickname,
    age: data.age,
    gender: data.gender,
    profile: data.profile || 'default',
  }

  const response = await request('/api/members/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  const profile = extractMemberProfile(response) || response.data

  const member = {
    ...profile,
    role: normalizeRole(profile?.role),
    profile: normalizeOptionalImageUrl(profile?.profile),
  }

  saveSession({
    member,
  })

  return member
}

export async function deleteMyPage() {
  try {
    await request('/api/members/me', {
      method: 'DELETE',
    })
  } finally {
    clearSession()
  }
}

export async function generatePrompt(data) {
  const payload = await request('/api/ai/prompt', {
    method: 'POST',
    timeoutMs: 60000,
    body: JSON.stringify(data),
  })

  return payload.data
}

export function createQuiz(data) {
  return request('/api/quiz', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
    },
    body: JSON.stringify({
      title: data.title,
      image: data.image,
      level: data.level,
    }),
  })
}

export function updateQuiz(quizId, title) {
  return request(`/api/quiz/${quizId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8',
    },
    body: title,
  })
}

export function deleteQuiz(quizId) {
  return request(`/api/quiz/${quizId}`, {
    method: 'DELETE',
  })
}

export function createQuizRoom(data) {
  return request('/api/quizroom', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateQuizRoom(roomId, data) {
  return request(`/api/quizroom/${roomId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteQuizRoom(roomId) {
  return request(`/api/quizroom/${roomId}`, {
    method: 'DELETE',
  })
}
