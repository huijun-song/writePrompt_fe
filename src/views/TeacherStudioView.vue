<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  createQuiz,
  createQuizRoom,
  deleteQuiz,
  deleteQuizRoom,
  fetchTeacherQuizRooms,
  fetchTeacherQuizzes,
  generateImage,
  generatePrompt,
  updateQuiz,
  updateQuizRoom,
} from '../services/api'
import { getCurrentMember } from '../services/session'

const view = ref('dashboard')
const step = ref('prompt')
const loading = ref('')
const message = ref('')
const dashboardMessage = ref('')
const generatedPrompt = ref('')
const generatedImage = ref('')
const editingQuizId = ref(null)
const editingRoomId = ref(null)
const isRoomModalOpen = ref(false)

const teacherQuizzes = ref([])
const teacherRooms = ref([])

const promptForm = reactive({
  level: '중급',
  levelGuide: '구체적인 묘사와 조건을 적절히 포함합니다.',
  background: '아침 숲속',
  theme: '자연',
  emotion: '기쁨',
  character: '동물',
  artMedia: '연필 드로잉',
  color: '생생한 색감',
  cameraShot: '클로즈업',
})

const quizForm = reactive({
  title: '',
  image: '',
  level: '중급',
})

const editQuizForm = reactive({
  title: '',
})

const roomForm = reactive({
  title: '',
  level: '중급',
  description: '',
  state: 'CLOSED',
  selectedQuizIds: [],
})

const keywordGroups = [
  { key: 'level', title: '난이도', options: ['초급', '중급', '고급'] },
  {
    key: 'levelGuide',
    title: '난이도 반영 방식',
    options: [
      '핵심 대상과 분위기만 간단히 표현합니다.',
      '구체적인 묘사와 조건을 적절히 포함합니다.',
      '세부 요소, 구도, 분위기를 정교하게 조합합니다.',
    ],
  },
  { key: 'background', title: '배경', options: ['실내', '실외', '아침 숲속', '밤의 도시'] },
  { key: 'theme', title: '주제', options: ['자연', '스토리텔링', '판타지 및 마법', '역사적', '일상'] },
  { key: 'emotion', title: '감정/분위기', options: ['기쁨', '에너지 넘침', '희망', '평화로움', '아늑함'] },
  { key: 'character', title: '캐릭터', options: ['동물', '인간', '판타지 캐릭터', '없음'] },
  { key: 'artMedia', title: '그림체/매체', options: ['연필 드로잉', '그래피티', '수채화', '3D'] },
  { key: 'color', title: '색감', options: ['생생한 색감', '어두운 색감', '파스텔 색감'] },
  { key: 'cameraShot', title: '카메라 구도', options: ['클로즈업', '와이드 샷', '상단 시점', '낮은 시점'] },
]

const stats = computed(() => [
  { label: '생성된 퀴즈', value: teacherQuizzes.value.length },
  { label: '활성 퀴즈룸', value: teacherRooms.value.filter((room) => room.state === 'OPEN').length },
  { label: '참여 학생', value: teacherRooms.value.reduce((sum, room) => sum + (room.students || 0), 0) },
])

const selectedRoomQuizzes = computed(() =>
  roomForm.selectedQuizIds
    .map((quizId, index) => ({ quizId: Number(quizId), quizOrder: index + 1 }))
    .filter((item) => Number.isFinite(item.quizId)),
)

function normalizeQuiz(quiz, fallback = {}) {
  return {
    id: quiz?.quizId || quiz?.id || fallback.id,
    title: quiz?.title || fallback.title || '-',
    createdAt: quiz?.createdAt || quiz?.createdTime || fallback.createdAt || '-',
    level: quiz?.level || fallback.level || '중급',
    image: quiz?.image || quiz?.imageUrl || fallback.image || '',
  }
}

function normalizeRoom(room, fallback = {}) {
  const quizList = room?.quizList || room?.quizzes || room?.quizRoomQuizList || fallback.quizList || []

  return {
    id: room?.quizRoomId || room?.quizroomId || room?.id || fallback.id,
    title: room?.title || room?.roomTitle || room?.name || fallback.title || '-',
    students: room?.studentCount || room?.students || room?.participantCount || room?.participantCnt || 0,
    plays: room?.solvedCount || room?.solvedCnt || room?.playCount || room?.plays || 0,
    likes: room?.likeCount || room?.likeCnt || room?.likes || room?.like || 0,
    state: room?.state || fallback.state || 'CLOSED',
    level: room?.level || fallback.level || '중급',
    description: room?.description || fallback.description || '',
    quizList,
  }
}

