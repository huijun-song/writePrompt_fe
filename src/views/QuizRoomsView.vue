<script setup>
import { computed, onMounted, ref } from 'vue'
import { fetchQuizRooms } from '../services/api'

const loading = ref(true)
const errorMessage = ref('')
const query = ref('')
const levelFilter = ref('ALL')
const rooms = ref([])
const brokenThumbnails = ref({})

const levelMap = {
  BEGINNER: 'EASY',
  INTERMEDIATE: 'NORMAL',
  ADVANCED: 'HARD',
  EASY: 'EASY',
  NORMAL: 'NORMAL',
  HARD: 'HARD',
}

const levelOptions = ['ALL', 'EASY', 'NORMAL', 'HARD']

const filteredRooms = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  const selectedLevel = levelFilter.value

  return rooms.value.filter((room) => {
    const matchesKeyword = !keyword || `${room.title} ${room.description}`.toLowerCase().includes(keyword)
    const matchesLevel = selectedLevel === 'ALL' || roomLevel(room) === selectedLevel

    return matchesKeyword && matchesLevel
  })
})

function roomLevel(room) {
  return levelMap[room?.level] || room?.level || ''
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
    <p class="page-subtitle">서버에서 불러온 퀴즈룸을 확인하고 참여하세요.</p>

    <div class="toolbar">
      <input v-model="query" class="search-input" placeholder="퀴즈 검색..." type="search" />
      <select v-model="levelFilter" class="level-filter" aria-label="난이도 필터">
        <option v-for="level in levelOptions" :key="level" :value="level">
          {{ level === 'ALL' ? '난이도' : level }}
        </option>
      </select>
    </div>

    <p v-if="loading" class="muted">퀴즈룸을 불러오는 중입니다.</p>
    <div v-else-if="errorMessage" class="notice error">{{ errorMessage }}</div>
    <div v-else-if="filteredRooms.length === 0" class="notice">표시할 퀴즈룸이 없습니다.</div>
    <div v-else class="quiz-grid">
      <article v-for="(room, index) in filteredRooms" :key="roomId(room)" class="card quiz-card">
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
          <div class="chip-row">
            <span class="chip">{{ roomLevel(room) || '레벨 없음' }}</span>
            <span class="chip">{{ quizCount(room) }}문제</span>
          </div>
          <h2>{{ room.title }}</h2>
          <p>{{ room.description }}</p>
          <div class="chip-row">
            <span class="muted">풀이 {{ solvedCount(room) }}</span>
            <span class="muted">좋아요 {{ likeCount(room) }}</span>
          </div>
          <RouterLink class="button primary full" :to="`/play/${roomId(room)}`">
            퀴즈 시작하기
          </RouterLink>
        </div>
      </article>
    </div>
  </section>
</template>
