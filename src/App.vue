<script setup>
import { computed, ref, watch } from 'vue'
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
const bubbles = ref([])

const bubbleColors = [
  'rgba(99, 102, 241, 0.12)',
  'rgba(59, 130, 246, 0.11)',
  'rgba(34, 197, 94, 0.1)',
  'rgba(14, 165, 233, 0.1)',
  'rgba(244, 114, 182, 0.1)',
  'rgba(45, 212, 191, 0.1)',
]

function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min))
}

function createBubbles() {
  bubbles.value = Array.from({ length: 12 }, (_, index) => {
    const size = randomBetween(36, 112)

    return {
      id: `${route.fullPath}-${index}-${Math.random().toString(36).slice(2)}`,
      style: {
        '--bubble-size': `${size}px`,
        '--bubble-x': `${randomBetween(3, 94)}%`,
        '--bubble-y': `${randomBetween(4, 92)}%`,
        '--bubble-color': bubbleColors[randomBetween(0, bubbleColors.length - 1)],
        '--bubble-delay': `${randomBetween(0, 9000) * -1}ms`,
        '--bubble-duration': `${randomBetween(16000, 28000)}ms`,
      },
    }
  })
}

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

watch(
  () => route.fullPath,
  () => {
    if (route.name === 'home') {
      bubbles.value = []
      return
    }

    createBubbles()
  },
  { immediate: true },
)

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

    <main :class="{ 'bubble-main': route.name !== 'home' }">
      <div v-if="route.name !== 'home'" class="bubble-field" aria-hidden="true">
        <span v-for="bubble in bubbles" :key="bubble.id" class="bubble" :style="bubble.style"></span>
      </div>
      <RouterView />
    </main>

    <footer class="footer">© 2026 WritePrompt. All rights reserved.</footer>
  </div>
</template>
