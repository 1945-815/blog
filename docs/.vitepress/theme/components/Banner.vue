<script setup lang="ts">
import { withBase } from 'vitepress'
import { ArrowDown, ArrowUpRight } from 'lucide-vue-next'
</script>

<template>
  <section class="blog-banner" aria-labelledby="welcome-title">
    <img
      class="blog-banner-image"
      :src="withBase('/banner-water.jpg')"
      alt="晨光下的远山与湖面"
      width="2172"
      height="724"
      fetchpriority="high"
    />
    <div class="blog-banner-inner">
      <p class="hero-kicker">CYZEE <span aria-hidden="true">/</span> 技术笔记</p>
      <h1 id="welcome-title">你好<span class="hero-punctuation">！</span></h1>
      <p class="hero-lead">欢迎来到我的技术博客</p>
      <p class="hero-description">记录 Java 后端开发、AI 应用探索与个人成长。<br class="hero-desktop-break" />从一篇篇实践笔记出发，继续向前。</p>
      <a class="hero-action" href="#latest-articles">探索博客 <ArrowUpRight :size="19" :stroke-width="1.8" aria-hidden="true" /></a>
    </div>
    <a class="hero-scroll" href="#latest-articles" aria-label="向下滚动，浏览博客文章">
      <span>SCROLL TO EXPLORE</span>
      <ArrowDown :size="17" :stroke-width="1.7" aria-hidden="true" />
    </a>
    <span class="hero-edge-note" aria-hidden="true">上善若水 · 持续记录</span>
  </section>
</template>
