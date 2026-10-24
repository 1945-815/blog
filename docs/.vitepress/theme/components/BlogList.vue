<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { data as articles } from '../../../articles.data'
import { belongsTo, topics } from '../blog'
import type { TopicId } from '../blog'
import { allTagOptions, hasTag, tagKey } from '../tags'
import ArticleCard from './ArticleCard.vue'

type SortOrder = 'plan' | 'date-desc' | 'date-asc'

const pageSize = 8
const query = ref('')
const category = ref<TopicId | ''>('')
const selectedTags = ref<string[]>([])
const sort = ref<SortOrder>('plan')
const page = ref(1)
const tagQuery = ref('')
const bodyByUrl = new Map<string, string>()
const bodyIndexReady = ref(false)
const bodyIndexLoading = ref(false)
const bodyIndexError = ref(false)
let bodyIndexPromise: Promise<void> | undefined
const availableTopics = computed(() => topics.filter((topic) => articles.some((article) => belongsTo(article, topic.id))))
const tagOptions = computed(() => allTagOptions(articles).filter((item) => item.count > 0))
const shownTags = computed(() => tagOptions.value
  .filter((item) => !tagQuery.value || tagKey(item.name).includes(tagKey(tagQuery.value)))
  .slice(0, tagQuery.value ? 60 : 18))

function matchesQuery(article: (typeof articles)[number], value: string) {
  if (!value) return true
  void bodyIndexReady.value
  const body = bodyByUrl.get(article.url) || ''
  const fields = [article.title, article.description, article.category, article.phase, ...article.tags, body].join(' ').toLocaleLowerCase()
  return value.split(/\s+/).filter(Boolean).every((term) => fields.includes(term))
}

function loadBodyIndex() {
  if (bodyIndexReady.value) return Promise.resolve()
  if (!bodyIndexPromise) {
    bodyIndexLoading.value = true
    bodyIndexError.value = false
    bodyIndexPromise = import('../../../article-search.data').then(({ data }) => {
      data.forEach((item) => bodyByUrl.set(item.url, item.text))
      bodyIndexReady.value = true
    }).catch(() => {
      bodyIndexError.value = true
      bodyIndexPromise = undefined
    }).finally(() => { bodyIndexLoading.value = false })
  }
  return bodyIndexPromise
}

const matching = computed(() => {
  const needle = query.value.trim().toLocaleLowerCase()
  const filtered = articles.filter((article) =>
    (!category.value || belongsTo(article, category.value)) &&
    selectedTags.value.every((tag) => hasTag(article, tag)) &&
    matchesQuery(article, needle)
  )

  return filtered.sort((a, b) => {
    if (sort.value === 'date-desc') return b.date.localeCompare(a.date) || b.planDate.localeCompare(a.planDate)
    if (sort.value === 'date-asc') return a.date.localeCompare(b.date) || a.planDate.localeCompare(b.planDate)
    return b.planDate.localeCompare(a.planDate) || b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'zh-CN')
  })
})
const totalPages = computed(() => Math.max(1, Math.ceil(matching.value.length / pageSize)))
const currentPage = computed(() => Math.min(page.value, totalPages.value))
const visible = computed(() => matching.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize))
const hasFilters = computed(() => Boolean(query.value || category.value || selectedTags.value.length))

function syncFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const requestedCategory = params.get('category') || ''
  category.value = topics.some((topic) => topic.id === requestedCategory) ? requestedCategory as TopicId : ''
  query.value = params.get('q')?.trim() || ''
  selectedTags.value = [...new Map(params.getAll('tag').filter(Boolean).map((name) => [tagKey(name), name])).values()]
  const requestedSort = params.get('sort')
  sort.value = requestedSort === 'date-desc' || requestedSort === 'date-asc' ? requestedSort : 'plan'
  const requestedPage = Number(params.get('page'))
  page.value = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  tagQuery.value = ''
  if (query.value) void loadBodyIndex()
}

function writeUrl(replace = false) {
  const params = new URLSearchParams()
  if (query.value.trim()) params.set('q', query.value.trim())
  if (category.value) params.set('category', category.value)
  selectedTags.value.forEach((name) => params.append('tag', name))
  if (sort.value !== 'plan') params.set('sort', sort.value)
  if (page.value > 1) params.set('page', String(page.value))
  const current = new URL(window.location.href)
  const next = `${current.pathname}${params.size ? `?${params.toString()}` : ''}${current.hash}`
  if (replace) window.history.replaceState({}, '', next)
  else window.history.pushState({}, '', next)
}

function onQueryInput() {
  page.value = 1
  writeUrl(true)
  if (query.value.trim()) void loadBodyIndex()
}

function setCategory(next: string) {
  category.value = category.value === next ? '' : next as TopicId
  page.value = 1
  writeUrl()
}

function toggleTag(name: string) {
  const key = tagKey(name)
  selectedTags.value = selectedTags.value.some((item) => tagKey(item) === key)
    ? selectedTags.value.filter((item) => tagKey(item) !== key)
    : [...selectedTags.value, name]
  page.value = 1
  writeUrl()
}

