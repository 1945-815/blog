<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { Github, MapPin } from 'lucide-vue-next'
import type { BlogArticle } from '../../../articles.data'
import ContactCard from './ContactCard.vue'

const props = defineProps<{ articles: BlogArticle[] }>()
const selected = computed(() => {
  const slugs = ['redis-hot-document-cache', 'activiti7-approval-flow', 'rag-document-qa']
  return slugs.map((slug) => props.articles.find((article) => article.url.includes(slug))).filter((article): article is BlogArticle => Boolean(article))
})
</script>

<template>
  <aside class="blog-sidebar" aria-label="作者信息与精选文章">
    <section class="side-card profile-card">
      <div class="profile-cover" :style="{ backgroundImage: `url(${withBase('/profile-cover-sea.jpg')})` }"></div>
      <div class="profile-content">
        <img class="profile-avatar" :src="withBase('/avatar-patrick.jpg')" alt="派大星头像" width="80" height="80" />
        <h2>Cyzee</h2>
        <p class="profile-role">Java 后端开发者 · AI 应用探索者</p>
        <p class="profile-location"><MapPin :size="15" :stroke-width="1.8" aria-hidden="true" />中华人民共和国</p>
        <ContactCard />
        <p class="profile-about">写下可解释的技术选择，也记录学习与实践之间的距离。</p>
        <div class="profile-skills"><span v-for="skill in ['Java', 'Spring Boot', 'Spring Cloud', 'Redis', 'RabbitMQ', 'Elasticsearch', 'RAG']" :key="skill">{{ skill }}</span></div>
        <div class="profile-links"><a href="https://github.com/1945-815" target="_blank" rel="noopener noreferrer"><Github :size="15" :stroke-width="1.8" aria-hidden="true" />GitHub ↗</a></div>
      </div>
    </section>
    <section class="side-card featured-card">
      <div class="side-heading"><span class="side-heading-mark"></span><h2>精选文章</h2></div>
      <ol><li v-for="(article, index) in selected" :key="article.url"><span>{{ String(index + 1).padStart(2, '0') }}</span><a :href="withBase(article.url)">{{ article.title }}</a></li></ol>
    </section>
    <section class="side-card side-note"><span class="side-heading-mark"></span><h2>关于这个博客</h2><p>属于Cyzee的个人博客,仅供个人复盘</p><a :href="withBase('/roadmap')">查看成长路线 →</a></section>
  </aside>
</template>