function getQuizIdFromRoomItem(item) {
  return item?.quizId || item?.id || item?.quiz?.quizId || item?.quiz?.id
}

function getMemberId() {
  const member = getCurrentMember()
  return member?.id || member?.userId
}

async function loadTeacherQuizzes() {
  if (!getMemberId()) {
    dashboardMessage.value = '로그인한 교사 정보를 찾을 수 없습니다.'
    return
  }

  loading.value = 'dashboard'
  dashboardMessage.value = ''

  try {
    const quizzes = await fetchTeacherQuizzes()
    teacherQuizzes.value = quizzes.map((quiz) => normalizeQuiz(quiz))
  } catch (error) {
    dashboardMessage.value = error.message
  } finally {
    loading.value = ''
  }
}

async function loadTeacherRooms() {
  loading.value = 'rooms'
  dashboardMessage.value = ''

  try {
    const rooms = await fetchTeacherQuizRooms()
    teacherRooms.value = rooms.map((room) => normalizeRoom(room))
  } catch (error) {
    dashboardMessage.value = error.message
  } finally {
    loading.value = ''
  }
}

async function loadTeacherDashboard() {
  await loadTeacherQuizzes()
  await loadTeacherRooms()
}

function openCreator() {
  view.value = 'create'
  step.value = 'prompt'
  message.value = ''
}

function backToDashboard() {
  view.value = 'dashboard'
  step.value = 'prompt'
  message.value = ''
}

function openEditQuiz(quiz) {
  editingQuizId.value = quiz.id
  editQuizForm.title = quiz.title || ''
  dashboardMessage.value = ''
}

function closeEditQuiz() {
  editingQuizId.value = null
  editQuizForm.title = ''
}

function resetRoomForm() {
  roomForm.title = ''
  roomForm.level = '중급'
  roomForm.description = ''
  roomForm.state = 'CLOSED'
  roomForm.selectedQuizIds = []
}

function openRoomModal() {
  dashboardMessage.value = ''
  editingRoomId.value = null
  resetRoomForm()
  isRoomModalOpen.value = true
}

function openEditRoom(room) {
  dashboardMessage.value = ''
  editingRoomId.value = room.id
  roomForm.title = room.title || ''
  roomForm.level = room.level || '중급'
  roomForm.description = room.description || ''
  roomForm.state = room.state || 'CLOSED'
  roomForm.selectedQuizIds = (room.quizList || [])
    .map((item) => getQuizIdFromRoomItem(item))
    .filter(Boolean)
  isRoomModalOpen.value = true
}

function closeRoomModal() {
  isRoomModalOpen.value = false
  editingRoomId.value = null
}

async function runUpdateQuiz() {
  if (!editingQuizId.value) return

  loading.value = 'updateQuiz'
  dashboardMessage.value = ''

  try {
    const payload = await updateQuiz(editingQuizId.value, editQuizForm.title)
    const updatedQuiz = normalizeQuiz(payload?.data, {
      id: editingQuizId.value,
      title: editQuizForm.title,
    })

    teacherQuizzes.value = teacherQuizzes.value.map((quiz) =>
      quiz.id === editingQuizId.value ? { ...quiz, ...updatedQuiz } : quiz,
    )

    closeEditQuiz()
    await loadTeacherQuizzes()
  } catch (error) {
    dashboardMessage.value = error.message
  } finally {
    loading.value = ''
  }
}

async function runDeleteQuiz(quiz) {
  if (!window.confirm(`'${quiz.title}' 퀴즈를 삭제할까요?`)) return

  loading.value = `deleteQuiz:${quiz.id}`
  dashboardMessage.value = ''

  try {
    await deleteQuiz(quiz.id)
    teacherQuizzes.value = teacherQuizzes.value.filter((item) => item.id !== quiz.id)
    if (editingQuizId.value === quiz.id) {
      closeEditQuiz()
    }
    await loadTeacherQuizzes()
    await loadTeacherRooms()
  } catch (error) {
    dashboardMessage.value = error.message
  } finally {
    loading.value = ''
  }
}

