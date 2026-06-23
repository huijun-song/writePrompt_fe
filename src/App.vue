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
  if (!isAuthed.value) return []

  const items = []

  if (isTeacher.value) {
    items.push({ to: '/teacher', label: '퀴즈 관리' })
  } else {
    items.push({ to: '/quiz-rooms', label: '퀴즈 목록' })
  }

  items.push({ to: '/my-page', label: '마이페이지' })

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
        <img class="brand-mark" src="/writeprompt-logo.svg" alt="" />
        <span>WritePrompt</span>
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
        <template v-else>
          <RouterLink class="nav-login" to="/login">로그인</RouterLink>
          <RouterLink class="nav-login" to="/signup">회원가입</RouterLink>
        </template>
      </nav>
    </header>

    <main>
      <RouterView />
    </main>

    <footer class="footer">© 2026 WritePrompt. All rights reserved.</footer>
  </div>
</template>
