<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CelebrationEffects from '../components/CelebrationEffects.vue'
import { compareImages, fetchQuizRoom, generateImage, submitFinalFeedback } from '../services/api'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const scoring = ref(false)
const submittingFinal = ref(false)
const errorMessage = ref('')
const room = ref(null)
const currentIndex = ref(0)
const answers = reactive({})
const generatedAnswers = reactive({})
const results = ref([])
const latestFeedback = ref(null)
const brokenImages = reactive({})
const celebrationEffects = ref(null)

const quizzes = computed(() => room.value?.quizList || [])
const currentQuiz = computed(() => quizzes.value[currentIndex.value])
const progress = computed(() => {
  if (!quizzes.value.length) return 0
  return Math.round(((currentIndex.value + 1) / quizzes.value.length) * 100)
})

function quizKey(quiz) {
  return quiz?.quizId || quiz?.id || quiz?.quizOrder || currentIndex.value
}

function hasQuizImage(quiz) {
  return Boolean(quiz?.image) && !brokenImages[quizKey(quiz)]
}

async function submitAnswer() {
  const prompt = answers[currentQuiz.value.quizId]
  if (!prompt) return

  scoring.value = true
  latestFeedback.value = null
  errorMessage.value = ''

  try {
    const studentImageUrl = await generateImage(prompt)
    generatedAnswers[currentIndex.value] = studentImageUrl
    const result = await compareImages(currentQuiz.value.image, studentImageUrl)
    results.value[currentIndex.value] = {
      quizOrder: currentQuiz.value.quizOrder || currentIndex.value + 1,
      quizId: currentQuiz.value.quizId || currentQuiz.value.id,
      score: Number(result.score) || 0,
      feedback: result.feedback,
    }
    latestFeedback.value = result
    await nextTick()
    celebrationEffects.value?.launchFanfare()
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    scoring.value = false
  }
}

async function next() {
  if (currentIndex.value < quizzes.value.length - 1) {
    currentIndex.value += 1
    latestFeedback.value = null
    errorMessage.value = ''
    return
  }

  try {
    submittingFinal.value = true
    const result = await submitFinalFeedback(route.params.id, results.value.filter(Boolean))
    sessionStorage.setItem(`result:${route.params.id}`, JSON.stringify(result))
    router.push(`/result/${route.params.id}`)
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    submittingFinal.value = false
  }
}

onMounted(async () => {
  try {
    room.value = await fetchQuizRoom(route.params.id)
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="page">
    <CelebrationEffects ref="celebrationEffects" />
    <div v-if="submittingFinal" class="final-submit-overlay" aria-live="polite" aria-label="최종 제출 중">
      <span></span>
      <span></span>
      <span></span>
    </div>

    <p v-if="loading" class="muted">퀴즈룸에 입장하는 중입니다.</p>
    <div v-else-if="errorMessage && !room" class="notice error">{{ errorMessage }}</div>

    <div v-else>
      <h1 class="page-title">{{ room.title }}</h1>
      <p class="page-subtitle">{{ room.description }}</p>

      <div v-if="quizzes.length === 0" class="notice">이 퀴즈룸에는 아직 문제가 없습니다.</div>

      <template v-else>
        <div class="toolbar">
          <div style="width: 100%">
            <div class="progress"><span :style="{ width: `${progress}%` }"></span></div>
            <p class="muted">{{ currentIndex + 1 }} / {{ quizzes.length }} 문제</p>
          </div>
        </div>

        <div class="two-column play-layout">
          <div class="card panel">
            <h2>{{ currentQuiz.title }}</h2>
            <p class="muted">이미지를 보고 어울리는 프롬프트를 작성하세요.</p>
            <div class="question-image">
              <img
                v-if="hasQuizImage(currentQuiz)"
                :src="currentQuiz.image"
                :alt="currentQuiz.title"
                @error="brokenImages[quizKey(currentQuiz)] = true"
              />
              <span v-else>이미지가 없습니다.</span>
            </div>
          </div>

          <div class="card panel">
            <h2>내 프롬프트</h2>
            <form class="form" @submit.prevent="submitAnswer">
              <div class="field">
                <label :for="`answer-${currentQuiz.quizId}`">답안</label>
                <textarea
                  :id="`answer-${currentQuiz.quizId}`"
                  v-model="answers[currentQuiz.quizId]"
                  placeholder="이미지를 설명하는 프롬프트를 입력하세요."
                  required
                ></textarea>
              </div>
              <button class="button primary full" type="submit" :disabled="scoring">
                {{ scoring ? '채점 중' : '이미지 생성 및 채점' }}
              </button>
            </form>

            <div v-if="errorMessage" class="notice error" style="margin-top: 18px">{{ errorMessage }}</div>

            <div class="generated-answer">
              <h3>생성된 이미지</h3>
              <div class="generated-answer-frame" :class="{ loading: scoring }">
                <img
                  v-if="generatedAnswers[currentIndex]"
                  :src="generatedAnswers[currentIndex]"
                  alt="내가 생성한 이미지"
                />
                <div v-else-if="scoring" class="image-loading-state">
                  <span class="image-spinner" aria-hidden="true"></span>
                  <p>이미지를 생성하고 채점하는 중입니다.</p>
                </div>
                <p v-else class="muted">생성된 이미지가 여기에 표시됩니다.</p>
              </div>
            </div>

            <div class="feedback-box" :class="{ loading: scoring, empty: !latestFeedback && !scoring }">
              <template v-if="latestFeedback">
                <strong>{{ latestFeedback.score }}점</strong>
                <p>{{ latestFeedback.feedback }}</p>
              </template>
              <div v-else-if="scoring" class="image-loading-state">
                <span class="image-spinner" aria-hidden="true"></span>
                <p>AI 피드백을 준비하는 중입니다.</p>
              </div>
              <p v-else class="muted">AI 피드백이 여기에 표시됩니다.</p>
            </div>

            <button
              class="button secondary full"
              style="margin-top: 18px"
              type="button"
              :disabled="!results[currentIndex]"
              @click="next"
            >
              {{ currentIndex === quizzes.length - 1 ? '최종 제출' : '다음 문제' }}
            </button>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
