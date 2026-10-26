<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { data as articles } from '../../../articles.data'
import { allTagOptions, byRouteDate, hasTag, tagKey } from '../tags'
import ArticleCard from './ArticleCard.vue'

const pageSize = 8
const selected = ref<string[]>([])
const page = ref(1)
const tagQuery = ref('')
const options = allTagOptions(articles)

const filteredOptions = computed(() => options.filter((option) => tagKey(option.name).includes(tagKey(tagQuery.value))).slice(0, tagQuery.value ? 60 : 32))
const matching = computed(() => articles.filter((article) => selected.value.every((name) => hasTag(article, name))).sort(byRouteDate))
const totalPages = computed(() => Math.max(1, Math.ceil(matching.value.length / pageSize)))
const currentPage = computed(() => Math.min(page.value, totalPages.value))
const visible = computed(() => matching.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize))

function syncFromUrl() {
  const params = new URLSearchParams(window.location.search)
  selected.value = [...new Map(params.getAll('tag').filter(Boolean).map((name) => [tagKey(name), name])).values()]
  tagQuery.value = ''
  const requestedPage = Number(params.get('page'))
  page.value = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
}

function updateUrl(tags: string[], nextPage = 1) {
  selected.value = tags
  page.value = nextPage
  const params = new URLSearchParams()
  tags.forEach((name) => params.append('tag', name))
  if (nextPage > 1) params.set('page', String(nextPage))
  const query = params.toString()
  window.history.pushState({}, '', `${withBase('/tags/')}${query ? `?${query}` : ''}`)
}

function toggleTag(name: string) {
  const exists = selected.value.some((item) => tagKey(item) === tagKey(name))
  updateUrl(exists ? selected.value.filter((item) => tagKey(item) !== tagKey(name)) : [...selected.value, name])
}

function goToPage(nextPage: number) {
  updateUrl(selected.value, nextPage)
  document.getElementById('tag-results')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
}

onMounted(() => {
  syncFromUrl()
  window.addEventListener('popstate', syncFromUrl)
  window.addEventListener('blog-tags-change', syncFromUrl)
})
onUnmounted(() => {
  window.removeEventListener('popstate', syncFromUrl)
  window.removeEventListener('blog-tags-change', syncFromUrl)
})
</script>

<template>
  <div class="blog-shell archive-page tag-search-page">
    <header class="archive-header"><a class="breadcrumb" :href="withBase('/articles/')">文章归档 /</a><p class="section-eyebrow">FIND BY TAG</p><h1>Tag 标签检索</h1><p>按 Front Matter 标签与分类查找文章。选择多个标签时，只显示同时匹配的文章。</p></header>
    <section class="tag-filter-panel" aria-label="标签筛选">
      <div class="tag-filter-heading"><div><h2>筛选标签</h2><p>点击标签可添加或移除筛选条件。</p></div><button v-if="selected.length" class="clear-tags" type="button" @click="updateUrl([])">清除筛选</button></div>
      <div v-if="selected.length" class="selected-tags" aria-label="已选标签"><button v-for="name in selected" :key="name" type="button" :aria-label="`移除 ${name}`" @click="toggleTag(name)">{{ name }} <span aria-hidden="true">×</span></button></div>
      <label class="tag-search-label" for="tag-search-input">查找标签</label><input id="tag-search-input" v-model="tagQuery" class="tag-search-input" type="search" placeholder="输入 Java、Redis、RAG…" autocomplete="off" />
      <div class="tag-option-grid"><button v-for="option in filteredOptions" :key="option.name" type="button" :class="{ selected: selected.some((name) => tagKey(name) === tagKey(option.name)) }" :aria-pressed="selected.some((name) => tagKey(name) === tagKey(option.name))" @click="toggleTag(option.name)">{{ option.name }} <b>{{ option.count }}</b></button></div>
      <p v-if="!filteredOptions.length" class="tag-empty-options">没有匹配的标签。</p>
      <p v-else-if="!tagQuery" class="tag-filter-hint">显示常用标签；输入名称可查找全部 {{ options.length }} 个标签与技术主题。</p>
    </section>
    <main class="blog-feed" id="tag-results"><div class="section-heading"><div><p class="section-eyebrow">RELATED ARTICLES</p><h2>{{ selected.length ? `Tag：${selected.join(' + ')}` : '全部文章' }}</h2><p aria-live="polite">相关文章：{{ matching.length }} 篇 · 按主题顺序排列</p></div></div><div v-if="visible.length" class="article-list"><ArticleCard v-for="article in visible" :key="article.url" :article="article" /></div><div v-else class="empty-card"><h2>没有同时匹配的文章</h2><p>可以移除一个筛选条件，或选择其他标签。</p><button type="button" class="clear-tags" @click="updateUrl([])">查看全部文章 →</button></div><nav v-if="totalPages > 1" class="tag-pagination" aria-label="文章分页"><button type="button" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">上一页</button><button v-for="number in totalPages" :key="number" type="button" :class="{ active: currentPage === number }" :aria-current="currentPage === number ? 'page' : undefined" @click="goToPage(number)">{{ number }}</button><button type="button" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">下一页</button></nav></main>
  </div>
</template>
