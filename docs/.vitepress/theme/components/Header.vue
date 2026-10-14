<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { useRoute, withBase } from 'vitepress'
import { House, CodeXml, Network, Database, Bot, PanelsTopLeft, NotebookPen, UserRound, ChevronDown, BookOpen, Boxes, Braces } from 'lucide-vue-next'

type NavIcon = 'home' | 'code' | 'network' | 'database' | 'ai' | 'frontend' | 'notes' | 'about' | 'python' | 'peripheral' | 'help'
type NavLink = { label: string; href: string }
const props = defineProps<{ label: string; icon: NavIcon; href: string; links?: NavLink[]; screenMenu?: boolean }>()
const icons = { home: House, code: CodeXml, network: Network, database: Database, ai: Bot, frontend: PanelsTopLeft, notes: NotebookPen, about: UserRound, python: Braces, peripheral: Boxes, help: BookOpen }
const route = useRoute()
const closeScreen = inject<(() => void) | undefined>('close-screen', undefined)
const active = computed(() => route.path === withBase(props.href) || route.path === `${withBase(props.href)}.html`)
const mobileExpanded = ref(false)
const hovered = ref(false)

function onNavigate() {
  hovered.value = false
  if (props.screenMenu) closeScreen?.()
}

function onMenuClick(event: MouseEvent) {
  if (event.detail > 0) {
    const link = event.currentTarget as HTMLElement
    window.setTimeout(() => link.blur(), 0)
  }
  onNavigate()
}

</script>

<template>
  <div class="blog-nav-group" :class="{ 'in-screen-menu': screenMenu, 'is-open': hovered }" @mouseenter="hovered = true" @mouseleave="hovered = false">
    <div class="blog-nav-group-heading">
      <a class="blog-nav-item" :class="{ 'is-active': active, 'in-screen-menu': screenMenu }" :href="withBase(href)" :aria-current="active ? 'page' : undefined" @click="onNavigate">
        <component :is="icons[icon]" :size="16" :stroke-width="1.8" aria-hidden="true" />
        <span>{{ label }}</span>
        <ChevronDown v-if="links?.length && !screenMenu" :size="13" :stroke-width="1.8" class="nav-chevron" aria-hidden="true" />
      </a>
      <button v-if="screenMenu && links?.length" class="mobile-tag-toggle" type="button" :aria-label="`${label}子菜单`" :aria-expanded="mobileExpanded" @click="mobileExpanded = !mobileExpanded"><ChevronDown :size="16" aria-hidden="true" /></button>
    </div>
    <div v-if="links?.length && (!screenMenu || mobileExpanded)" class="nav-tag-dropdown" :class="{ 'mobile-tags': screenMenu }" :aria-label="`${label}子菜单`">
      <a v-for="link in links" :key="link.href" class="nav-tag-link" :href="withBase(link.href)" @click="onMenuClick"><span>{{ link.label }}</span></a>
    </div>
  </div>
</template>
