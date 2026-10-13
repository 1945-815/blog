<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { useRoute, withBase } from 'vitepress'
import { House, CodeXml, Network, Database, Bot, PanelsTopLeft, NotebookPen, UserRound, ChevronDown } from 'lucide-vue-next'
import { data as articles } from '../../../articles.data'
import { categoryTagHref, onCategoryTagLinkClick, topicTagOptions } from '../tags'
import type { TopicId } from '../blog'

type NavIcon = 'home' | 'code' | 'network' | 'database' | 'ai' | 'frontend' | 'notes' | 'about'
const props = defineProps<{ label: string; icon: NavIcon; href: string; topic?: TopicId; screenMenu?: boolean }>()
const icons = { home: House, code: CodeXml, network: Network, database: Database, ai: Bot, frontend: PanelsTopLeft, notes: NotebookPen, about: UserRound }
const route = useRoute()
const closeScreen = inject<(() => void) | undefined>('close-screen', undefined)
const active = computed(() => route.path === withBase(props.href) || route.path === `${withBase(props.href)}.html`)
const menuTags = computed(() => props.topic ? topicTagOptions(articles, props.topic, true) : [])
const mobileExpanded = ref(false)
const hovered = ref(false)

function onNavigate() {
  if (props.screenMenu) closeScreen?.()
}

function onTagClick(event: MouseEvent, name: string) {
  if (props.topic) onCategoryTagLinkClick(event, props.topic, name)
  if (event.detail > 0) {
    const link = event.currentTarget as HTMLElement
    window.setTimeout(() => link.blur(), 0)
  }
  hovered.value = false
  if (props.screenMenu) closeScreen?.()
}
</script>

<template>
  <div class="blog-nav-group" :class="{ 'in-screen-menu': screenMenu, 'is-open': hovered }" @mouseenter="hovered = true" @mouseleave="hovered = false">
    <div class="blog-nav-group-heading">
      <a class="blog-nav-item" :class="{ 'is-active': active, 'in-screen-menu': screenMenu }" :href="withBase(href)" :aria-current="active ? 'page' : undefined" @click="onNavigate">
        <component :is="icons[icon]" :size="16" :stroke-width="1.8" aria-hidden="true" />
        <span>{{ label }}</span>
        <ChevronDown v-if="menuTags.length && !screenMenu" :size="13" :stroke-width="1.8" class="nav-chevron" aria-hidden="true" />
      </a>
      <button v-if="screenMenu && menuTags.length" class="mobile-tag-toggle" type="button" :aria-label="`${label}标签`" :aria-expanded="mobileExpanded" @click="mobileExpanded = !mobileExpanded"><ChevronDown :size="16" aria-hidden="true" /></button>
    </div>
    <div v-if="menuTags.length && (!screenMenu || mobileExpanded)" class="nav-tag-dropdown" :class="{ 'mobile-tags': screenMenu }" :aria-label="`${label}相关标签`">
      <a v-for="tag in menuTags" :key="tag.name" class="nav-tag-link" :href="withBase(categoryTagHref(topic!, tag.name))" target="_self" @click="onTagClick($event, tag.name)"><span>{{ tag.name }}</span><small>{{ tag.count }}</small></a>
    </div>
  </div>
</template>
