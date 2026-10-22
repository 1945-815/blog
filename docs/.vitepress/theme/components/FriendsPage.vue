<script setup lang="ts">
import { computed, ref } from 'vue'
import { Link2, ExternalLink } from 'lucide-vue-next'
import { withBase } from 'vitepress'
import { friends, friendApplicationUrl } from '../data/friends'

const selectedCategory = ref('全部')
const failedLogos = ref<string[]>([])
const categories = computed(() => ['全部', ...new Set(friends.map((friend) => friend.category).filter(Boolean))])
const visibleFriends = computed(() => friends.filter((friend) => selectedCategory.value === '全部' || friend.category === selectedCategory.value))
function markLogoFailed(name: string) { if (!failedLogos.value.includes(name)) failedLogos.value.push(name) }
function logoUrl(source: string) { return /^https?:\/\//i.test(source) ? source : withBase(source.startsWith('/') ? source : `/${source}`) }
</script>

<template>
  <main class="content-page blog-shell friends-page">
    <header class="page-heading"><p class="section-eyebrow">FRIENDS</p><h1>友情链接</h1><p>发现值得阅读与交流的个人网站。这里仅展示已经核实的站点。</p></header>
    <nav v-if="friends.length" class="album-filter-row" aria-label="友链分类"><button v-for="category in categories" :key="category" type="button" :class="{ active: selectedCategory === category }" :aria-pressed="selectedCategory === category" @click="selectedCategory = category">{{ category }}</button></nav>
    <section v-if="visibleFriends.length" class="friend-grid" aria-label="友情链接列表">
      <article v-for="friend in visibleFriends" :key="friend.url" class="friend-card" :class="{ unavailable: friend.unavailable }">
        <div class="friend-card-header">
          <span v-if="friend.logo && !failedLogos.includes(friend.name)" class="friend-logo"><img :src="logoUrl(friend.logo)" :alt="`${friend.name} Logo`" loading="lazy" @error="markLogoFailed(friend.name)" /></span>
          <span v-else class="friend-logo friend-logo-fallback" aria-hidden="true">{{ friend.name.slice(0, 1) }}</span>
          <div><span class="friend-category">{{ friend.category }}</span><h2>{{ friend.name }}</h2></div>
        </div>
        <p>{{ friend.description }}</p>
        <div class="friend-tags"><span v-for="tag in friend.tags || []" :key="tag">{{ tag }}</span></div>
        <span v-if="friend.unavailable" class="friend-unavailable-label" role="status">链接暂不可用，请联系作者更新。</span>
        <a v-else :href="friend.url" target="_blank" rel="noopener noreferrer">访问网站 <ExternalLink :size="15" aria-hidden="true" /></a>
      </article>
    </section>
    <div v-else class="empty-state"><Link2 :size="28" aria-hidden="true" /><h2>还没有已确认的友链</h2><p>不会用虚构的站点名称或 Logo 填充此页。欢迎通过 GitHub Issue 提交真实的网站信息。</p></div>
    <section class="friend-apply-card"><div><p class="section-eyebrow">LINK EXCHANGE</p><h2>申请友链</h2><p>请提供网站名称、主页地址、Logo（可选）、简介与分类。申请会由我人工核对，提交表单不会自动写入本站。</p></div><a :href="friendApplicationUrl" target="_blank" rel="noopener noreferrer">在 GitHub 提交申请 <ExternalLink :size="15" aria-hidden="true" /></a></section>
  </main>
</template>
