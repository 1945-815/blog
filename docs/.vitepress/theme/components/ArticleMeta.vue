<script setup lang="ts">
import { computed } from 'vue'
import { useData, useRoute, withBase } from 'vitepress'

const { frontmatter } = useData()
const route = useRoute()
const isArticle = computed(() => /\/articles\/[^/]+(?:\.html)?$/.test(route.path) && !route.path.endsWith('/index.html'))
const tags = computed(() => Array.isArray(frontmatter.value.tags) ? frontmatter.value.tags : [])
</script>

<template>
  <div v-if="isArticle" class="doc-article-meta"><a :href="withBase('/articles/')">文章归档</a><span aria-hidden="true">/</span><span>{{ frontmatter.phase }}</span><div class="doc-article-tags"><span v-for="tag in tags" :key="tag">{{ tag }}</span></div></div>
</template>
