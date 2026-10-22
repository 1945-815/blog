<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { moments } from '../data/moments'
import { friends } from '../data/friends'

const newestMoment = computed(() => [...moments].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0])
</script>

<template>
  <section v-reveal class="home-life-preview" aria-label="个人动态与友情链接">
    <article class="life-preview-card"><div class="section-heading"><div><p class="section-eyebrow">MOMENTS</p><h2>最近的说说</h2></div><a :href="withBase('/moments/')">全部说说 ↗</a></div><p v-if="newestMoment" class="life-preview-copy">{{ newestMoment.content }}</p><p v-else class="life-preview-empty">还没有公开随笔；有真实内容后会显示在这里。</p></article>
    <article class="life-preview-card"><div class="section-heading"><div><p class="section-eyebrow">FRIENDS</p><h2>友情链接</h2></div><a :href="withBase('/friends/')">浏览友链 ↗</a></div><div v-if="friends.length" class="life-friend-list"><a v-for="friend in friends.slice(0, 4)" :key="friend.url" :href="friend.url" target="_blank" rel="noopener noreferrer">{{ friend.name }}</a></div><p v-else class="life-preview-empty">友链将在核实后展示，目前没有已确认的站点。</p></article>
  </section>
</template>
