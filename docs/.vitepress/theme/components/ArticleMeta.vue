<script setup lang="ts">
import { computed } from 'vue'
import { useData, useRoute, withBase } from 'vitepress'
import { data as articles } from '../../../articles.data'
import { categoryTagHref, onCategoryTagLinkClick, topicForTag } from '../tags'

const { frontmatter } = useData()
const route = useRoute()
const isArticle = computed(() => /\/articles\/[^/]+(?:\.html)?$/.test(route.path) && !route.path.endsWith('/index.html'))
const tags = computed(() => Array.isArray(frontmatter.value.tags) ? frontmatter.value.tags : [])
const recordDate = computed(() => frontmatter.value.date ? String(frontmatter.value.date).slice(0, 10) : '')
const planDate = computed(() => frontmatter.value.plan_date ? String(frontmatter.value.plan_date).slice(0, 10) : '')
const currentArticle = computed(() => articles.find((article) => route.path.replace(/\.html$/, '') === withBase(article.url).replace(/\/$/, '')))
function tagTopic(tag: string) {
  return topicForTag(articles, tag, currentArticle.value)
}
</script>

<template>
  <div v-if="isArticle" class="doc-article-meta">
    <a :href="withBase('/articles/')">文章归档</a><span aria-hidden="true">/</span><span>{{ frontmatter.phase }}</span>
    <span v-if="recordDate" class="doc-date-label" :title="'保留此文 frontmatter date 字段的原始含义'">文章 date · {{ recordDate }}</span>
    <span v-if="planDate" class="doc-date-label" :title="'阶段参考或内容规划日期，不代表真实公开发布日期'">阶段参考 · {{ planDate }}</span>
    <div class="doc-article-tags"><a v-for="tag in tags" :key="tag" :href="withBase(categoryTagHref(tagTopic(tag), tag))" target="_self" @click="onCategoryTagLinkClick($event, tagTopic(tag), tag)">{{ tag }}</a></div>
  </div>
</template>
