<script setup lang="ts">
import { withBase } from 'vitepress'
import type { BlogArticle } from '../../../articles.data'
import type { TopicId } from '../blog'
import { data as articles } from '../../../articles.data'
import { categoryTagHref, onCategoryTagLinkClick, topicForTag } from '../tags'

const props = defineProps<{ article: BlogArticle; topic?: TopicId }>()

function tagTopic(tag: string) {
  return props.topic || topicForTag(articles, tag, props.article)
}
</script>

<template>
  <article class="article-card">
    <div class="article-card-top"><span class="article-category">{{ article.category || article.phase }}</span><span class="article-phase">{{ article.phase }} · 路线节点 {{ article.planDate }}</span></div>
    <h3><a :href="withBase(article.url)">{{ article.title }}</a></h3>
    <p class="article-description">{{ article.description }}</p>
    <div class="article-tags"><a v-for="tag in article.tags.slice(0, 3)" :key="tag" :href="withBase(categoryTagHref(tagTopic(tag), tag))" target="_self" @click="onCategoryTagLinkClick($event, tagTopic(tag), tag)">{{ tag }}</a></div>
    <div class="article-card-bottom">
      <div class="article-byline"><span>Cyzee</span><span class="meta-dot">·</span><span>{{ article.readingMinutes }} 分钟阅读</span></div>
      <a class="read-more" :href="withBase(article.url)" :aria-label="`阅读全文：${article.title}`">阅读全文 <span aria-hidden="true">↗</span></a>
    </div>
  </article>
</template>
