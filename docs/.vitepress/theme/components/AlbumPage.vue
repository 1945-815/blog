<script setup lang="ts">
import { computed, ref } from 'vue'
import { Image as ImageIcon } from 'lucide-vue-next'
import { withBase } from 'vitepress'
import { publicAlbums } from '../data/albums'
import type { AlbumPhoto, PhotoAlbum } from '../data/albums'
import PhotoDialog from './PhotoDialog.vue'
import LoveAlbum from './LoveAlbum.vue'

const selectedCategory = ref('全部')
const selectedAlbumId = ref('')
const lightboxIndex = ref(-1)
const categories = computed(() => ['全部', ...new Set(publicAlbums.map((album) => album.category).filter(Boolean))])
const visibleAlbums = computed(() => publicAlbums.filter((album) => selectedCategory.value === '全部' || album.category === selectedCategory.value))
const currentAlbum = computed(() => publicAlbums.find((album) => album.id === selectedAlbumId.value) || null)
const currentPhotos = computed(() => currentAlbum.value?.photos || [])
const viewerPhotos = computed(() => currentPhotos.value.map((photo) => ({ ...photo, src: assetUrl(photo.src) })))

function assetUrl(source: string) { return /^https?:\/\//i.test(source) ? source : withBase(source.startsWith('/') ? source : `/${source}`) }
function coverOf(album: PhotoAlbum): AlbumPhoto | undefined { return album.cover ? { src: album.cover, alt: `${album.title}相册封面` } : album.photos[0] }
function openPhoto(index: number) { lightboxIndex.value = index }
function changePhoto(direction: number) {
  const length = currentPhotos.value.length
  if (length) lightboxIndex.value = (lightboxIndex.value + direction + length) % length
}
</script>

<template>
  <main class="content-page blog-shell album-page">
    <header class="page-heading"><p class="section-eyebrow">PHOTO ALBUM</p><h1>相册</h1><p>公开照片与属于自己的私密记录分开管理。照片和说明仅在实际提供后展示。</p></header>

    <section v-if="selectedAlbumId && currentAlbum" class="album-detail" aria-labelledby="album-detail-title">
      <button class="text-back-link" type="button" @click="selectedAlbumId = ''">← 返回相册列表</button>
      <div class="section-heading"><div><p class="section-eyebrow">{{ currentAlbum.category }}</p><h2 id="album-detail-title">{{ currentAlbum.title }}</h2><p>{{ currentAlbum.description }}</p></div></div>
      <div v-if="currentPhotos.length" class="photo-grid">
        <button v-for="(photo, index) in currentPhotos" :key="`${photo.src}-${index}`" type="button" class="photo-tile" :aria-label="`预览照片：${photo.alt}`" @click="openPhoto(index)"><img :src="assetUrl(photo.src)" :alt="photo.alt" loading="lazy" /><span v-if="photo.caption">{{ photo.caption }}</span></button>
      </div>
      <div v-else class="empty-state compact"><ImageIcon :size="24" aria-hidden="true" /><p>这个相册还没有公开照片。</p></div>
    </section>

    <template v-else>
      <nav v-if="publicAlbums.length" class="album-filter-row" aria-label="相册分类"><button v-for="category in categories" :key="category" type="button" :class="{ active: selectedCategory === category }" :aria-pressed="selectedCategory === category" @click="selectedCategory = category">{{ category }}</button></nav>
      <section v-if="visibleAlbums.length" class="album-grid" aria-label="公开相册">
        <button v-for="album in visibleAlbums" :key="album.id" type="button" class="album-card" @click="selectedAlbumId = album.id">
          <div class="album-cover"><img v-if="coverOf(album)" :src="assetUrl(coverOf(album)!.src)" :alt="coverOf(album)?.alt" loading="lazy" /><span v-else class="album-cover-empty"><ImageIcon :size="26" aria-hidden="true" /></span></div>
          <span class="album-category">{{ album.category }}</span><strong>{{ album.title }}</strong><span>{{ album.photos.length }} 张照片</span><span class="album-description">{{ album.description }}</span>
        </button>
      </section>
      <div v-else class="empty-state"><ImageIcon :size="28" aria-hidden="true" /><h2>公开相册还没有照片</h2><p>照片会在你提供并加入相册数据后显示，不会用示例图片代替。</p></div>
      <LoveAlbum />
    </template>

    <PhotoDialog v-if="lightboxIndex >= 0 && currentPhotos.length" :photos="viewerPhotos" :index="lightboxIndex" @close="lightboxIndex = -1" @previous="changePhoto(-1)" @next="changePhoto(1)" />
  </main>
</template>
