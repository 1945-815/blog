<script setup lang="ts">
import { computed } from 'vue'
import { useData, useRoute, withBase } from 'vitepress'
import { data as articles } from '../../../articles.data'
import { categoryTagHref, onCategoryTagLinkClick, topicForTag } from '../tags'

const { frontmatter } = useData()
const route = useRoute()
const isArticle = computed(() => /\/articles\/[^/]+(?:\.html)?$/.test(route.path) && !route.path.endsWith('/index.html'))
const tags = computed(() => Array.isArray(frontmatter.value.tags) ? frontmatter.value.tags : [])
const currentArticle = computed(() => articles.find((article) => route.path.replace(/\.html$/, '') === withBase(article.url).replace(/\/$/, '')))
function tagTopic(tag: string) {
  return topicForTag(articles, tag, currentArticle.value)
}
</script>

<template>
  <div v-if="isArticle" class="doc-article-meta">
    <a :href="withBase('/articles/')">文章归档</a><span aria-hidden="true">/</span><span>{{ frontmatter.phase }}</span>
    <div class="doc-article-tags"><a v-for="tag in tags" :key="tag" :href="withBase(categoryTagHref(tagTopic(tag), tag))" target="_self" @click="onCategoryTagLinkClick($event, tagTopic(tag), tag)">{{ tag }}</a></div>
  </div>
</template>
