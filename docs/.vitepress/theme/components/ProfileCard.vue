<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import type { BlogArticle } from '../../../articles.data'
import ContactCard from './ContactCard.vue'
import { profile } from '../data/profile'

const props = defineProps<{ articles: BlogArticle[] }>()
const selected = computed(() => {
  const slugs = ['redis-hot-document-cache', 'activiti7-approval-flow', 'rag-document-qa']
  return slugs.map((slug) => props.articles.find((article) => article.url.includes(slug))).filter((article): article is BlogArticle => Boolean(article))
})
</script>

<template>
  <aside v-reveal class="blog-sidebar" aria-label="作者信息与精选文章">
    <section class="side-card profile-card">
      <div class="profile-cover" :style="{ backgroundImage: `url(${withBase('/profile-cover-sea.jpg')})` }"></div>
      <div class="profile-content">
        <img class="profile-avatar" :src="withBase('/avatar-monogram.svg')" alt="张耘璨的文字头像" width="80" height="80" loading="lazy" />
        <h2>{{ profile.name }}</h2>
        <p class="profile-role">{{ profile.nickname }} · {{ profile.headline }}</p>
        <p class="profile-location">{{ profile.education.school }} · {{ profile.education.major }}</p>
        <ContactCard />
        <p class="profile-about">{{ profile.introduction }}</p>
        <div class="profile-skills"><span v-for="skill in ['Java', 'Spring Boot', 'MySQL', 'Redis', 'RabbitMQ', 'Elasticsearch', 'RAG']" :key="skill">{{ skill }}</span></div>
      </div>
    </section>
    <section class="side-card featured-card">
      <div class="side-heading"><span class="side-heading-mark"></span><h2>精选文章</h2></div>
      <ol><li v-for="(article, index) in selected" :key="article.url"><span>{{ String(index + 1).padStart(2, '0') }}</span><a :href="withBase(article.url)">{{ article.title }}</a></li></ol>
    </section>
    <section class="side-card side-note"><span class="side-heading-mark"></span><h2>关于这个博客</h2><p>记录工程实践、项目复盘与 AI 应用探索。</p><a :href="withBase('/about')">关于我 →</a></section>
  </aside>
</template>
