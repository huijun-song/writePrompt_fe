<script setup>
import { nextTick, onBeforeUnmount, ref } from 'vue'

const canvasRef = ref(null)
const isCelebrating = ref(false)

let animationFrameId = 0
let resizeCleanup = null
let particles = []
let streamers = []

const fireworkPalette = ['#facc15', '#fb923c', '#22c55e', '#38bdf8', '#818cf8', '#f8fafc']
const fanfarePalette = ['#dc2626', '#ef4444', '#f97316', '#fb923c', '#facc15', '#fde68a', '#ffffff']

function resizeCanvas(canvas) {
  const pixelRatio = window.devicePixelRatio || 1
  canvas.width = Math.floor(window.innerWidth * pixelRatio)
  canvas.height = Math.floor(window.innerHeight * pixelRatio)
  canvas.style.width = `${window.innerWidth}px`
  canvas.style.height = `${window.innerHeight}px`

  const context = canvas.getContext('2d')
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
}

function prepareCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return false

  resizeCanvas(canvas)
  resizeCleanup?.()

  const handleResize = () => resizeCanvas(canvas)
  window.addEventListener('resize', handleResize)
  resizeCleanup = () => window.removeEventListener('resize', handleResize)

  return true
}

function createBurst(originX, originY, size = 1) {
  const count = Math.round(72 * size)

  for (let index = 0; index < count; index += 1) {
    const angle = (Math.PI * 2 * index) / count + Math.random() * 0.28
    const speed = 2.2 + Math.random() * 5.8 * size
    const color = fireworkPalette[Math.floor(Math.random() * fireworkPalette.length)]

    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - Math.random() * 2.4,
      color,
      size: 2 + Math.random() * 3.5,
      life: 0,
      maxLife: 62 + Math.random() * 42,
      spin: Math.random() * Math.PI,
      sparkle: Math.random() > 0.58,
    })
  }
}

function createFanfareSide(side) {
  const isLeft = side === 'left'
  const originX = isLeft ? 0 : window.innerWidth
  const originY = window.innerHeight * 0.66
  const direction = isLeft ? 1 : -1

  for (let index = 0; index < 28; index += 1) {
    const vx = direction * (10 + Math.random() * 22)
    const vy = -(8 + Math.random() * 20)
    const color = fanfarePalette[Math.floor(Math.random() * fanfarePalette.length)]

    streamers.push({
      x: originX + direction * Math.random() * 10,
      y: originY + (Math.random() - 0.5) * 220,
      vx,
      vy,
      color,
      length: 180 + Math.random() * 340,
      thickness: 9 + Math.random() * 11,
      wave: 54 + Math.random() * 74,
      rotation: Math.atan2(vy, vx),
      rotationSpeed: 0,
      life: 0,
      maxLife: 150 + Math.random() * 58,
      type: 'ribbon',
    })
  }

  for (let index = 0; index < 180; index += 1) {
    const vx = direction * (6 + Math.random() * 24)
    const vy = -(6 + Math.random() * 24)
    const color = fanfarePalette[Math.floor(Math.random() * fanfarePalette.length)]
    const isHeart = Math.random() > 0.64

    streamers.push({
      x: originX + direction * Math.random() * 10,
      y: originY + (Math.random() - 0.5) * 260,
      vx,
      vy,
      color,
      length: 10 + Math.random() * 18,
      thickness: 6 + Math.random() * 8,
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - 0.5) * 0.28,
      life: 0,
      maxLife: 142 + Math.random() * 72,
      type: isHeart ? 'heart' : 'confetti',
    })
  }
}

function createFinale() {
  const bursts = [
    [0.18, 0.34, 0.9],
    [0.34, 0.22, 1.08],
    [0.5, 0.32, 1.22],
    [0.67, 0.24, 1.08],
    [0.82, 0.36, 0.9],
    [0.42, 0.48, 0.78],
    [0.58, 0.47, 0.78],
  ]

  bursts.forEach(([xRatio, yRatio, size], index) => {
    if (index === 0) {
      createBurst(window.innerWidth * xRatio, window.innerHeight * yRatio, size)
      return
    }

    window.setTimeout(() => {
      createBurst(window.innerWidth * xRatio, window.innerHeight * yRatio, size)
    }, index * 130)
  })
}

