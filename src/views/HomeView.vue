<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { getCurrentMember } from '../services/session'

const guideVideoUrl = 'https://youtu.be/tLC1WacPSyA?si=luSXdzlYQgcL8Mjy'

const quizShots = [
  { label: '미래 도시', className: 'shot-city' },
  { label: '숲속 로봇', className: 'shot-forest' },
  { label: '바닷속 도서관', className: 'shot-ocean' },
  { label: '우주 정거장', className: 'shot-space' },
  { label: '사막 연구소', className: 'shot-desert' },
  { label: '고양이 카페', className: 'shot-cafe' },
]

const marqueeShots = Array.from({ length: 4 }, (_, setIndex) =>
  quizShots.map((shot) => ({ ...shot, key: `${setIndex}-${shot.label}` })),
).flat()

const startPath = computed(() => {
  const member = getCurrentMember()

  if (!member) return '/login'
  return member.role === 'TEACHER' ? '/teacher' : '/quiz-rooms'
})

const heroActions = computed(() => {
  const member = getCurrentMember()

  if (!member) {
    return [
      { to: '/login', label: '로그인하고 시작하기', variant: 'primary' },
      { to: '/signup', label: '회원가입', variant: 'secondary' },
    ]
  }

  if (member.role === 'TEACHER') {
    return [
      { to: '/teacher', label: '퀴즈 관리', variant: 'primary' },
      {
        href: guideVideoUrl || '#',
        label: '가이드 영상',
        variant: 'secondary',
        external: Boolean(guideVideoUrl),
      },
    ]
  }

  return [
    { to: startPath.value, label: '퀴즈 시작하기', variant: 'primary' },
    {
      href: guideVideoUrl || '#',
      label: '가이드 영상',
      variant: 'secondary',
      external: Boolean(guideVideoUrl),
    },
  ]
})

let observer
let handleScroll
let animationFrameId

onMounted(() => {
  const revealTargets = document.querySelectorAll('.reveal-on-scroll')

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible')
      })
    },
    { threshold: 0.18 },
  )

  revealTargets.forEach((target) => observer.observe(target))

  handleScroll = () => {
    const story = document.querySelector('.motion-story')
    if (!story) return

    const rect = story.getBoundingClientRect()
    const distance = Math.max(1, window.innerHeight + rect.height)
    const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / distance))

    story.style.setProperty('--story-progress', progress.toFixed(3))
    story.style.setProperty('--orbit-rotate', `${(progress * 86).toFixed(2)}deg`)
    story.style.setProperty('--card-one-opacity', (1 - progress * 0.55).toFixed(3))
    story.style.setProperty('--card-one-y', `${Math.round(progress * -42)}px`)
    story.style.setProperty('--card-two-opacity', (0.35 + progress * 0.65).toFixed(3))
    story.style.setProperty('--card-two-y', `${Math.round(44 - progress * 62)}px`)
    story.style.setProperty('--card-three-opacity', (0.18 + progress * 0.82).toFixed(3))
    story.style.setProperty('--card-three-y', `${Math.round(92 - progress * 118)}px`)
  }

  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
  const syncScroll = () => {
    handleScroll()
    animationFrameId = window.requestAnimationFrame(syncScroll)
  }
  animationFrameId = window.requestAnimationFrame(syncScroll)
})

onUnmounted(() => {
  observer?.disconnect()
  window.removeEventListener('scroll', handleScroll)
  window.cancelAnimationFrame(animationFrameId)
})
</script>

