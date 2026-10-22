<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, withBase } from 'vitepress'
import { data as articles } from '../../../articles.data'
import { belongsTo, topics } from '../blog'

const route = useRoute()
const currentPath = computed(() => route.path.replace(/\.html$/, '').replace(/\/$/, ''))
const current = computed(() => articles.find((article) => withBase(article.url).replace(/\.html$/, '').replace(/\/$/, '') === currentPath.value))
const related = computed(() => {
  if (!current.value) return []
  return articles
    .filter((article) => article.url !== current.value?.url)
    .map((article) => {
      const sharedTags = current.value!.tags.filter((tag) => article.tags.some((item) => item.toLocaleLowerCase() === tag.toLocaleLowerCase())).length
      const sameCategory = article.category && article.category === current.value!.category
      const sharedTopics = topics.filter((topic) => belongsTo(article, topic.id) && belongsTo(current.value!, topic.id)).length
      return { article, score: sharedTags * 3 + (sameCategory ? 2 : 0) + sharedTopics }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.article.planDate.localeCompare(a.article.planDate))
    .slice(0, 3)
    .map((item) => item.article)
})
</script>

<template>
  <section v-if="current && related.length" class="article-relations" aria-labelledby="related-title">
    <p class="section-eyebrow">KEEP READING</p>
    <h2 id="related-title">相关文章</h2>
    <ul><li v-for="article in related" :key="article.url"><a :href="withBase(article.url)">{{ article.title }}</a><span>{{ article.category || article.phase }}</span></li></ul>
  </section>
</template>
