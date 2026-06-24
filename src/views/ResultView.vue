<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import CelebrationEffects from '../components/CelebrationEffects.vue'
import { fetchQuizRoom, increaseQuizRoomLike } from '../services/api'
import { getCurrentMember } from '../services/session'

const route = useRoute()
const stored = sessionStorage.getItem(`result:${route.params.id}`)
const storedResult = stored ? JSON.parse(stored) : null
const result = storedResult?.data || storedResult
const currentMember = getCurrentMember()
const memberLikeKey = currentMember?.id || currentMember?.memberId || currentMember?.email || 'guest'
const likedKey = `liked:${memberLikeKey}:${route.params.id}`

const liking = ref(false)
const liked = ref(sessionStorage.getItem(likedKey) === 'true')
const room = ref(null)
const roomLoading = ref(false)
const roomError = ref('')
const roomLikes = ref(0)
const celebrationEffects = ref(null)

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

const score = computed(() => {
  if (!result) return null
  return Number(result.avgScore ?? result.score)
})

const grade = computed(() => {
  if (score.value === null || Number.isNaN(score.value)) return '-'
  if (score.value >= 90) return '우수'
  if (score.value >= 75) return '양호'
  return '학습 필요'
})

const mascot = computed(() => {
  if (score.value === null || Number.isNaN(score.value)) {
    return {
      mood: 'neutral',
      face: '•‿•',
      message: '결과를 확인해볼까요?',
    }
  }

  if (score.value >= 90) {
    return {
      mood: 'happy',
      face: '＾▽＾',
      message: '완벽에 가까워요!',
    }
  }

  if (score.value >= 75) {
    return {
      mood: 'good',
      face: '•ᴗ•',
      message: '좋은 흐름이에요!',
    }
  }

  return {
    mood: 'study',
    face: '•︵•',
    message: '조금만 더 다듬어봐요.',
  }
})

const finalFeedback = computed(() => {
  return result?.finalFeedback || result?.totalFeedback || result?.feedback || ''
})

function roomLevel(value) {
  const level = value?.level?.trim?.() || value?.level
  const normalizedLevel = typeof level === 'string' ? level.toUpperCase() : level
  return levelMap[level] || levelMap[normalizedLevel] || level || '레벨 없음'
}

function quizCount(value) {
  return value?.quizCount || value?.quizCnt || value?.questionCount || value?.questionCnt || value?.quizList?.length || 0
}

function likeCount(value) {
  return value?.likeCount || value?.likeCnt || value?.likes || value?.like || 0
}

function quizOrder(quiz, index) {
  const order = Number(quiz?.quizOrder || quiz?.order || quiz?.sequence || quiz?.seq)
  return Number.isFinite(order) ? order : index + 1
}

function firstQuiz(value) {
  const quizzes = Array.isArray(value?.quizList) ? value.quizList : []
  return quizzes
    .map((quiz, index) => ({ quiz, order: quizOrder(quiz, index) }))
    .sort((a, b) => a.order - b.order)[0]?.quiz
}

function roomThumbnail(value) {
  const quiz = firstQuiz(value)
  return quiz?.image || quiz?.imageUrl || quiz?.url || quiz?.quiz?.image || quiz?.quiz?.imageUrl || quiz?.quiz?.url || ''
}

async function likeRoom() {
  if (liked.value || liking.value) return

  liking.value = true

  try {
    await increaseQuizRoomLike(route.params.id)
    liked.value = true
    roomLikes.value += 1
    sessionStorage.setItem(likedKey, 'true')
  } catch (error) {
    console.error(error)
  } finally {
    liking.value = false
  }
}

onMounted(async () => {
  if (!result) return

  roomLoading.value = true
  roomError.value = ''

  try {
    room.value = await fetchQuizRoom(route.params.id)
    roomLikes.value = likeCount(room.value)
  } catch (error) {
    roomError.value = error.message
  } finally {
    roomLoading.value = false
  }

  await nextTick()
  celebrationEffects.value?.launchFireworks()
})
</script>

<template>
  <section class="page">
    <CelebrationEffects ref="celebrationEffects" />

    <div v-if="!result" class="notice error">
      제출 결과가 없습니다. 퀴즈를 완료한 뒤 다시 확인해주세요.
    </div>

    <template v-else>
      <section
        class="card panel result-room-card"
        :class="{ 'has-thumbnail': roomThumbnail(room) }"
        :style="roomThumbnail(room) ? { '--result-room-thumbnail': `url(${roomThumbnail(room)})` } : undefined"
      >
        <div class="result-room-info">
          <template v-if="roomLoading">
            <h2>퀴즈룸 정보를 불러오는 중입니다.</h2>
          </template>
          <template v-else-if="room">
            <p class="result-section-label">{{ roomLevel(room) }} · {{ quizCount(room) }}문제</p>
            <h2>{{ room.title }}</h2>
            <p class="muted">{{ room.description || '설명이 없는 퀴즈룸입니다.' }}</p>
          </template>
          <template v-else>
            <h2>퀴즈룸 정보</h2>
            <p class="muted">{{ roomError || '퀴즈룸 정보를 불러오지 못했습니다.' }}</p>
          </template>
        </div>
      </section>

      <div class="result-hero">
        <div class="result-hero-content">
          <div>
            <div class="result-kicker">RESULT</div>
            <p class="result-score">{{ score }}점</p>
            <p class="result-grade">{{ grade }}</p>
          </div>

          <div class="result-mascot" :class="mascot.mood" aria-hidden="true">
            <div class="mascot-face">{{ mascot.face }}</div>
            <div class="mascot-shadow"></div>
          </div>
        </div>
        <p class="result-mascot-message">{{ mascot.message }}</p>
      </div>

      <section class="card panel result-feedback-card">
        <h2>AI 피드백</h2>
        <p class="muted">{{ finalFeedback || '피드백을 불러오지 못했습니다.' }}</p>
      </section>

      <div class="actions result-actions">
        <RouterLink class="button primary" to="/quiz-rooms">다른 퀴즈 풀기</RouterLink>
        <RouterLink class="button secondary" to="/my-page">기록 보기</RouterLink>
        <button
          class="stat-pill liked result-like-button"
          :class="{ active: liked }"
          type="button"
          :aria-label="`좋아요 ${roomLikes}개`"
          :disabled="liked || liking || roomLoading"
          @click="likeRoom"
        >
          <span aria-hidden="true">♥</span>
          {{ roomLikes }}
        </button>
      </div>
    </template>
  </section>
</template>
