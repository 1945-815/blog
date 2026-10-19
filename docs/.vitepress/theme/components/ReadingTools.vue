<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vitepress'
import { ArrowUp } from 'lucide-vue-next'

const route = useRoute()
const isArticle = computed(() => /\/articles\/[^/]+(?:\.html)?$/.test(route.path) && !route.path.endsWith('/index.html'))
const progress = ref(0)
const showTop = ref(false)
let frame = 0

function update() {
  frame = 0
  showTop.value = window.scrollY > 640
  document.documentElement.classList.toggle('has-scrolled', window.scrollY > 24)
  if (!isArticle.value) {
    progress.value = 0
    return
  }
  const article = document.querySelector<HTMLElement>('.VPDoc .vp-doc')
  if (!article) return
  const top = window.scrollY + article.getBoundingClientRect().top
  const length = Math.max(1, article.offsetHeight - window.innerHeight + 160)
  progress.value = Math.min(100, Math.max(0, ((window.scrollY - top + 100) / length) * 100))
}

function scheduleUpdate() {
  if (!frame) frame = window.requestAnimationFrame(update)
}

function backToTop() {
  window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}

watch(() => route.path, async () => {
  await nextTick()
  scheduleUpdate()
})

onMounted(() => {
  update()
  window.addEventListener('scroll', scheduleUpdate, { passive: true })
  window.addEventListener('resize', scheduleUpdate, { passive: true })
})
onUnmounted(() => {
  window.removeEventListener('scroll', scheduleUpdate)
  window.removeEventListener('resize', scheduleUpdate)
  if (frame) window.cancelAnimationFrame(frame)
  document.documentElement.classList.remove('has-scrolled')
})
</script>

<template>
  <div v-if="isArticle" class="reading-progress" role="progressbar" :aria-valuenow="Math.round(progress)" aria-valuemin="0" aria-valuemax="100" aria-label="阅读进度">
    <span :style="{ width: `${progress}%` }"></span>
  </div>
  <button v-if="showTop" type="button" class="back-to-top" aria-label="返回顶部" @click="backToTop">
    <ArrowUp :size="19" :stroke-width="1.8" aria-hidden="true" />
  </button>
</template>
