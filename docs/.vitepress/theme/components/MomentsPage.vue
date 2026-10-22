<script setup lang="ts">
import { computed, ref } from 'vue'
import { MessageSquareText } from 'lucide-vue-next'
import { withBase } from 'vitepress'
import { moments } from '../data/moments'
import PhotoDialog from './PhotoDialog.vue'
import type { ViewerPhoto } from './PhotoDialog.vue'

const expanded = ref<string[]>([])
const photoIndex = ref(-1)
const imageList = computed(() => moments.flatMap((moment) => moment.images || []))
const viewerPhotos = computed(() => imageList.value.map((image) => ({ ...image, src: assetUrl(image.src) })))
const orderedMoments = computed(() => [...moments].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || b.publishedAt.localeCompare(a.publishedAt)))
function toggleExpanded(id: string) { expanded.value = expanded.value.includes(id) ? expanded.value.filter((item) => item !== id) : [...expanded.value, id] }
function isLong(text: string) { return text.length > 280 }
function preview(text: string) { return text.slice(0, 280).trimEnd() + '…' }
function assetUrl(source: string) { return /^https?:\/\//i.test(source) ? source : withBase(source.startsWith('/') ? source : `/${source}`) }
function changePhoto(direction: number) {
  if (!imageList.value.length) return
  photoIndex.value = (photoIndex.value + direction + imageList.value.length) % imageList.value.length
}
</script>

<template>
  <main class="content-page blog-shell moments-page">
    <header class="page-heading"><p class="section-eyebrow">MOMENTS</p><h1>说说 · 随笔</h1><p>记录日常想法、学习心得与生活片段，按实际发布时间展示。</p></header>
    <div v-if="orderedMoments.length" class="moments-timeline">
      <article v-for="moment in orderedMoments" :key="moment.id" class="moment-card" :class="{ pinned: moment.pinned }">
        <div class="moment-marker" aria-hidden="true"></div>
        <header><div><span v-if="moment.pinned" class="moment-pinned">置顶</span><span v-if="moment.mood" class="moment-mood">{{ moment.mood }}</span></div><time :datetime="moment.publishedAt">{{ moment.publishedAt }}</time></header>
        <p class="moment-content">{{ isLong(moment.content) && !expanded.includes(moment.id) ? preview(moment.content) : moment.content }}</p>
        <button v-if="isLong(moment.content)" class="moment-expand" type="button" :aria-expanded="expanded.includes(moment.id)" @click="toggleExpanded(moment.id)">{{ expanded.includes(moment.id) ? '收起' : '阅读更多' }}</button>
        <div v-if="moment.images?.length" class="moment-images"><button v-for="image in moment.images" :key="image.src" type="button" class="moment-image" :aria-label="`预览图片：${image.alt}`" @click="photoIndex = imageList.findIndex((item) => item.src === image.src)"><img :src="assetUrl(image.src)" :alt="image.alt" loading="lazy" /></button></div>
        <div v-if="moment.tags?.length" class="friend-tags"><span v-for="tag in moment.tags" :key="tag">{{ tag }}</span></div>
      </article>
    </div>
    <div v-else class="empty-state"><MessageSquareText :size="28" aria-hidden="true" /><h2>还没有公开说说</h2><p>添加真实内容后，这里会按时间展示随笔、可选图片与标签。</p><a :href="withBase('/about')">先了解我的技术方向 →</a></div>
    <PhotoDialog v-if="photoIndex >= 0 && imageList.length" :photos="viewerPhotos as ViewerPhoto[]" :index="photoIndex" @close="photoIndex = -1" @previous="changePhoto(-1)" @next="changePhoto(1)" />
  </main>
</template>
