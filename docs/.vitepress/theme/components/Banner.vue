<script setup lang="ts">
import { withBase } from 'vitepress'
</script>

<template>
  <section class="blog-banner" :style="{ backgroundImage: `url(${withBase('/banner-tech.svg')})` }">
    <div class="blog-banner-inner">
      <p class="banner-eyebrow">LEARNING ROADMAP · 2023—NOW</p>
      <h1>张耘璨</h1>
      <p class="banner-subtitle">Java 后端开发者 <span aria-hidden="true">/</span> AI应用探索者</p>
      <p class="banner-description">记录从Java基础到企业开发，再到RAG和Agent应用实践。</p>
      <div class="banner-learning"><span>正在学习</span><b>Spring Cloud</b><b>Redis</b><b>RabbitMQ</b><b>RAG</b><b>Agent</b></div>
    </div>
  </section>
</template>
