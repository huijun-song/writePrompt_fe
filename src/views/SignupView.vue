<script setup>
import { reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { signup } from '../services/api'

const router = useRouter()
const loading = ref(false)
const message = ref('')
const form = reactive({
  nickname: '',
  email: '',
  password: '',
  passwordConfirm: '',
  role: 'STUDENT',
  age: '',
  gender: 'MALE',
  profile: '',
})

async function submit() {
  if (form.password !== form.passwordConfirm) {
    message.value = '비밀번호 확인이 일치하지 않습니다.'
    return
  }

  loading.value = true
  message.value = ''

  try {
    await signup(form)
    message.value = '회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.'
    setTimeout(() => router.push('/login'), 700)
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
        <div class="auth-badge">+</div>
        <h1>회원가입</h1>
        <p class="page-subtitle">새 계정을 만들어 실제 서버와 연결을 확인하세요.</p>
      </div>

      <form class="form" @submit.prevent="submit">
        <div v-if="message" class="notice" :class="{ error: !message.includes('완료') }">{{ message }}</div>

        <div class="field">
          <label>사용자 유형</label>
          <div class="segmented">
            <button type="button" :class="{ active: form.role === 'STUDENT' }" @click="form.role = 'STUDENT'">
              학생
            </button>
            <button type="button" :class="{ active: form.role === 'TEACHER' }" @click="form.role = 'TEACHER'">
              교사
            </button>
          </div>
        </div>

        <div class="field">
          <label for="nickname">이름</label>
          <input id="nickname" v-model="form.nickname" required />
        </div>

        <div class="field">
          <label for="email">이메일</label>
          <input id="email" v-model="form.email" autocomplete="email" type="email" required />
        </div>

        <div class="field">
          <label for="password">비밀번호</label>
          <input id="password" v-model="form.password" autocomplete="new-password" type="password" required />
        </div>

        <div class="field">
          <label for="passwordConfirm">비밀번호 확인</label>
          <input id="passwordConfirm" v-model="form.passwordConfirm" autocomplete="new-password" type="password" required />
        </div>

        <div class="field">
          <label for="age">생년월일</label>
          <input id="age" v-model="form.age" type="date" required />
        </div>

        <div class="field">
          <label for="gender">성별</label>
          <select id="gender" v-model="form.gender" required>
            <option value="MALE">남성</option>
            <option value="FEMALE">여성</option>
          </select>
        </div>

        <div class="field">
          <label for="profile">프로필 이미지 URL</label>
          <input id="profile" v-model="form.profile" placeholder="비워두면 기본값으로 가입됩니다." />
        </div>

        <button class="button primary full" type="submit" :disabled="loading">
          {{ loading ? '처리 중' : '회원가입' }}
        </button>
      </form>

      <p class="auth-link">이미 계정이 있으신가요? <RouterLink to="/login">로그인</RouterLink></p>
    </div>
  </section>
</template>