async function runSaveRoom() {
  if (selectedRoomQuizzes.value.length === 0) {
    dashboardMessage.value = '퀴즈룸에 포함할 퀴즈를 하나 이상 선택해주세요.'
    return
  }

  loading.value = 'room'
  dashboardMessage.value = ''

  try {
    const requestBody = {
      title: roomForm.title,
      level: roomForm.level,
      description: roomForm.description,
      state: roomForm.state,
      quizList: selectedRoomQuizzes.value,
    }
    const payload = editingRoomId.value
      ? await updateQuizRoom(editingRoomId.value, requestBody)
      : await createQuizRoom(requestBody)
    const fallbackRoom = {
      id: editingRoomId.value || Date.now(),
      title: roomForm.title,
      level: roomForm.level,
      description: roomForm.description,
      state: roomForm.state,
      quizList: selectedRoomQuizzes.value,
    }
    const savedRoom = normalizeRoom(payload?.data, fallbackRoom)

    if (editingRoomId.value) {
      teacherRooms.value = teacherRooms.value.map((room) => (room.id === editingRoomId.value ? savedRoom : room))
    } else {
      teacherRooms.value.unshift(savedRoom)
    }

    resetRoomForm()
    editingRoomId.value = null
    isRoomModalOpen.value = false
    await loadTeacherRooms()
  } catch (error) {
    dashboardMessage.value = error.message
  } finally {
    loading.value = ''
  }
}

async function runDeleteRoom(room) {
  if (!window.confirm(`'${room.title}' 퀴즈룸을 삭제할까요?`)) return

  loading.value = `deleteRoom:${room.id}`
  dashboardMessage.value = ''

  try {
    await deleteQuizRoom(room.id)
    teacherRooms.value = teacherRooms.value.filter((item) => item.id !== room.id)
    if (editingRoomId.value === room.id) {
      closeRoomModal()
    }
    await loadTeacherRooms()
  } catch (error) {
    dashboardMessage.value = error.message
  } finally {
    loading.value = ''
  }
}

async function runGeneratePrompt() {
  loading.value = 'prompt'
  message.value = ''
  generatedImage.value = ''

  try {
    generatedPrompt.value = await generatePrompt({ ...promptForm })
  } catch (error) {
    message.value = error.message
  } finally {
    loading.value = ''
  }
}

async function runGenerateImage() {
  if (!generatedPrompt.value.trim()) {
    message.value = '먼저 프롬프트를 생성하거나 직접 입력해주세요.'
    return
  }

  loading.value = 'image'
  message.value = ''

  try {
    generatedImage.value = await generateImage(generatedPrompt.value)
    quizForm.image = generatedImage.value
    step.value = 'image'
  } catch (error) {
    message.value = error.message
  } finally {
    loading.value = ''
  }
}

async function runCreateQuiz() {
  const userId = getMemberId()

  if (!userId) {
    message.value = '로그인한 교사 정보를 찾을 수 없습니다.'
    return
  }

  loading.value = 'quiz'
  message.value = ''

  try {
    const payload = await createQuiz({ userId, ...quizForm, image: generatedImage.value || quizForm.image })
    const createdQuiz = payload?.data
    const fallbackQuiz = {
      id: Date.now(),
      title: quizForm.title,
      createdAt: new Date().toISOString().slice(0, 10),
      level: quizForm.level,
      image: generatedImage.value || quizForm.image,
    }

    teacherQuizzes.value.unshift(normalizeQuiz(createdQuiz, fallbackQuiz))
    message.value = '퀴즈가 저장되었습니다.'
    backToDashboard()
    await loadTeacherQuizzes()
  } catch (error) {
    message.value = error.message
  } finally {
    loading.value = ''
  }
}

onMounted(loadTeacherDashboard)
</script>

