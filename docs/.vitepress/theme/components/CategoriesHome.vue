<script setup lang="ts">
import { data as articles } from '../../../articles.data'
import { topics, topicArticles } from '../blog'
import CategoryCard from './CategoryCard.vue'
</script>

<template>
  <div class="blog-shell taxonomy-page"><header class="archive-header"><p class="section-eyebrow">TOPICS</p><h1>技术分类</h1><p>按技术栈寻找文章。分类数量根据现有文章的标题、分类、标签与阶段信息统计。</p></header><div class="category-grid"><CategoryCard v-for="topic in topics.filter((item) => topicArticles(articles, item.id).length)" :key="topic.id" v-bind="topic" :count="topicArticles(articles, topic.id).length" /></div><div class="taxonomy-note"><strong>成长主线</strong><p>Java 核心 → 后端框架与数据库 → 微服务和中间件 → 工程实践与项目复盘 → AI 应用开发</p></div></div>
</template>