function drawParticle(context, particle) {
  const progress = particle.life / particle.maxLife
  const alpha = Math.max(0, 1 - progress)
  const radius = particle.size * (1 - progress * 0.4)

  context.save()
  context.globalAlpha = alpha
  context.translate(particle.x, particle.y)
  context.rotate(particle.spin + particle.life * 0.12)
  context.fillStyle = particle.color

  if (particle.sparkle) {
    context.fillRect(-radius * 1.8, -radius * 0.35, radius * 3.6, radius * 0.7)
    context.fillRect(-radius * 0.35, -radius * 1.8, radius * 0.7, radius * 3.6)
  } else {
    context.beginPath()
    context.arc(0, 0, radius, 0, Math.PI * 2)
    context.fill()
  }

  context.restore()
}

function drawStreamer(context, streamer) {
  const progress = streamer.life / streamer.maxLife
  const alpha = Math.max(0, 1 - progress)
  const curve = streamer.wave * Math.sin(progress * Math.PI)
  const length = streamer.length * (1 - progress * 0.24)

  context.save()
  context.globalAlpha = alpha
  context.translate(streamer.x, streamer.y)
  context.rotate(streamer.rotation)

  if (streamer.type === 'ribbon') {
    context.strokeStyle = streamer.color
    context.lineWidth = streamer.thickness
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.beginPath()
    context.moveTo(0, 0)
    context.bezierCurveTo(
      -length * 0.24,
      curve,
      -length * 0.54,
      -curve,
      -length,
      curve * 0.52,
    )
    context.stroke()
  } else if (streamer.type === 'heart') {
    const size = streamer.length * 0.72
    context.fillStyle = streamer.color
    context.beginPath()
    context.moveTo(0, size * 0.32)
    context.bezierCurveTo(-size, -size * 0.28, -size * 0.5, -size, 0, -size * 0.46)
    context.bezierCurveTo(size * 0.5, -size, size, -size * 0.28, 0, size * 0.32)
    context.fill()
  } else {
    context.fillStyle = streamer.color
    context.fillRect(-streamer.length / 2, -streamer.thickness / 2, streamer.length, streamer.thickness)
  }

  context.restore()
}

function animate() {
  const canvas = canvasRef.value
  if (!canvas) return

  const context = canvas.getContext('2d')
  context.clearRect(0, 0, window.innerWidth, window.innerHeight)

  particles = particles.filter((particle) => particle.life < particle.maxLife)
  streamers = streamers.filter((streamer) => streamer.life < streamer.maxLife)

  particles.forEach((particle) => {
    particle.life += 1
    particle.x += particle.vx
    particle.y += particle.vy
    particle.vx *= 0.986
    particle.vy = particle.vy * 0.986 + 0.075
    drawParticle(context, particle)
  })

  streamers.forEach((streamer) => {
    streamer.life += 1
    streamer.x += streamer.vx
    streamer.y += streamer.vy
    streamer.vx *= 0.992
    streamer.vy = streamer.vy * 0.99 + 0.34
    streamer.rotation += streamer.rotationSpeed
    drawStreamer(context, streamer)
  })

  if (particles.length > 0 || streamers.length > 0) {
    animationFrameId = window.requestAnimationFrame(animate)
    return
  }

  isCelebrating.value = false
  animationFrameId = 0
}

function startAnimation() {
  if (!animationFrameId) {
    animationFrameId = window.requestAnimationFrame(animate)
  }
}

async function launchFireworks() {
  isCelebrating.value = true
  await nextTick()
  if (!prepareCanvas()) return

  particles = []
  streamers = []
  createFinale()
  startAnimation()
}

async function launchFanfare() {
  isCelebrating.value = true
  await nextTick()
  if (!prepareCanvas()) return

  particles = []
  streamers = []
  createFanfareSide('left')
  createFanfareSide('right')
  startAnimation()
}

onBeforeUnmount(() => {
  if (animationFrameId) window.cancelAnimationFrame(animationFrameId)
  resizeCleanup?.()
})

defineExpose({
  launchFanfare,
  launchFireworks,
})
</script>

<template>
  <canvas ref="canvasRef" class="celebration-canvas" aria-hidden="true"></canvas>
</template>

<style scoped>
.celebration-canvas {
  position: fixed;
  inset: 0;
  z-index: 80;
  pointer-events: none;
}
</style>
