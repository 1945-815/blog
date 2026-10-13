<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { data as articles } from '../../../articles.data'
import { topics, topicArticles } from '../blog'
import type { TopicId } from '../blog'
import ArticleCard from './ArticleCard.vue'
import ProfileCard from './ProfileCard.vue'

const props = defineProps<{ topic: TopicId }>()
const definition = computed(() => topics.find((item) => item.id === props.topic)!)
const posts = computed(() => topicArticles(articles, props.topic).reverse())
const subtopics = computed(() => {
  const groups: Partial<Record<TopicId, string[]>> = {
    java: ['Java 基础', 'JVM', '集合', '并发'],
    spring: ['Spring Boot', 'Spring Cloud', 'MyBatis'],
    microservices: ['Nacos', 'Gateway', 'OpenFeign', 'Sentinel'],
    database: ['MySQL', 'MyBatis', 'Canal'],
    middleware: ['Redis', 'RabbitMQ', 'Elasticsearch'],
    ai: ['RAG', 'Agent', 'LangChain']
  }
  return (groups[props.topic] || []).map((name) => ({ name, count: posts.value.filter((post) => [post.title, post.category, ...post.tags].join(' ').toLowerCase().includes(name.toLowerCase())).length }))
})
</script>

<template>
  <div class="blog-shell archive-page"><header class="archive-header"><a class="breadcrumb" :href="withBase('/categories/')">技术分类 /</a><p class="section-eyebrow">{{ definition.icon }} / TOPIC</p><h1>{{ definition.name }}</h1><p>{{ definition.description }} · {{ posts.length }} 篇已发布文章</p></header><div v-if="subtopics.length" class="subtopic-list"><span v-for="item in subtopics" :key="item.name">{{ item.name }} <b>{{ item.count }}</b></span></div><div class="blog-main-grid"><main class="blog-feed"><div v-if="posts.length" class="article-list"><ArticleCard v-for="article in posts" :key="article.url" :article="article" /></div><div v-else class="empty-card"><h2>这个方向还没有文章</h2><p>目前没有可公开的相关内容，后续学习与实践会逐步补充。</p><a :href="withBase('/articles/')">先读全部文章 →</a></div></main><ProfileCard :articles="articles" /></div></div>
</template>
