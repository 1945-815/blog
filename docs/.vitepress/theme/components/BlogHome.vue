<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { data as articles } from '../../../articles.data'
import { topics, topicArticles } from '../blog'
import Banner from './Banner.vue'
import ArticleCard from './ArticleCard.vue'
import ProfileCard from './ProfileCard.vue'
import CategoryCard from './CategoryCard.vue'

const latest = computed(() => [...articles].reverse().slice(0, 8))
</script>

<template>
  <div class="blog-home">
    <Banner />
    <div class="blog-shell">
      <div class="blog-main-grid">
        <main class="blog-feed" id="latest-articles">
          <div class="section-heading"><div><p class="section-eyebrow">RECENT WRITING</p><h2>近期文章</h2><p>从实际问题出发，整理可以复盘的技术笔记。</p></div><a :href="withBase('/articles/')">查看全部文章 ↗</a></div>
          <div class="article-list"><ArticleCard v-for="article in latest" :key="article.url" :article="article" /></div>
          <a class="all-articles-link" :href="withBase('/articles/')">浏览全部 {{ articles.length }} 篇文章 <span aria-hidden="true">→</span></a>
        </main>
        <ProfileCard :articles="articles" />
      </div>
      <section class="home-categories" aria-labelledby="category-title"><div class="section-heading"><div><p class="section-eyebrow">EXPLORE BY TOPIC</p><h2 id="category-title">按技术方向阅读</h2></div><a :href="withBase('/categories/')">全部分类 ↗</a></div><div class="category-grid"><CategoryCard v-for="topic in topics.slice(0, 6)" :key="topic.id" v-bind="topic" :count="topicArticles(articles, topic.id).length" /></div></section>
    </div>
  </div>
</template>
