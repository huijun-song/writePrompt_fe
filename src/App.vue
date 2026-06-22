<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { getCurrentMember, logout } from './services/session'

const route = useRoute()
const router = useRouter()

const member = computed(() => {
  route.fullPath
  return getCurrentMember()
})
const isAuthed = computed(() => Boolean(member.value))
const isTeacher = computed(() => member.value?.role === 'TEACHER')

const navItems = computed(() => {
  const items = [{ to: '/', label: '홈' }]

  if (isTeacher.value) {
    items.push({ to: '/teacher', label: '교사 대시보드' })
  } else {
    items.push({ to: '/quiz-rooms', label: '퀴즈 목록' })
  }

  if (isAuthed.value) {
    items.push({ to: '/my-page', label: '마이페이지' })
  }

  return items
})

function handleLogout() {
  logout()
  router.push('/login')
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <RouterLink class="brand" to="/">
        <span class="brand-mark">AI</span>
        <span>AI 프롬프트 퀴즈 플랫폼</span>
      </RouterLink>

      <nav class="nav-links" aria-label="주요 메뉴">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :class="{ active: route.path === item.to }"
        >
          {{ item.label }}
        </RouterLink>
        <button v-if="isAuthed" class="nav-button" type="button" @click="handleLogout">로그아웃</button>
        <RouterLink v-else class="nav-login" to="/login">로그인</RouterLink>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>

    <footer class="footer">© 2026 AI 프롬프트 퀴즈 플랫폼. All rights reserved.</footer>
  </div>
</template>
