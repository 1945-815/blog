<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import { data as articles } from '../../../articles.data'
import { topics, topicArticles } from '../blog'
import { hasTag, selectedCategoryTag, setCategoryTag, tagCount, tagKey, topicTagOptions } from '../tags'
import type { TopicId } from '../blog'
import ArticleCard from './ArticleCard.vue'
import ProfileCard from './ProfileCard.vue'

const props = defineProps<{ topic: TopicId }>()
const definition = computed(() => topics.find((item) => item.id === props.topic)!)
const scopedPosts = computed(() => topicArticles(articles, props.topic))
const posts = computed(() => [...scopedPosts.value].reverse())
const selectedTag = ref('')
const subtopics = computed(() => {
  const options = topicTagOptions(articles, props.topic)
  if (selectedTag.value && !options.some((item) => tagKey(item.name) === tagKey(selectedTag.value))) {
    options.push({ name: selectedTag.value, count: tagCount(scopedPosts.value, selectedTag.value) })
  }
  return options.map((item) => ({ ...item, count: tagCount(scopedPosts.value, item.name) }))
})
const visiblePosts = computed(() => selectedTag.value
  ? posts.value.filter((article) => hasTag(article, selectedTag.value))
  : posts.value)

function syncFromUrl() {
  selectedTag.value = selectedCategoryTag()
}

function selectTag(name: string) {
  setCategoryTag(props.topic, tagKey(selectedTag.value) === tagKey(name) ? undefined : name)
}

onMounted(() => {
  syncFromUrl()
  window.addEventListener('popstate', syncFromUrl)
  window.addEventListener('blog-category-tag-change', syncFromUrl)
})
onUnmounted(() => {
  window.removeEventListener('popstate', syncFromUrl)
  window.removeEventListener('blog-category-tag-change', syncFromUrl)
})
watch(() => props.topic, syncFromUrl)
</script>

<template>
  <div class="blog-shell archive-page">
    <header class="archive-header">
      <a class="breadcrumb" :href="withBase('/categories/')">技术分类 /</a>
      <p class="section-eyebrow">{{ definition.icon }} / TOPIC</p>
      <h1>{{ definition.name }}</h1>
      <p>{{ definition.description }} · {{ posts.length }} 篇已发布文章</p>
    </header>
    <div v-if="subtopics.length" class="subtopic-list" aria-label="相关标签">
      <button v-for="item in subtopics" :key="item.name" type="button" :class="{ active: tagKey(selectedTag) === tagKey(item.name) }" :aria-pressed="tagKey(selectedTag) === tagKey(item.name)" @click="selectTag(item.name)">
        {{ item.name }} <span v-if="tagKey(selectedTag) === tagKey(item.name)" aria-hidden="true">✓</span> <b>{{ item.count }}</b>
      </button>
    </div>
    <p v-if="selectedTag" class="category-filter-status" role="status">标签「{{ selectedTag }}」· {{ visiblePosts.length }} 篇文章 <button type="button" @click="setCategoryTag(topic)">清除筛选</button></p>
    <div class="blog-main-grid">
      <main class="blog-feed">
        <div v-if="visiblePosts.length" class="article-list"><ArticleCard v-for="article in visiblePosts" :key="article.url" :article="article" :topic="topic" /></div>
        <div v-else class="empty-card">
          <h2>{{ selectedTag ? '这个标签还没有文章' : '这个方向还没有文章' }}</h2>
          <p>目前没有可公开的相关内容，后续学习与实践会逐步补充。</p>
          <button v-if="selectedTag" type="button" class="clear-tags" @click="setCategoryTag(topic)">清除筛选 →</button>
          <a v-else :href="withBase('/articles/')">先读全部文章 →</a>
        </div>
      </main>
      <ProfileCard :articles="articles" />
    </div>
  </div>
</template>