<template>
  <section v-if="view === 'dashboard'" class="page teacher-page">
    <div class="teacher-head">
      <div>
        <h1 class="page-title">교사 대시보드</h1>
        <p class="page-subtitle">내 퀴즈와 학생에게 배포할 퀴즈룸을 관리합니다.</p>
      </div>
    </div>

    <div class="teacher-stats">
      <article v-for="stat in stats" :key="stat.label" class="card stat-card teacher-stat">
        <p class="stat-value">{{ stat.value }}</p>
        <p>{{ stat.label }}</p>
      </article>
    </div>

    <div v-if="dashboardMessage" class="notice error" style="margin-top: 24px">{{ dashboardMessage }}</div>
    <p v-else-if="loading === 'dashboard' || loading === 'rooms'" class="muted" style="margin-top: 24px">
      대시보드를 불러오는 중입니다.
    </p>

    <section class="teacher-section">
      <div class="section-title-row">
        <h2>내 퀴즈 목록</h2>
        <button class="button primary compact" type="button" @click="openCreator">+ 새 퀴즈 만들기</button>
      </div>

      <div v-if="editingQuizId" class="card panel edit-panel">
        <h2>퀴즈 수정</h2>
        <form class="form" @submit.prevent="runUpdateQuiz">
          <div class="field">
            <label>퀴즈 제목</label>
            <input v-model="editQuizForm.title" required />
          </div>
          <div class="create-actions">
            <button class="button ghost compact" type="button" @click="closeEditQuiz">취소</button>
            <button class="button primary compact" type="submit" :disabled="loading === 'updateQuiz'">
              {{ loading === 'updateQuiz' ? '수정 중' : '수정 저장' }}
            </button>
          </div>
        </form>
      </div>

      <div class="card table-card">
        <table class="teacher-table">
          <thead>
            <tr>
              <th>퀴즈 제목</th>
              <th>레벨</th>
              <th>생성일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="quiz in teacherQuizzes" :key="quiz.id">
              <td>{{ quiz.title }}</td>
              <td>{{ quiz.level }}</td>
              <td>{{ quiz.createdAt }}</td>
              <td class="actions-cell">
                <button class="icon-button" type="button" aria-label="퀴즈 수정" @click="openEditQuiz(quiz)">수정</button>
                <button
                  class="icon-button danger"
                  type="button"
                  aria-label="퀴즈 삭제"
                  :disabled="loading === `deleteQuiz:${quiz.id}`"
                  @click="runDeleteQuiz(quiz)"
                >
                  {{ loading === `deleteQuiz:${quiz.id}` ? '삭제 중' : '삭제' }}
                </button>
              </td>
            </tr>
            <tr v-if="teacherQuizzes.length === 0">
              <td class="empty-table-cell" colspan="4">서버에서 조회된 퀴즈가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="teacher-section">
      <div class="section-title-row">
        <h2>퀴즈룸 관리</h2>
        <button class="button primary compact" type="button" @click="openRoomModal">+ 퀴즈룸 생성</button>
      </div>

      <div class="card table-card">
        <table class="teacher-table">
          <thead>
            <tr>
              <th>룸 이름</th>
              <th>참여 학생</th>
              <th>풀이수</th>
              <th>좋아요</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="room in teacherRooms" :key="room.id">
              <td>{{ room.title }}</td>
              <td>{{ room.students }}명</td>
              <td class="number blue">{{ room.plays }}</td>
              <td class="number pink">{{ room.likes }}</td>
              <td>
                <span class="status-pill" :class="{ closed: room.state !== 'OPEN' }">
                  {{ room.state === 'OPEN' ? '활성' : '비활성' }}
                </span>
              </td>
              <td class="actions-cell">
                <button class="icon-button" type="button" aria-label="퀴즈룸 수정" @click="openEditRoom(room)">수정</button>
                <button
                  class="icon-button danger"
                  type="button"
                  aria-label="퀴즈룸 삭제"
                  :disabled="loading === `deleteRoom:${room.id}`"
                  @click="runDeleteRoom(room)"
                >
                  {{ loading === `deleteRoom:${room.id}` ? '삭제 중' : '삭제' }}
                </button>
              </td>
            </tr>
            <tr v-if="teacherRooms.length === 0">
              <td class="empty-table-cell" colspan="6">서버에서 조회된 퀴즈룸이 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="isRoomModalOpen" class="modal-backdrop" @click.self="closeRoomModal">
      <div class="card panel room-builder modal-panel" role="dialog" aria-modal="true" aria-labelledby="room-modal-title">
        <div class="section-title-row">
          <h2 id="room-modal-title">{{ editingRoomId ? '퀴즈룸 수정' : '퀴즈룸 만들기' }}</h2>
          <button class="icon-button" type="button" aria-label="퀴즈룸 창 닫기" @click="closeRoomModal">닫기</button>
        </div>

        <form class="form" @submit.prevent="runSaveRoom">
          <div class="direct-inputs">
            <div class="field">
              <label>퀴즈룸 이름</label>
              <input v-model="roomForm.title" required />
            </div>
            <div class="field">
              <label>레벨</label>
              <select v-model="roomForm.level">
                <option>초급</option>
                <option>중급</option>
                <option>고급</option>
              </select>
            </div>
          </div>

          <div class="direct-inputs">
            <div class="field">
              <label>상태</label>
              <select v-model="roomForm.state">
                <option value="CLOSED">비활성</option>
                <option value="OPEN">활성</option>
              </select>
            </div>
            <div class="field">
              <label>설명</label>
              <input v-model="roomForm.description" />
            </div>
          </div>

          <div class="field">
            <label>포함할 퀴즈</label>
            <div v-if="teacherQuizzes.length === 0" class="notice">먼저 퀴즈를 생성해주세요.</div>
            <div v-else class="quiz-pick-list">
              <label v-for="quiz in teacherQuizzes" :key="quiz.id" class="quiz-pick-item">
                <input v-model="roomForm.selectedQuizIds" type="checkbox" :value="quiz.id" />
                <span>{{ quiz.title }}</span>
              </label>
            </div>
          </div>

          <div class="create-actions">
            <button class="button ghost compact" type="button" @click="closeRoomModal">취소</button>
            <button
              class="button primary compact"
              type="submit"
              :disabled="loading === 'room' || teacherQuizzes.length === 0"
            >
              {{ loading === 'room' ? '저장 중' : editingRoomId ? '수정 저장' : '퀴즈룸 생성' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>

  <section v-else class="page create-page">
    <div class="create-shell">
      <aside class="card create-sidebar">
        <button class="back-button" type="button" @click="backToDashboard">‹ 이미지 생성</button>

        <div class="side-block">
          <h2>프롬프트</h2>
          <textarea v-model="generatedPrompt" class="prompt-preview" placeholder="키워드를 선택하고 프롬프트를 생성하세요." />
        </div>

        <button class="button primary full" type="button" :disabled="loading === 'image'" @click="runGenerateImage">
          {{ loading === 'image' ? '이미지 생성 중' : '이미지 생성' }}
        </button>
      </aside>

      <main class="card create-panel">
        <div v-if="step === 'prompt'" class="keyword-step">
          <h1>키워드 템플릿</h1>
          <div class="divider"></div>

          <div class="keyword-grid">
            <fieldset v-for="group in keywordGroups" :key="group.key" class="keyword-group">
              <legend>{{ group.title }}</legend>
              <label v-for="option in group.options" :key="option" class="radio-line">
                <input v-model="promptForm[group.key]" type="radio" :value="option" />
                <span>{{ option }}</span>
              </label>
            </fieldset>
          </div>

          <div v-if="message" class="notice create-notice error">{{ message }}</div>

          <div class="create-actions">
            <button class="button ghost compact" type="button" @click="backToDashboard">뒤로가기</button>
            <button class="button primary compact" type="button" :disabled="loading === 'prompt'" @click="runGeneratePrompt">
              {{ loading === 'prompt' ? '프롬프트 생성 중' : '프롬프트 생성' }}
            </button>
          </div>
        </div>

        <div v-else class="image-step">
          <div>
            <h1>생성된 이미지 확인</h1>
            <p class="page-subtitle">이미지를 확인한 뒤 퀴즈 제목을 정하고 저장하세요.</p>
          </div>

          <div class="generated-image-frame">
            <img v-if="generatedImage" :src="generatedImage" alt="생성된 퀴즈 이미지" />
            <div v-else class="empty-image">이미지가 없습니다.</div>
          </div>

          <form class="form save-quiz-form" @submit.prevent="runCreateQuiz">
            <div class="field">
              <label>퀴즈 제목</label>
              <input v-model="quizForm.title" required />
            </div>
            <div class="field">
              <label>레벨</label>
              <select v-model="quizForm.level">
                <option>초급</option>
                <option>중급</option>
                <option>고급</option>
              </select>
            </div>

            <div v-if="message" class="notice create-notice" :class="{ error: message !== '퀴즈가 저장되었습니다.' }">
              {{ message }}
            </div>

            <div class="create-actions">
              <button class="button ghost compact" type="button" @click="step = 'prompt'">키워드 다시 선택</button>
              <button class="button primary compact" type="submit" :disabled="loading === 'quiz'">
                {{ loading === 'quiz' ? '저장 중' : '퀴즈 저장' }}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  </section>
</template>
