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
      <p class="hero-kicker">CYZEE <span aria-hidden="true">/</span> 2027 届 · 求职展示</p>
      <h1 id="welcome-title">张耘璨<span class="hero-punctuation">。</span></h1>
      <p class="hero-lead">Java 后端开发 · AI 应用探索</p>
      <p class="hero-description">九个月企业 Java 后端实习经历，参与接口开发、功能联调与问题定位。<br class="hero-desktop-break" />记录工程实践，也分享正在探索的 AI 应用。</p>
      <a class="hero-action" href="#career-title">了解我的经历 <ArrowUpRight :size="19" :stroke-width="1.8" aria-hidden="true" /></a>
    </div>
    <a class="hero-scroll" href="#career-title" aria-label="向下滚动，浏览个人经历">
      <span>SCROLL TO EXPLORE</span>
      <ArrowDown :size="17" :stroke-width="1.7" aria-hidden="true" />
    </a>
    <span class="hero-edge-note" aria-hidden="true">上善若水 · 持续记录</span>
  </section>
</template>
