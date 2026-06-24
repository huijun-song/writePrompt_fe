<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import CelebrationEffects from '../components/CelebrationEffects.vue'
import { increaseQuizRoomLike } from '../services/api'

const route = useRoute()
const stored = sessionStorage.getItem(`result:${route.params.id}`)
const storedResult = stored ? JSON.parse(stored) : null
const result = storedResult?.data || storedResult
const likedKey = `liked:${route.params.id}`

const liking = ref(false)
const liked = ref(sessionStorage.getItem(likedKey) === 'true')
const likeMessage = ref('')
const celebrationEffects = ref(null)

const score = computed(() => {
  if (!result) return null
  return Number(result.avgScore ?? result.score)
})

const grade = computed(() => {
  if (score.value === null || Number.isNaN(score.value)) return '-'
  if (score.value >= 90) return '우수'
  if (score.value >= 75) return '양호'
  return '연습 필요'
})

const finalFeedback = computed(() => {
  return result?.finalFeedback || result?.totalFeedback || result?.feedback || ''
})

async function likeRoom() {
  if (liked.value || liking.value) return

  liking.value = true
  likeMessage.value = ''

  try {
    await increaseQuizRoomLike(route.params.id)
    liked.value = true
    sessionStorage.setItem(likedKey, 'true')
    likeMessage.value = '좋아요를 눌렀습니다.'
  } catch (error) {
    likeMessage.value = error.message
  } finally {
    liking.value = false
  }
}

onMounted(async () => {
  if (!result) return

  await nextTick()
  celebrationEffects.value?.launchFireworks()
})
</script>

<template>
  <section class="page">
    <CelebrationEffects ref="celebrationEffects" />
    <div v-if="!result" class="notice error">
      제출 결과가 없습니다. 실제 제출 API 응답이 저장된 뒤 결과를 확인할 수 있습니다.
    </div>

    <template v-else>
      <div class="result-hero">
        <div>
          <div style="font-size: 46px; font-weight: 900">RESULT</div>
          <p class="result-score">{{ score }}점</p>
          <p>{{ grade }}</p>
        </div>
      </div>

      <div class="stats-grid">
        <article class="card stat-card">
          <p class="stat-value">{{ score }}%</p>
          <p class="muted">정확도</p>
        </article>
        <article class="card stat-card">
          <p class="stat-value">{{ grade }}</p>
          <p class="muted">평가</p>
        </article>
      </div>

      <div class="card panel" style="margin-top: 28px">
        <h2>AI 피드백</h2>
        <p class="muted">{{ finalFeedback || '피드백을 불러오지 못했습니다.' }}</p>
        <div class="actions">
          <button class="button primary" type="button" :disabled="liked || liking" @click="likeRoom">
            {{ liked ? '좋아요 완료' : liking ? '처리 중' : '좋아요' }}
          </button>
          <RouterLink class="button primary" to="/quiz-rooms">다른 퀴즈 풀기</RouterLink>
          <RouterLink class="button secondary" to="/my-page">기록 보기</RouterLink>
        </div>
        <p v-if="likeMessage" class="muted" style="margin-top: 12px">{{ likeMessage }}</p>
      </div>
    </template>
  </section>
</template>
