<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { getCurrentMember } from '../services/session'

const startPath = computed(() => {
  const member = getCurrentMember()

  if (!member) return '/login'
  return member.role === 'TEACHER' ? '/teacher' : '/quiz-rooms'
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
          <span class="stripe-kicker">AI prompt learning platform</span>
          <h1>프롬프트 수업을 더 빠르게 설계하고, 더 선명하게 채점하세요.</h1>
          <p>
            이미지 생성, 퀴즈룸, AI 유사도 피드백까지 한 흐름으로 연결해
            학생들이 생성형 AI를 직접 써보며 익힐 수 있게 합니다.
          </p>
          <div class="stripe-actions">
            <RouterLink class="stripe-button stripe-button-primary" :to="startPath">시작하기</RouterLink>
            <RouterLink class="stripe-button stripe-button-secondary" to="/quiz-rooms">퀴즈룸 보기</RouterLink>
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
              <span>sunset</span>
              <span>future city</span>
              <span>robot</span>
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
              <strong>AI 이미지 퀴즈</strong>
              <span>장면을 읽고 프롬프트를 완성</span>
            </div>
          </div>

          <div class="score-panel">
            <span>Similarity score</span>
            <strong>92%</strong>
            <div class="score-meter"><span></span></div>
          </div>

          <div class="code-panel">
            <span>feedback.generated</span>
            <code>핵심 사물 4개 중 3개 일치</code>
          </div>
        </div>
      </div>
    </section>

    <section class="motion-story">
      <div class="stripe-container motion-stage">
        <div class="motion-copy reveal-on-scroll">
          <span class="stripe-kicker">Scroll workflow</span>
          <h2>스크롤할수록 수업 장면이 단계별로 열립니다.</h2>
          <p>
            Framer처럼 한 화면 안에서 제품 장면이 전환되도록, 프롬프트 제작부터 학생 답안,
            AI 피드백까지 흐름을 움직이는 컴포넌트로 보여줍니다.
          </p>
        </div>

        <div class="motion-canvas" aria-label="스크롤 인터랙션 미리보기">
          <div class="orbit-ring"></div>
          <article class="motion-card motion-card-one">
            <span>Step 1</span>
            <strong>프롬프트 생성</strong>
            <p>키워드와 스타일을 조합해 문제의 기준 답안을 만듭니다.</p>
          </article>
          <article class="motion-card motion-card-two">
            <span>Step 2</span>
            <strong>퀴즈룸 공개</strong>
            <p>학생들이 이미지를 보고 장면을 언어로 재구성합니다.</p>
          </article>
          <article class="motion-card motion-card-three">
            <span>Step 3</span>
            <strong>AI 피드백</strong>
            <p>유사도와 누락 요소를 즉시 확인하고 다시 시도합니다.</p>
          </article>
        </div>
      </div>

      <div class="quiz-image-marquee" aria-label="퀴즈 이미지 예시">
        <div class="quiz-image-track">
          <div class="quiz-shot shot-city"><span>미래 도시</span></div>
          <div class="quiz-shot shot-forest"><span>숲속 로봇</span></div>
          <div class="quiz-shot shot-ocean"><span>바닷속 도서관</span></div>
          <div class="quiz-shot shot-space"><span>우주 정거장</span></div>
          <div class="quiz-shot shot-desert"><span>사막 연구소</span></div>
          <div class="quiz-shot shot-cafe"><span>고양이 카페</span></div>
          <div class="quiz-shot shot-city"><span>미래 도시</span></div>
          <div class="quiz-shot shot-forest"><span>숲속 로봇</span></div>
          <div class="quiz-shot shot-ocean"><span>바닷속 도서관</span></div>
          <div class="quiz-shot shot-space"><span>우주 정거장</span></div>
          <div class="quiz-shot shot-desert"><span>사막 연구소</span></div>
          <div class="quiz-shot shot-cafe"><span>고양이 카페</span></div>
        </div>
      </div>
    </section>

    <section class="stripe-container stripe-solutions">
      <div class="section-copy reveal-on-scroll">
        <span class="stripe-kicker">Classroom workflow</span>
        <h2>수업 준비부터 학생 피드백까지 하나의 흐름으로.</h2>
      </div>

      <div class="solution-grid">
        <article class="solution-card reveal-on-scroll">
          <span class="solution-number">01</span>
          <h3>프롬프트 제작</h3>
          <p>주제, 스타일, 키워드를 조합해 수업용 프롬프트와 이미지를 빠르게 준비합니다.</p>
        </article>
        <article class="solution-card reveal-on-scroll">
          <span class="solution-number">02</span>
          <h3>퀴즈룸 운영</h3>
          <p>학생은 이미지를 보고 답안을 제출하고, 교사는 참여 흐름을 한눈에 확인합니다.</p>
        </article>
        <article class="solution-card reveal-on-scroll">
          <span class="solution-number">03</span>
          <h3>AI 피드백</h3>
          <p>원본 프롬프트와 답안을 비교해 유사도, 누락 요소, 개선 방향을 즉시 제공합니다.</p>
        </article>
      </div>
    </section>

    <section class="stripe-metrics">
      <div class="stripe-container metrics-grid">
        <div>
          <span>3단계</span>
          <p>생성, 풀이, 피드백으로 이어지는 학습 흐름</p>
        </div>
        <div>
          <span>실시간</span>
          <p>제출 직후 확인하는 AI 유사도 채점</p>
        </div>
        <div>
          <span>교사용</span>
          <p>수업 자료와 퀴즈룸을 관리하는 제작 스튜디오</p>
        </div>
        <div>
          <span>학생용</span>
          <p>이미지를 관찰하고 언어로 재구성하는 퀴즈 경험</p>
        </div>
      </div>
    </section>
  </section>
</template>
