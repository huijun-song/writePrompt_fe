<script setup>
import { ref } from 'vue'
import CelebrationEffects from '../components/CelebrationEffects.vue'

const celebrationEffects = ref(null)
</script>

<template>
  <section class="fireworks-page">
    <CelebrationEffects ref="celebrationEffects" />

    <div class="celebration-stage">
      <p class="celebration-kicker">Quiz Complete Effect Test</p>
      <h1>퀴즈 완료 축하 효과</h1>
      <p class="celebration-copy">
        팡파르는 퀴즈별 채점/피드백 완료 시, 폭죽은 최종 결과 화면 진입 시 사용됩니다.
      </p>
      <button
        class="button primary celebration-button"
        type="button"
        @click="celebrationEffects?.launchFireworks()"
      >
        폭죽 터뜨리기
      </button>
      <button
        class="button secondary fanfare-button"
        type="button"
        @click="celebrationEffects?.launchFanfare()"
      >
        팡파르 터뜨리기
      </button>
    </div>
  </section>
</template>

<style scoped>
.fireworks-page {
  position: relative;
  display: grid;
  min-height: calc(100vh - 121px);
  overflow: hidden;
  place-items: center;
  padding: 48px 24px;
  color: white;
  background:
    radial-gradient(circle at 26% 24%, rgba(56, 189, 248, 0.32), transparent 30%),
    radial-gradient(circle at 76% 18%, rgba(249, 115, 22, 0.3), transparent 28%),
    linear-gradient(135deg, #0f172a 0%, #312e81 54%, #0f766e 100%);
}

.celebration-stage {
  position: relative;
  z-index: 2;
  width: min(720px, 100%);
  text-align: center;
}

.celebration-kicker {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  padding: 0 14px;
  color: #bae6fd;
  background: rgba(15, 23, 42, 0.32);
  font-size: 13px;
  font-weight: 900;
}

.celebration-stage h1 {
  margin: 20px 0 0;
  font-size: clamp(38px, 6vw, 68px);
  line-height: 1.08;
}

.celebration-copy {
  margin: 22px auto 0;
  max-width: 560px;
  color: #dbeafe;
  font-size: 18px;
  line-height: 1.65;
}

.celebration-button {
  margin-top: 34px;
  min-width: 174px;
  border-color: rgba(255, 255, 255, 0.2);
  background: #4f46e5;
  box-shadow: 0 16px 32px rgba(79, 70, 229, 0.32);
}

.celebration-button:hover {
  background: #4338ca;
}

.fanfare-button {
  margin-top: 34px;
  margin-left: 12px;
  min-width: 174px;
  border-color: rgba(249, 115, 22, 0.52);
  color: white;
  background: rgba(249, 115, 22, 0.24);
  box-shadow: 0 16px 32px rgba(249, 115, 22, 0.24);
}

.fanfare-button:hover {
  background: rgba(249, 115, 22, 0.36);
}

@media (max-width: 560px) {
  .celebration-button,
  .fanfare-button {
    width: 100%;
    margin-left: 0;
  }
}
</style>
