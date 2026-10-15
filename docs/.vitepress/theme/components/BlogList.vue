<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import { data as articles } from '../../../articles.data'
import { topics, topicArticles } from '../blog'
import type { TopicId } from '../blog'
import ArticleCard from './ArticleCard.vue'
import ProfileCard from './ProfileCard.vue'

const active = ref<TopicId | 'all'>('all')
const visible = computed(() => active.value === 'all' ? [...articles].reverse() : topicArticles(articles, active.value).reverse())
</script>

<template>
  <div class="blog-shell archive-page">
    <header class="archive-header"><p class="section-eyebrow">ALL ARTICLES</p><h1>文章归档</h1><p>共 {{ articles.length }} 篇，按学习路线参考日期编排。补充文章会在正文标注计划公开日期；计划日期不代表历史发文时间。</p></header>
    <div class="filter-row" aria-label="按技术方向筛选"><button :class="{ active: active === 'all' }" :aria-pressed="active === 'all'" @click="active = 'all'">全部 {{ articles.length }}</button><button v-for="topic in topics" :key="topic.id" :class="{ active: active === topic.id }" :aria-pressed="active === topic.id" @click="active = topic.id">{{ topic.name }} {{ topicArticles(articles, topic.id).length }}</button></div>
    <div class="blog-main-grid"><main class="blog-feed"><div v-if="visible.length" class="article-list"><ArticleCard v-for="article in visible" :key="article.url" :article="article" /></div><div v-else class="empty-card">这个方向还没有已发布的文章。<a :href="withBase('/roadmap')">查看成长路线 →</a></div></main><ProfileCard :articles="articles" /></div>
  </div>
</template>
