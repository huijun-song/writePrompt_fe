<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { login } from '../services/api'

const router = useRouter()
const userType = ref('STUDENT')
const loading = ref(false)
const message = ref('')
const form = reactive({
  email: '',
  password: '',
})

async function submit() {
  loading.value = true
  message.value = ''

  try {
    const member = await login(form)
    router.push(member.role === 'TEACHER' ? '/teacher' : '/quiz-rooms')
  } catch (error) {
    message.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="auth-wrap">
    <div class="card auth-card">
      <div class="auth-head">
        <div class="auth-badge">IN</div>
        <h1>로그인</h1>
        <p class="page-subtitle">가입한 계정으로 로그인하세요.</p>
      </div>

      <form class="form" @submit.prevent="submit">
        <div class="field">
          <label>사용자 유형</label>
          <div class="segmented">
            <button type="button" :class="{ active: userType === 'STUDENT' }" @click="userType = 'STUDENT'">
              학생
            </button>
            <button type="button" :class="{ active: userType === 'TEACHER' }" @click="userType = 'TEACHER'">
              교사
            </button>
          </div>
        </div>

        <div v-if="message" class="notice error">{{ message }}</div>

        <div class="field">
          <label for="email">이메일</label>
          <input id="email" v-model="form.email" autocomplete="email" type="email" required />
        </div>

        <div class="field">
          <label for="password">비밀번호</label>
          <input id="password" v-model="form.password" autocomplete="current-password" type="password" required />
        </div>

        <button class="button primary full" type="submit" :disabled="loading">
          {{ loading ? '로그인 중' : '로그인' }}
        </button>
      </form>

      <p class="auth-link">계정이 없으신가요? <RouterLink to="/signup">회원가입</RouterLink></p>
    </div>
  </section>
</template>
