<script setup lang="ts">
import { withBase } from 'vitepress'
import { topicHref } from '../blog'
import type { TopicId } from '../blog'

defineProps<{ id: TopicId; name: string; description: string; icon: string; count: number }>()
</script>

<template>
  <a class="category-card" :href="withBase(topicHref(id))">
    <span class="category-card-icon">{{ icon }}</span>
    <span class="category-card-text"><strong>{{ name }}</strong><small>{{ description }}</small></span>
    <span class="category-card-count">{{ count }} 篇 <span aria-hidden="true">↗</span></span>
  </a>
</template>
