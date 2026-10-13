<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import type { BlogArticle } from '../../../articles.data'

const props = defineProps<{ articles: BlogArticle[] }>()
const selected = computed(() => {
  const slugs = ['redis-hot-document-cache', 'activiti7-approval-flow', 'rag-document-qa', 'document-retrieval-platform-redacted']
  return slugs.map((slug) => props.articles.find((article) => article.url.includes(slug))).filter((article): article is BlogArticle => Boolean(article))
})
</script>

<template>
  <aside class="blog-sidebar" aria-label="作者信息与精选文章">
    <section class="side-card profile-card">
      <div class="profile-cover" :style="{ backgroundImage: `url(${withBase('/banner-tech.svg')})` }"></div>
      <div class="profile-content">
        <img class="profile-avatar" :src="withBase('/avatar-monogram.svg')" alt="张耘璨的文字头像" width="80" height="80" />
        <h2>张耘璨</h2>
        <p class="profile-role">Java 后端开发者 · AI 应用探索者</p>
        <p class="profile-location">⌖ 中国</p>
        <p class="profile-about">写下可解释的技术选择，也记录学习与实践之间的距离。</p>
        <div class="profile-skills"><span v-for="skill in ['Java', 'Spring Boot', 'Spring Cloud', 'Redis', 'RabbitMQ', 'Elasticsearch', 'RAG']" :key="skill">{{ skill }}</span></div>
        <div class="profile-links"><a href="https://github.com/1945-815" target="_blank" rel="noopener noreferrer">GitHub ↗</a><span title="个人主页链接待补充">掘金 · 待添加</span><span title="个人主页链接待补充">CSDN · 待添加</span></div>
      </div>
    </section>
    <section class="side-card featured-card">
      <div class="side-heading"><span class="side-heading-mark"></span><h2>精选文章</h2></div>
      <ol><li v-for="(article, index) in selected" :key="article.url"><span>{{ String(index + 1).padStart(2, '0') }}</span><a :href="withBase(article.url)">{{ article.title }}</a></li></ol>
    </section>
    <section class="side-card side-note"><span class="side-heading-mark"></span><h2>关于这个博客</h2><p>文章按成长阶段编排，页面显示真实公开日期。学习阶段参考日期仅用于说明顺序。</p><a :href="withBase('/roadmap')">查看成长路线 →</a></section>
  </aside>
</template>
