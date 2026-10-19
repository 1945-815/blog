<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { data as articles } from '../../../articles.data'
import { topics, topicArticles } from '../blog'
import { allTagOptions, byRouteDate, hasTag, tagKey } from '../tags'
import Banner from './Banner.vue'
import ArticleCard from './ArticleCard.vue'
import ProfileCard from './ProfileCard.vue'
import CategoryCard from './CategoryCard.vue'

const latest = computed(() => [...articles].reverse().slice(0, 8))
const popularTags = allTagOptions(articles).filter((item) => item.count > 0).slice(0, 7)
const activeTag = ref('')
const visible = computed(() => activeTag.value
  ? articles.filter((article) => hasTag(article, activeTag.value)).sort(byRouteDate)
  : latest.value)

function syncFromUrl() {
  activeTag.value = new URLSearchParams(window.location.search).get('tag')?.trim() || ''
}

function selectTag(tag: string) {
  const next = tagKey(tag) === tagKey(activeTag.value) ? '' : tag
  const url = new URL(window.location.href)
  if (next) url.searchParams.set('tag', next)
  else url.searchParams.delete('tag')
  window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`)
  activeTag.value = next
}

onMounted(() => {
  syncFromUrl()
  window.addEventListener('popstate', syncFromUrl)
})
onUnmounted(() => window.removeEventListener('popstate', syncFromUrl))
</script>

<template>
  <div class="blog-home">
    <Banner />
    <div class="blog-shell">
      <div class="blog-main-grid">
        <main class="blog-feed" id="latest-articles">
          <div class="section-heading"><div><p class="section-eyebrow">THE JOURNAL</p><h2>{{ activeTag ? `关于 ${activeTag}` : '近期文章' }}</h2><p>从实际问题出发，整理可以复盘的技术笔记。</p></div><a :href="withBase('/articles/')">查看全部文章 ↗</a></div>
          <div class="home-filter" aria-label="在首页筛选文章"><span>探索主题</span><button type="button" :class="{ active: !activeTag }" :aria-pressed="!activeTag" @click="selectTag('')">全部</button><button v-for="item in popularTags" :key="item.name" type="button" :class="{ active: tagKey(activeTag) === tagKey(item.name) }" :aria-pressed="tagKey(activeTag) === tagKey(item.name)" @click="selectTag(item.name)">{{ item.name }}</button><a :href="withBase('/tags/')">更多标签 <span aria-hidden="true">↗</span></a></div>
          <p v-if="activeTag" class="home-filter-status" role="status">找到 {{ visible.length }} 篇相关文章 <button type="button" @click="selectTag('')">清除筛选</button></p>
          <div v-if="visible.length" class="article-list"><ArticleCard v-for="article in visible" :key="article.url" :article="article" inline-tags @tag-select="selectTag" /></div>
          <div v-else class="empty-card">这个标签暂时没有相关文章。<button type="button" class="clear-tags" @click="selectTag('')">查看近期文章 →</button></div>
          <a class="all-articles-link" :href="withBase('/articles/')">浏览全部 {{ articles.length }} 篇文章 <span aria-hidden="true">→</span></a>
        </main>
        <ProfileCard :articles="articles" />
      </div>
      <section v-reveal class="home-categories" aria-labelledby="category-title"><div class="section-heading"><div><p class="section-eyebrow">EXPLORE BY TOPIC</p><h2 id="category-title">按技术方向阅读</h2></div><a :href="withBase('/categories/')">全部分类 ↗</a></div><div class="category-grid"><CategoryCard v-for="topic in topics.filter((item) => !['python', 'frontend', 'notes'].includes(item.id))" :key="topic.id" v-bind="topic" :count="topicArticles(articles, topic.id).length" /></div></section>
    </div>
  </div>
</template>
