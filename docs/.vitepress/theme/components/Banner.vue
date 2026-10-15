<script setup lang="ts">
import { withBase } from 'vitepress'
</script>

<template>
  <section class="blog-banner" :style="{ backgroundImage: `url(${withBase('/banner-water.jpg')})` }">
    <div class="blog-banner-inner">
      <h1>上善若水</h1>
      <span class="blog-banner-cursor" aria-hidden="true"></span>
    </div>
  </section>
</template>
