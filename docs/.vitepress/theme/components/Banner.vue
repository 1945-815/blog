<script setup lang="ts">
import { withBase } from 'vitepress'
import { ArrowDownRight, ArrowUpRight } from 'lucide-vue-next'
</script>

<template>
  <section class="home-hero" aria-labelledby="welcome-title">
    <div class="hero-inner blog-shell">
      <div class="hero-copy">
        <p class="hero-kicker"><span class="hero-kicker-mark" aria-hidden="true"></span>PERSONAL TECH JOURNAL</p>
        <h1 id="welcome-title">你好，这里是<br /><span>Cyzee 的技术角落。</span></h1>
        <p class="hero-description">记录 Java 后端开发、AI 应用探索与日常思考。</p>
        <div class="hero-actions">
          <a class="hero-action" :href="withBase('/articles/')">开始阅读 <ArrowUpRight :size="17" aria-hidden="true" /></a>
          <a class="hero-secondary" href="#home-categories">探索技术方向 <ArrowDownRight :size="16" aria-hidden="true" /></a>
        </div>
        <a class="hero-scroll" href="#home-categories"><span>向下阅读</span><ArrowDownRight :size="14" aria-hidden="true" /></a>
      </div>
      <figure class="hero-image-wrap">
        <picture>
          <source media="(max-width: 640px)" :srcset="withBase('/banner-water-mobile.jpg')" />
          <img
            class="hero-image"
            :src="withBase('/banner-water-desktop.jpg')"
            alt="晨光映在湖面，远处是层叠山影"
            width="1600"
            height="534"
            fetchpriority="high"
            decoding="async"
          />
        </picture>
        <figcaption><span>LEARNING, IN NOTES</span><span>01 — 记录与思考</span></figcaption>
      </figure>
    </div>
  </section>
</template>
