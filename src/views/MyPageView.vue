<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { deleteMyPage, fetchMyPage, updateMyPage, uploadProfileImage } from '../services/api'

const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const errorMessage = ref('')
const message = ref('')
const profile = ref(null)
const imageBroken = ref(false)
const editImageBroken = ref(false)
const isEditModalOpen = ref(false)
const selectedFeedback = ref(null)
const selectedProfileFile = ref(null)
const profilePreviewUrl = ref('')
const router = useRouter()

const form = reactive({
  nickname: '',
  age: '',
  gender: 'Male',
  profile: '',
})

const initials = computed(() => profile.value?.nickname?.slice(0, 1) || '?')
const roleLabel = computed(() => (profile.value?.role === 'TEACHER' ? '선생' : '학생'))
const roleEmoji = computed(() => (profile.value?.role === 'TEACHER' ? '🧑‍🏫' : '🎓'))
const histories = computed(() => profile.value?.quizResults || [])
const solvedCount = computed(() => profile.value?.solvedCount ?? histories.value.length)
const averageScore = computed(() => formatScore(profile.value?.averageScore))
const highestScore = computed(() => formatScore(profile.value?.highestScore))
const scoreTrend = computed(() =>
  histories.value
    .slice()
    .reverse()
    .map((item) => ({
      ...item,
      scoreValue: Math.max(0, Math.min(100, Number(item.score) || 0)),
    })),
)

const chart = {
  width: 320,
  height: 160,
  padding: {
    top: 22,
    right: 18,
    bottom: 28,
    left: 34,
  },
}

const trendPoints = computed(() => {
  const items = scoreTrend.value
  if (items.length === 0) return []

  const innerWidth = chart.width - chart.padding.left - chart.padding.right
  const innerHeight = chart.height - chart.padding.top - chart.padding.bottom

  return items.map((item, index) => {
    const x =
      chart.padding.left +
      (items.length === 1 ? innerWidth / 2 : (index / (items.length - 1)) * innerWidth)
    const y = chart.padding.top + (1 - item.scoreValue / 100) * innerHeight

    return {
      ...item,
      x,
      y,
    }
  })
})

const trendPolyline = computed(() => trendPoints.value.map((item) => `${item.x},${item.y}`).join(' '))
const statCards = computed(() => [
  { label: '푼 문제 수', emoji: '✏️', value: solvedCount.value, tone: 'blue' },
  { label: '평균 점수', emoji: '📊', value: averageScore.value, tone: 'green' },
  { label: '최고점', emoji: '🏆', value: highestScore.value, tone: 'yellow' },
])
const editProfilePreview = computed(() => {
  if (profilePreviewUrl.value) return profilePreviewUrl.value
  if (editImageBroken.value || isDefaultProfile(form.profile)) return ''
  return form.profile
})

function formatScore(value) {
  const score = Number(value)
  if (!Number.isFinite(score)) return '0'
  return Number.isInteger(score) ? String(score) : score.toFixed(1)
}

function formatDate(value) {
  if (!value) return '-'
  return String(value).slice(0, 10)
}

function quizRoomLabel(item) {
  return (
    item.quizRoomTitle ||
    item.quizRoomName ||
    item.roomTitle ||
    item.roomName ||
    item.quizRoom?.title ||
    item.quizRoom?.name ||
    '퀴즈룸명 없음'
  )
}

function normalizeGender(value) {
  const gender = String(value || '').toUpperCase()
  if (gender === 'F' || gender === 'FEMALE') return 'Female'
  return 'Male'
}

function isDefaultProfile(value) {
  if (!value) return true
  return String(value).endsWith('/default') || value === 'default'
}

function syncForm(member) {
  form.nickname = member?.nickname || ''
  form.age = member?.age || ''
  form.gender = normalizeGender(member?.gender)
  form.profile = member?.profile || ''
  imageBroken.value = false
  editImageBroken.value = false
}

function clearProfileFile() {
  selectedProfileFile.value = null

  if (profilePreviewUrl.value) {
    URL.revokeObjectURL(profilePreviewUrl.value)
    profilePreviewUrl.value = ''
  }
}

function handleProfileFileChange(event) {
  const [file] = event.target.files || []

  clearProfileFile()

  if (!file) return

  if (!file.type.startsWith('image/')) {
    errorMessage.value = '이미지 파일만 업로드할 수 있습니다.'
    event.target.value = ''
    return
  }

  errorMessage.value = ''
  selectedProfileFile.value = file
  profilePreviewUrl.value = URL.createObjectURL(file)
  editImageBroken.value = false
}

