<script setup lang="ts">
import { withBase } from 'vitepress'
import type { BlogArticle } from '../../../articles.data'

defineProps<{ article: BlogArticle }>()
</script>

<template>
  <article class="article-card">
    <div class="article-card-top"><span class="article-category">{{ article.category || article.phase }}</span><span class="article-phase">{{ article.phase }} · 路线节点 {{ article.planDate }}</span></div>
    <h3><a :href="withBase(article.url)">{{ article.title }}</a></h3>
    <p class="article-description">{{ article.description }}</p>
    <div class="article-tags"><span v-for="tag in article.tags.slice(0, 3)" :key="tag">{{ tag }}</span></div>
    <div class="article-card-bottom">
      <div class="article-byline"><span>张耘璨</span><span class="meta-dot">·</span><time :datetime="article.date">{{ article.date }}</time><span class="meta-dot">·</span><span>{{ article.readingMinutes }} 分钟阅读</span></div>
      <a class="read-more" :href="withBase(article.url)" :aria-label="`阅读全文：${article.title}`">阅读全文 <span aria-hidden="true">↗</span></a>
    </div>
  </article>
</template>