function setSort(value: SortOrder) {
  sort.value = value
  page.value = 1
  writeUrl()
}

function goToPage(nextPage: number) {
  page.value = Math.min(totalPages.value, Math.max(1, nextPage))
  writeUrl()
  document.getElementById('article-results')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
}

function clearFilters() {
  query.value = ''
  category.value = ''
  selectedTags.value = []
  page.value = 1
  tagQuery.value = ''
  writeUrl()
}

onMounted(() => {
  syncFromUrl()
  window.addEventListener('popstate', syncFromUrl)
})
onUnmounted(() => window.removeEventListener('popstate', syncFromUrl))
</script>

<template>
  <div class="blog-shell archive-page">
    <header class="archive-header">
      <p class="section-eyebrow">ALL ARTICLES</p>
      <h1>技术文章</h1>
      <p>共 {{ articles.length }} 篇文章。搜索标题、摘要、分类、标签与正文，也可以组合分类和标签筛选。</p>
      <p class="date-field-note">日期筛选使用文章 frontmatter 的 <code>date</code> 字段；“阶段参考”使用 <code>plan_date</code>，不代表公开发布日期。</p>
    </header>

    <section class="article-filter-panel" aria-label="文章筛选条件">
      <div class="article-search-row">
        <label class="article-search-control"><span>全文搜索</span><input v-model="query" type="search" placeholder="搜索标题、摘要或正文…" autocomplete="off" @input="onQueryInput" /></label>
        <label class="article-sort-control"><span>排序</span><select :value="sort" @change="setSort(($event.target as HTMLSelectElement).value as SortOrder)"><option value="plan">阶段参考顺序</option><option value="date-desc">文章 date 字段：新到旧</option><option value="date-asc">文章 date 字段：旧到新</option></select></label>
      </div>

      <div class="article-filter-group">
        <span class="article-filter-label">分类</span>
        <div class="article-filter-chips">
          <button type="button" :class="{ active: !category }" :aria-pressed="!category" @click="setCategory('')">全部分类 <b>{{ articles.length }}</b></button>
          <button v-for="topic in availableTopics" :key="topic.id" type="button" :class="{ active: category === topic.id }" :aria-pressed="category === topic.id" @click="setCategory(topic.id)">{{ topic.name }} <b>{{ articles.filter((article) => belongsTo(article, topic.id)).length }}</b></button>
        </div>
      </div>

      <div class="article-filter-group">
        <div class="article-tag-heading"><span class="article-filter-label">标签</span><input v-model="tagQuery" type="search" aria-label="查找标签" placeholder="查找标签…" autocomplete="off" /></div>
        <div class="article-filter-chips tag-chip-list">
          <button v-for="item in shownTags" :key="item.name" type="button" :class="{ active: selectedTags.some((tag) => tagKey(tag) === tagKey(item.name)) }" :aria-pressed="selectedTags.some((tag) => tagKey(tag) === tagKey(item.name))" @click="toggleTag(item.name)">{{ item.name }} <b>{{ item.count }}</b></button>
        </div>
      </div>

      <div v-if="hasFilters" class="article-filter-status" role="status" aria-live="polite">
        <span>当前条件找到 {{ matching.length }} 篇文章</span>
        <span v-if="query && bodyIndexLoading">正在载入正文索引…</span>
        <span v-if="query && bodyIndexError">正文索引加载失败，当前结果仅匹配文章信息。</span>
        <span v-if="category">分类：{{ topics.find((item) => item.id === category)?.name }}</span>
        <span v-if="selectedTags.length">标签：{{ selectedTags.join(' + ') }}</span>
        <span v-if="query">关键词：{{ query }}</span>
        <button type="button" @click="clearFilters">清除条件</button>
      </div>
    </section>

    <main class="blog-feed" id="article-results">
        <div class="section-heading"><div><p class="section-eyebrow">ARTICLE INDEX</p><h2>{{ hasFilters ? '筛选结果' : '全部文章' }}</h2><p aria-live="polite">显示 {{ visible.length }} / {{ matching.length }} 篇 · 第 {{ currentPage }} / {{ totalPages }} 页</p></div></div>
        <div v-if="visible.length" class="article-list"><ArticleCard v-for="article in visible" :key="article.url" :article="article" /></div>
        <div v-else class="empty-card"><h2>没有找到匹配文章</h2><p>试试更短的关键词、其他标签，或清除部分筛选条件。</p><button type="button" class="clear-tags" @click="clearFilters">查看全部文章 →</button></div>
        <nav v-if="totalPages > 1" class="tag-pagination" aria-label="文章分页"><button type="button" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">上一页</button><button v-for="number in totalPages" :key="number" type="button" :class="{ active: currentPage === number }" :aria-current="currentPage === number ? 'page' : undefined" @click="goToPage(number)">{{ number }}</button><button type="button" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">下一页</button></nav>
    </main>
  </div>
</template>