<template>
  <section class="stripe-landing">
    <section class="stripe-hero">
      <div class="hero-color-field" aria-hidden="true"></div>
      <div class="stripe-container stripe-hero-grid reveal-on-scroll">
        <div class="stripe-copy">
          <span class="stripe-kicker">AI Prompt Learning Platform</span>
          <h1>
            <span>이미지를 보고,</span>
            <span>프롬프트로 답하는,</span>
            <span>AI 학습 플랫폼</span>
          </h1>
          <p>
            교사는 AI 이미지 퀴즈를 만들고, 학생은 장면을 정확한 프롬프트로 해석합니다.
            생성형 AI를 설명으로만 배우지 않고, 직접 관찰하고 정확하게 표현하며 익힙니다.
          </p>
          <div class="stripe-actions">
            <template v-for="action in heroActions" :key="action.label">
              <a
                v-if="action.href"
                class="stripe-button"
                :class="`stripe-button-${action.variant}`"
                :href="action.href"
                :target="action.external ? '_blank' : undefined"
                :rel="action.external ? 'noopener noreferrer' : undefined"
              >
                {{ action.label }}
              </a>
              <RouterLink
                v-else
                class="stripe-button"
                :class="`stripe-button-${action.variant}`"
                :to="action.to"
              >
                {{ action.label }}
              </RouterLink>
            </template>
          </div>
        </div>

        <div class="product-stack motion-float" aria-label="프롬프트 학습 대시보드 미리보기">
          <div class="product-window prompt-window">
            <div class="window-bar">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="prompt-lines">
              <span class="line-wide"></span>
              <span></span>
              <span class="line-mid"></span>
            </div>
            <div class="prompt-tags">
              <span>장면 관찰</span>
              <span>프롬프트 작성</span>
              <span>AI 비교</span>
            </div>
          </div>

          <div class="product-window image-window">
            <div class="mini-image">
              <span class="mini-sun"></span>
              <span class="mini-building building-one"></span>
              <span class="mini-building building-two"></span>
              <span class="mini-building building-three"></span>
            </div>
            <div class="image-caption">
              <strong>이미지 기반 퀴즈</strong>
              <span>보이는 장면을 정확한 프롬프트로 바꾸기</span>
            </div>
          </div>

          <div class="score-panel">
            <span>Answer match</span>
            <strong>92%</strong>
            <div class="score-meter"><span></span></div>
          </div>

          <div class="code-panel">
            <span>피드백</span>
            <code>색감과 구도는 정확, 배경 묘사를 보완하세요</code>
          </div>
        </div>
      </div>
    </section>

    <section class="motion-story">
      <div class="stripe-container motion-stage">
        <div class="motion-copy reveal-on-scroll">
          <h2>
            <span>학생은 이미지를 보고,</span>
            <span>자신만의 프롬프트를</span>
            <span>완성합니다.</span>
          </h2>
          <p>
            이미지 속 대상과 분위기를 살펴보고, 최대한 자세하게 프롬프트를 작성합니다.
            제출하면 생성 이미지와 기준 이미지를 비교해 채점과 피드백을 제공합니다.
          </p>
        </div>

        <div class="motion-canvas" aria-label="학생 풀이 흐름 미리보기">
          <div class="orbit-ring"></div>
          <article class="motion-card motion-card-one">
            <span>Step 1</span>
            <strong>이미지 관찰</strong>
            <p>대상, 배경, 분위기, 구도를 살펴보며 장면의 핵심 단서를 찾습니다.</p>
          </article>
          <article class="motion-card motion-card-two">
            <span>Step 2</span>
            <strong>프롬프트 작성</strong>
            <p>보이는 요소를 문장으로 조합해 AI가 다시 그릴 수 있는 프롬프트를 만듭니다.</p>
          </article>
          <article class="motion-card motion-card-three">
            <span>Step 3</span>
            <strong>결과 비교</strong>
            <p>생성된 이미지와 기준 이미지를 비교하며 표현의 정확도를 확인합니다.</p>
          </article>
        </div>
      </div>

      <div class="quiz-image-marquee" aria-label="퀴즈 이미지 예시">
        <div class="quiz-image-track">
          <div v-for="shot in marqueeShots" :key="shot.key" class="quiz-shot" :class="shot.className">
            <span>{{ shot.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="stripe-container stripe-solutions">
      <div class="solution-layout">
        <div class="solution-grid" aria-label="교사 워크플로우">
          <article class="solution-card reveal-on-scroll">
            <span class="solution-number">01</span>
            <h3>문제 설계</h3>
            <p>난이도, 배경, 분위기, 표현 조건을 고르면 수업에 쓸 기준 프롬프트와 이미지가 만들어집니다.</p>
            <div class="workflow-tags">
              <span>키워드 선택</span>
              <span>이미지 생성</span>
            </div>
          </article>
          <article class="solution-card reveal-on-scroll">
            <span class="solution-number">02</span>
            <h3>퀴즈룸 배포</h3>
            <p>여러 문제를 묶어 퀴즈룸을 만들고, 수업 상황에 맞춰 공개 상태와 난이도를 관리합니다.</p>
            <div class="workflow-tags">
              <span>문제 묶기</span>
              <span>공개 관리</span>
            </div>
          </article>
          <article class="solution-card reveal-on-scroll">
            <span class="solution-number">03</span>
            <h3>학습 결과 확인</h3>
            <p>제출 결과, 유사도 점수, 피드백을 확인하며 학생이 어떤 표현을 놓쳤는지 파악합니다.</p>
            <div class="workflow-tags">
              <span>점수 확인</span>
              <span>피드백 분석</span>
            </div>
          </article>
        </div>

        <div class="section-copy reveal-on-scroll">
          <h2>
            <span>퀴즈 생성부터 채점까지,</span>
            <span>AI로 수업 준비 끝!</span>
          </h2>
          <p>
            선생님은 프롬프트와 이미지를 빠르게 만들고, 퀴즈 형식으로 바로 학습할 수 있게 만듭니다.
            제출 결과는 AI가 비교해 채점과 피드백까지 편하게 확인할 수 있습니다.
          </p>
        </div>
      </div>
    </section>
  </section>
</template>
