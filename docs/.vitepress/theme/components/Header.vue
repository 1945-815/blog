<script setup lang="ts">
import { computed, inject } from 'vue'
import { useRoute, withBase } from 'vitepress'
import { House, CodeXml, Network, Database, Bot, PanelsTopLeft, NotebookPen, UserRound } from 'lucide-vue-next'

type NavIcon = 'home' | 'code' | 'network' | 'database' | 'ai' | 'frontend' | 'notes' | 'about'
const props = defineProps<{ label: string; icon: NavIcon; href: string; screenMenu?: boolean }>()
const icons = { home: House, code: CodeXml, network: Network, database: Database, ai: Bot, frontend: PanelsTopLeft, notes: NotebookPen, about: UserRound }
const route = useRoute()
const closeScreen = inject<(() => void) | undefined>('close-screen', undefined)
const active = computed(() => route.path === withBase(props.href) || route.path === `${withBase(props.href)}.html`)

function onNavigate() {
  if (props.screenMenu) closeScreen?.()
}
</script>

<template>
  <a class="blog-nav-item" :class="{ 'is-active': active, 'in-screen-menu': screenMenu }" :href="withBase(href)" :aria-current="active ? 'page' : undefined" @click="onNavigate">
    <component :is="icons[icon]" :size="16" :stroke-width="1.8" aria-hidden="true" />
    <span>{{ label }}</span>
  </a>
</template>
