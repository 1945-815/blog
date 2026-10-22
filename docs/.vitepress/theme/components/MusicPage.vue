<script setup lang="ts">
import { Music2 } from 'lucide-vue-next'
import { tracks } from '../data/music'
</script>

<template>
  <main class="content-page blog-shell music-page">
    <header class="page-heading"><p class="section-eyebrow">MUSIC</p><h1>音乐</h1><p>播放器固定在页面右下角；切换站内页面时，当前播放状态会继续保留。</p></header>
    <section v-if="tracks.length" class="music-library" aria-label="音乐列表"><article v-for="(track, index) in tracks" :key="`${track.src}-${index}`"><span class="music-library-index">{{ String(index + 1).padStart(2, '0') }}</span><div><h2>{{ track.title }}</h2><p>{{ track.artist }}</p></div></article></section>
    <div v-else class="empty-state"><Music2 :size="28" aria-hidden="true" /><h2>还没有可用曲目</h2><p>添加有使用权的本地音频、稳定公开音源或官方嵌入链接后，播放器会自动显示曲目列表。当前不会自动播放，也不会显示虚构歌曲。</p></div>
  </main>
</template>
