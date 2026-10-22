<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vitepress'
import { X, ZoomIn } from 'lucide-vue-next'

const route = useRoute()
const open = ref(false)
const source = ref('')
const description = ref('')
let previousOverflow = ''

function isArticleImage(image: HTMLImageElement) {
  return Boolean(image.closest('.VPDoc .vp-doc') && !image.closest('a, button, [role="button"]'))
}

function enhanceImages() {
  document.querySelectorAll<HTMLImageElement>('.VPDoc .vp-doc img').forEach((image) => {
    if (!isArticleImage(image)) return
    image.tabIndex = 0
    image.setAttribute('role', 'button')
    image.setAttribute('aria-label', image.alt ? `查看图片：${image.alt}` : '查看图片预览')
  })
}

function show(image: HTMLImageElement) {
  source.value = image.currentSrc || image.src
  description.value = image.alt || '文章图片预览'
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  open.value = true
}

function hide() {
  open.value = false
  source.value = ''
  description.value = ''
  document.body.style.overflow = previousOverflow
}

function onClick(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof HTMLImageElement) || !isArticleImage(target)) return
  event.preventDefault()
  show(target)
}

function onKeyDown(event: KeyboardEvent) {
  if (open.value && event.key === 'Escape') { hide(); return }
  const target = event.target
  if ((event.key === 'Enter' || event.key === ' ') && target instanceof HTMLImageElement && isArticleImage(target)) {
    event.preventDefault()
    show(target)
  }
}

watch(() => route.path, async () => { hide(); await nextTick(); enhanceImages() })
onMounted(async () => {
  await nextTick()
  enhanceImages()
  document.addEventListener('click', onClick)
  document.addEventListener('keydown', onKeyDown)
})
onUnmounted(() => {
  document.removeEventListener('click', onClick)
  document.removeEventListener('keydown', onKeyDown)
  document.body.style.overflow = previousOverflow
})
</script>

<template>
  <div v-if="open" class="image-lightbox" role="dialog" aria-modal="true" aria-label="图片预览" @click.self="hide">
    <button type="button" class="image-lightbox-close" aria-label="关闭图片预览" @click="hide"><X :size="22" /></button>
    <figure><img :src="source" :alt="description" /><figcaption>{{ description }}</figcaption></figure>
    <ZoomIn class="image-lightbox-mark" :size="18" aria-hidden="true" />
  </div>
</template>
