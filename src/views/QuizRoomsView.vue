<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { fetchQuizRooms } from '../services/api'

const pageSize = 9
const loading = ref(true)
const errorMessage = ref('')
const query = ref('')
const levelFilter = ref('ALL')
const sortFilter = ref('DEFAULT')
const rooms = ref([])
const brokenThumbnails = ref({})
const currentPage = ref(1)

const levelMap = {
  BEGINNER: '초급',
  EASY: '초급',
  LOW: '초급',
  초급: '초급',
  INTERMEDIATE: '중급',
  NORMAL: '중급',
  MEDIUM: '중급',
  중급: '중급',
  ADVANCED: '고급',
  HARD: '고급',
  HIGH: '고급',
  고급: '고급',
}

const levelOptions = ['ALL', '초급', '중급', '고급']
const sortOptions = [
  { value: 'DEFAULT', label: '정렬' },
  { value: 'SOLVED', label: '풀이순' },
  { value: 'LIKES', label: '좋아요 순' },
]

const filteredRooms = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  const selectedLevel = levelFilter.value
  const selectedSort = sortFilter.value

  const nextRooms = rooms.value.filter((room) => {
    const matchesKeyword = !keyword || `${room.title} ${room.description}`.toLowerCase().includes(keyword)
    const matchesLevel = selectedLevel === 'ALL' || roomLevel(room) === selectedLevel

    return matchesKeyword && matchesLevel
  })

  return [...nextRooms].sort((a, b) => {
    if (selectedSort === 'SOLVED') {
      return solvedCount(b) - solvedCount(a)
    }

    if (selectedSort === 'LIKES') {
      return likeCount(b) - likeCount(a)
    }

    return 0
  })
})

const pageCount = computed(() => Math.max(1, Math.ceil(filteredRooms.value.length / pageSize)))
const pageNumbers = computed(() => Array.from({ length: pageCount.value }, (_, index) => index + 1))
const paginatedRooms = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredRooms.value.slice(start, start + pageSize)
})

watch([query, levelFilter, sortFilter], () => {
  currentPage.value = 1
})

watch(pageCount, (nextPageCount) => {
  if (currentPage.value > nextPageCount) {
    currentPage.value = nextPageCount
  }
})

function goToPage(page) {
  currentPage.value = Math.min(Math.max(page, 1), pageCount.value)
}

function roomLevel(room) {
  const level = room?.level?.trim?.() || room?.level
  const normalizedLevel = typeof level === 'string' ? level.toUpperCase() : level
  return levelMap[level] || levelMap[normalizedLevel] || level || ''
}

function imageClass(room, index) {
  return room.theme || ['nature', 'character', 'city'][index % 3]
}

function roomId(room) {
  return room.quizRoomId || room.quizroomId || room.id
}

function thumbnailKey(room, index) {
  return roomId(room) || `room-${index}`
}

function quizOrder(quiz, index) {
  const order = Number(quiz?.quizOrder || quiz?.order || quiz?.sequence || quiz?.seq)
  return Number.isFinite(order) ? order : index + 1
}

function firstQuiz(room) {
  const quizzes = Array.isArray(room?.quizList) ? room.quizList : []
  return quizzes
    .map((quiz, index) => ({ quiz, order: quizOrder(quiz, index) }))
    .sort((a, b) => a.order - b.order)[0]?.quiz
}

function roomThumbnail(room) {
  const quiz = firstQuiz(room)
  return quiz?.image || quiz?.imageUrl || quiz?.url || quiz?.quiz?.image || quiz?.quiz?.imageUrl || quiz?.quiz?.url || ''
}

function quizCount(room) {
  return room.quizCount || room.quizCnt || room.questionCount || room.questionCnt || room.quizList?.length || 0
}

function solvedCount(room) {
  return room.solvedCount || room.solvedCnt || room.playCount || room.plays || 0
}

function likeCount(room) {
  return room.likeCount || room.likeCnt || room.likes || room.like || 0
}

onMounted(async () => {
  try {
    rooms.value = await fetchQuizRooms()
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="page">
    <h1 class="page-title">퀴즈룸 목록</h1>

    <div class="toolbar">
      <input v-model="query" class="search-input" placeholder="퀴즈 검색..." type="search" />
      <select v-model="levelFilter" class="level-filter" aria-label="난이도 필터">
        <option v-for="level in levelOptions" :key="level" :value="level">
          {{ level === 'ALL' ? '난이도' : level }}
        </option>
      </select>
      <select v-model="sortFilter" class="level-filter sort-filter" aria-label="정렬 기준">
        <option v-for="option in sortOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>

    <p v-if="loading" class="muted">퀴즈룸을 불러오는 중입니다.</p>
    <div v-else-if="errorMessage" class="notice error">{{ errorMessage }}</div>
    <div v-else-if="filteredRooms.length === 0" class="notice">표시할 퀴즈룸이 없습니다.</div>
    <template v-else>
      <div class="quiz-grid">
        <article v-for="(room, index) in paginatedRooms" :key="roomId(room)" class="card quiz-card">
          <div class="quiz-image" :class="imageClass(room, index)">
            <img
              v-if="roomThumbnail(room) && !brokenThumbnails[thumbnailKey(room, index)]"
              :src="roomThumbnail(room)"
              :alt="firstQuiz(room)?.title || room.title"
              @error="brokenThumbnails[thumbnailKey(room, index)] = true"
            />
            <span v-else>{{ room.title }}</span>
          </div>
          <div class="quiz-body">
            <div class="quiz-meta-row">
              <span>{{ roomLevel(room) || '레벨 없음' }} · {{ quizCount(room) }}문제</span>
              <span class="quiz-card-stats">
                <span class="stat-pill solved" :aria-label="`풀이 ${solvedCount(room)}개`">
                  <span aria-hidden="true">✏️</span>
                  {{ solvedCount(room) }}
                </span>
                <span class="stat-pill liked" :aria-label="`좋아요 ${likeCount(room)}개`">
                  <span aria-hidden="true">♥</span>
                  {{ likeCount(room) }}
                </span>
              </span>
            </div>
            <h2>{{ room.title }}</h2>
            <p class="quiz-description">{{ room.description }}</p>
            <RouterLink class="button primary full" :to="`/play/${roomId(room)}`">
              퀴즈 시작하기
            </RouterLink>
          </div>
        </article>
      </div>

      <nav v-if="pageCount > 1" class="pagination" aria-label="퀴즈룸 페이지">
        <button class="pagination-button" type="button" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
          이전
        </button>
        <button
          v-for="page in pageNumbers"
          :key="page"
          class="pagination-button page-number"
          :class="{ active: page === currentPage }"
          type="button"
          :aria-current="page === currentPage ? 'page' : undefined"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>
        <button class="pagination-button" type="button" :disabled="currentPage === pageCount" @click="goToPage(currentPage + 1)">
          다음
        </button>
      </nav>
    </template>
  </section>
</template>