function openEditModal() {
  syncForm(profile.value)
  clearProfileFile()
  message.value = ''
  errorMessage.value = ''
  isEditModalOpen.value = true
}

function closeEditModal() {
  isEditModalOpen.value = false
  clearProfileFile()
  message.value = ''
}

function openFeedbackModal(item) {
  selectedFeedback.value = item
}

function closeFeedbackModal() {
  selectedFeedback.value = null
}

async function loadProfile() {
  loading.value = true
  errorMessage.value = ''

  try {
    profile.value = await fetchMyPage()
    syncForm(profile.value)
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  saving.value = true
  message.value = ''
  errorMessage.value = ''

  try {
    const profileImage = selectedProfileFile.value ? await uploadProfileImage(selectedProfileFile.value) : form.profile

    await updateMyPage({
      ...form,
      profile: profileImage,
    })
    profile.value = await fetchMyPage()
    syncForm(profile.value)
    clearProfileFile()
    message.value = '회원 정보가 수정되었습니다.'
    isEditModalOpen.value = false
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    saving.value = false
  }
}

async function withdrawMember() {
  const confirmed = window.confirm('회원탈퇴를 진행하시겠습니까? 탈퇴 후에는 계정을 복구할 수 없습니다.')

  if (!confirmed) return

  deleting.value = true
  message.value = ''
  errorMessage.value = ''

  try {
    await deleteMyPage()
    window.alert('회원탈퇴가 완료되었습니다.')
    router.push('/login')
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    deleting.value = false
  }
}

onMounted(loadProfile)

onUnmounted(clearProfileFile)
</script>

<template>
  <section class="page mypage-page">
    <div class="mypage-header">
      <div>
        <h1 class="page-title">마이페이지</h1>
      </div>
      <button v-if="profile" class="button primary compact" type="button" @click="openEditModal">
        회원 정보 수정
      </button>
    </div>

    <p v-if="loading" class="muted">내 정보를 불러오는 중입니다.</p>
    <div v-else-if="errorMessage && !profile" class="notice error">{{ errorMessage }}</div>

    <div v-else class="profile-layout">
      <aside class="card profile-card">
        <div class="profile-avatar">
          <img
            v-if="profile.profile && !imageBroken"
            :src="profile.profile"
            :alt="profile.nickname"
            @error="imageBroken = true"
          />
          <span v-else>{{ initials }}</span>
        </div>
        <h2>{{ profile.nickname }}</h2>
        <p class="muted profile-role">
          {{ roleLabel }}
          <span aria-hidden="true">{{ roleEmoji }}</span>
        </p>
        <hr class="profile-divider" />
        <div v-if="profile.createdTime" class="profile-meta-bottom">
          <p class="muted">가입일: {{ formatDate(profile.createdTime) }}</p>
        </div>
        <div class="profile-actions">
          <button class="button danger compact" type="button" :disabled="deleting" @click="withdrawMember">
            {{ deleting ? '탈퇴 처리 중' : '회원탈퇴' }}
          </button>
        </div>
      </aside>

      <div>
        <div class="mypage-stats">
          <article v-for="stat in statCards" :key="stat.label" class="card stat-card" :class="`tone-${stat.tone}`">
            <p class="muted stat-label">
              {{ stat.label }}
              <span aria-hidden="true">{{ stat.emoji }}</span>
            </p>
            <p class="stat-value">{{ stat.value }}</p>
          </article>
        </div>

        <div class="card panel" style="margin-top: 28px">
          <h2>학습 기록</h2>
          <div v-if="histories.length === 0" class="notice" style="margin-top: 18px">
            아직 학습 기록이 없습니다.
          </div>
          <div v-else class="card table-card history-table">
            <table class="teacher-table">
              <thead>
                <tr>
                  <th>퀴즈룸</th>
                  <th>점수</th>
                  <th>피드백</th>
                  <th>날짜</th>
                  <th>다시 풀기</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in histories" :key="item.id">
                  <td class="history-room-title">{{ quizRoomLabel(item) }}</td>
                  <td class="number blue">{{ formatScore(item.score) }}점</td>
                  <td>
                    <button
                      class="feedback-view-button"
                      type="button"
                      :disabled="!item.feedback"
                      @click="openFeedbackModal(item)"
                    >
                      보기
                    </button>
                  </td>
                  <td>{{ formatDate(item.createdTime) }}</td>
                  <td>
                    <RouterLink class="button secondary compact" :to="`/play/${item.quizRoomId}`">풀기</RouterLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="card panel" style="margin-top: 28px">
          <h2>점수 변화</h2>
          <div v-if="scoreTrend.length === 0" class="notice" style="margin-top: 18px">
            점수 변화가 아직 없습니다.
          </div>
          <div v-else class="score-line-chart">
            <svg viewBox="0 0 320 160" role="img" aria-label="점수 변화 꺾은선 그래프">
              <g class="chart-grid">
                <line x1="34" y1="22" x2="302" y2="22" class="chart-grid-line" />
                <line x1="34" y1="77" x2="302" y2="77" class="chart-grid-line" />
                <line x1="34" y1="132" x2="302" y2="132" class="chart-grid-line" />
                <text x="4" y="26" class="chart-label">100</text>
                <text x="12" y="81" class="chart-label">50</text>
                <text x="20" y="136" class="chart-label">0</text>
              </g>
              <polyline class="chart-line" :points="trendPolyline" />
              <g v-for="item in trendPoints" :key="item.id" class="chart-point-group">
                <circle class="chart-point" :cx="item.x" :cy="item.y" r="4" />
                <text class="chart-point-label" :x="item.x" :y="item.y - 10" text-anchor="middle">
                  {{ formatScore(item.score) }}
                </text>
              </g>
            </svg>
            <div class="score-trend">
              <div v-for="item in scoreTrend" :key="item.id" class="score-trend-item compact">
                <div class="score-trend-head">
                  <span>{{ quizRoomLabel(item) }}</span>
                  <strong>{{ formatScore(item.score) }}점</strong>
                </div>
                <p class="muted">{{ formatDate(item.createdTime) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isEditModalOpen" class="modal-backdrop" @click.self="closeEditModal">
      <div class="card panel modal-panel profile-edit-panel" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title">
        <div class="section-title-row">
          <h2 id="profile-edit-title">회원 정보 수정</h2>
          <button class="icon-button" type="button" aria-label="회원 정보 수정 창 닫기" @click="closeEditModal">
            닫기
          </button>
        </div>

        <form class="form profile-edit-form" @submit.prevent="saveProfile">
          <div v-if="message" class="notice">{{ message }}</div>
          <div v-if="errorMessage" class="notice error">{{ errorMessage }}</div>

          <div class="profile-edit-grid">
            <div class="profile-edit-fields">
              <div class="field">
                <label for="nickname">이름</label>
                <input id="nickname" v-model="form.nickname" required />
              </div>

              <div class="field">
                <label for="age">생년월일</label>
                <input id="age" v-model="form.age" type="date" required />
              </div>

              <div class="field">
                <label for="gender">성별</label>
                <select id="gender" v-model="form.gender" required>
                  <option value="Male">남성</option>
                  <option value="Female">여성</option>
                </select>
              </div>
            </div>

            <div class="profile-edit-image-panel">
              <span class="profile-edit-image-label">프로필 이미지</span>
              <div class="profile-upload profile-upload-large">
                <div class="profile-upload-preview">
                  <img
                    v-if="editProfilePreview"
                    :src="editProfilePreview"
                    alt="프로필 이미지 미리보기"
                    @error="editImageBroken = true"
                  />
                  <span v-else>{{ form.nickname.slice(0, 1) || '?' }}</span>
                </div>
                <label class="profile-upload-button" for="profile">이미지 파일 선택</label>
                <input
                  id="profile"
                  class="profile-upload-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  @change="handleProfileFileChange"
                />
                <p v-if="selectedProfileFile" class="profile-file-name">{{ selectedProfileFile.name }}</p>
              </div>
            </div>
          </div>

          <div class="create-actions">
            <button class="button ghost compact" type="button" @click="closeEditModal">취소</button>
            <button class="button primary compact" type="submit" :disabled="saving">
              {{ saving ? '저장 중' : '저장하기' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="selectedFeedback" class="modal-backdrop" @click.self="closeFeedbackModal">
      <div class="card panel modal-panel" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
        <div class="section-title-row">
          <h2 id="feedback-title">학습 피드백</h2>
          <button class="icon-button feedback-close-button" type="button" aria-label="피드백 창 닫기" @click="closeFeedbackModal">
            닫기
          </button>
        </div>
        <p class="feedback-full">{{ selectedFeedback.feedback }}</p>
      </div>
    </div>
  </section>
</template>
