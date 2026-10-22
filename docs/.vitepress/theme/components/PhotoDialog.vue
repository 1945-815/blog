<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { X, ChevronLeft, ChevronRight } from 'lucide-vue-next'

export interface ViewerPhoto {
  src: string
  alt: string
  caption?: string
  takenAt?: string
}

const props = defineProps<{ photos: ViewerPhoto[]; index: number }>()
const emit = defineEmits<{ close: []; previous: []; next: [] }>()
let touchStartX = 0
let oldOverflow = ''

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
  if (event.key === 'ArrowLeft') emit('previous')
  if (event.key === 'ArrowRight') emit('next')
}

function onTouchStart(event: TouchEvent) { touchStartX = event.changedTouches[0]?.clientX || 0 }
function onTouchEnd(event: TouchEvent) {
  const end = event.changedTouches[0]?.clientX || 0
  const delta = end - touchStartX
  if (Math.abs(delta) < 48) return
  if (delta > 0) emit('previous')
  else emit('next')
}

watch(() => props.photos, () => { if (!props.photos.length) emit('close') })
onMounted(() => {
  oldOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', onKeyDown)
})
onUnmounted(() => {
  document.body.style.overflow = oldOverflow
  document.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <div class="photo-dialog-backdrop" role="dialog" aria-modal="true" aria-label="照片预览" @click.self="emit('close')" @touchstart="onTouchStart" @touchend="onTouchEnd">
    <button type="button" class="photo-dialog-close" aria-label="关闭预览" @click="emit('close')"><X :size="22" /></button>
    <button v-if="photos.length > 1" type="button" class="photo-dialog-arrow previous" aria-label="上一张" @click="emit('previous')"><ChevronLeft :size="25" /></button>
    <figure v-if="photos[index]" class="photo-dialog-content">
      <img :src="photos[index].src" :alt="photos[index].alt" />
      <figcaption><span>{{ photos[index].caption || photos[index].alt }}</span><time v-if="photos[index].takenAt" :datetime="photos[index].takenAt">{{ photos[index].takenAt }}</time></figcaption>
    </figure>
    <button v-if="photos.length > 1" type="button" class="photo-dialog-arrow next" aria-label="下一张" @click="emit('next')"><ChevronRight :size="25" /></button>
    <span class="photo-dialog-count" aria-live="polite">{{ index + 1 }} / {{ photos.length }}</span>
  </div>
</template>
