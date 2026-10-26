<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { data as articles } from '../../../articles.data'
import { topics, topicArticles } from '../blog'
import { allTagOptions, byRouteDate, hasTag, tagKey } from '../tags'
import { profile } from '../data/profile'
import Banner from './Banner.vue'
import ArticleCard from './ArticleCard.vue'
import CategoryCard from './CategoryCard.vue'

const latest = computed(() => [...articles].sort(byRouteDate).slice(0, 5))
const popularTags = allTagOptions(articles).filter((item) => item.count > 0).slice(0, 6)
const activeTag = ref('')
const visible = computed(() => (activeTag.value
  ? articles.filter((article) => hasTag(article, activeTag.value)).sort(byRouteDate)
  : latest.value))

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
    <main class="blog-shell home-content">
      <section v-reveal id="home-categories" class="home-categories" aria-labelledby="category-title">
        <div class="section-heading">
          <div><p class="section-eyebrow">EXPLORE BY TOPIC</p><h2 id="category-title">从一个方向开始</h2><p>围绕后端工程与 AI 应用，按主题找到相关记录。</p></div>
          <a :href="withBase('/categories/')">全部分类 <span aria-hidden="true">↗</span></a>
        </div>
        <div class="category-grid">
          <CategoryCard
            v-for="topic in topics.filter((item) => topicArticles(articles, item.id).length)"
            :key="topic.id"
            v-bind="topic"
            :count="topicArticles(articles, topic.id).length"
          />
        </div>
      </section>

      <section v-reveal id="latest-articles" class="home-journal" aria-labelledby="journal-title">
        <div class="section-heading">
          <div><p class="section-eyebrow">THE JOURNAL</p><h2 id="journal-title">近期文章</h2><p>从实际问题出发，把技术细节和思考过程写下来。</p></div>
          <a :href="withBase('/articles/')">浏览文章归档 <span aria-hidden="true">↗</span></a>
        </div>
        <div class="home-filter" aria-label="按标签筛选近期文章">
          <span>按主题</span>
          <button type="button" :class="{ active: !activeTag }" :aria-pressed="!activeTag" @click="selectTag('')">近期</button>
          <button v-for="item in popularTags" :key="item.name" type="button" :class="{ active: tagKey(activeTag) === tagKey(item.name) }" :aria-pressed="tagKey(activeTag) === tagKey(item.name)" @click="selectTag(item.name)">{{ item.name }}</button>
          <a :href="withBase('/tags/')">所有标签 <span aria-hidden="true">↗</span></a>
        </div>
        <p v-if="activeTag" class="home-filter-status" role="status">「{{ activeTag }}」相关记录 · {{ visible.length }} 篇 <button type="button" @click="selectTag('')">清除筛选</button></p>
        <div v-if="visible.length" class="article-list home-article-list">
          <ArticleCard
            v-for="article in visible"
            :key="article.url"
            :article="article"
            compact
            inline-tags
            @tag-select="selectTag"
          />
        </div>
        <div v-else class="empty-card">这个标签暂时没有相关文章。<button type="button" class="clear-tags" @click="selectTag('')">查看近期文章 →</button></div>
        <a class="all-articles-link" :href="withBase('/articles/')">在归档中搜索与筛选全部文章 <span aria-hidden="true">→</span></a>
      </section>

      <section v-reveal class="home-about" aria-labelledby="home-about-title">
        <div><p class="section-eyebrow">A LITTLE ABOUT ME</p><h2 id="home-about-title">关于我</h2></div>
        <p>{{ profile.introduction }}</p>
        <a :href="withBase('/about')">认识我 <span aria-hidden="true">↗</span></a>
      </section>
    </main>
  </div>
</template>
