<script setup lang="ts">
import { data as articles } from '../../../articles.data'
import { topics, topicArticles } from '../blog'
import CategoryCard from './CategoryCard.vue'
</script>

<template>
  <div class="blog-shell taxonomy-page"><header class="archive-header"><p class="section-eyebrow">TOPICS</p><h1>技术分类</h1><p>按技术栈寻找文章。一个主题可能同时属于多个方向，数量来自现有文章。</p></header><div class="category-grid"><CategoryCard v-for="topic in topics" :key="topic.id" v-bind="topic" :count="topicArticles(articles, topic.id).length" /></div><div class="taxonomy-note"><strong>成长主线</strong><p>Java 基础 → Spring 与数据库 → 微服务和中间件 → 企业业务实践 → AI 应用探索</p></div></div>
</template>
