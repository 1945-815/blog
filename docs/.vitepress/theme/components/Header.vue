<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { useRoute, withBase } from 'vitepress'

type NavLink = { label: string; href: string }
const props = defineProps<{
  label: string
  href: string
  links?: NavLink[]
  screenMenu?: boolean
  align?: 'start' | 'end'
}>()

const route = useRoute()
const closeScreen = inject<(() => void) | undefined>('close-screen', undefined)
const mobileExpanded = ref(false)
const hovered = ref(false)
const focused = ref(false)
const menuOpen = computed(() => hovered.value || focused.value)
const menuId = computed(() => `nav-menu-${props.screenMenu ? 'mobile' : 'desktop'}-${props.href.replace(/[^a-z0-9]+/gi, '-') || 'home'}`)

function normalizedPath(path: string) {
  return path.replace(/\.html$/, '').replace(/\/$/, '') || '/'
}

function isLinkActive(href: string) {
  if (/^https?:\/\//.test(href)) return false
  const target = normalizedPath(withBase(href.split(/[?#]/)[0]))
  const current = normalizedPath(route.path)
  if (href === '/') return current === normalizedPath(withBase('/'))
  return current === target || current.startsWith(`${target}/`)
}

function linkHref(href: string) {
  return /^https?:\/\//.test(href) ? href : withBase(href)
}

function onNavigate() {
  hovered.value = false
  focused.value = false
  mobileExpanded.value = false
  if (props.screenMenu) closeScreen?.()
}

function onFocusOut(event: FocusEvent) {
  const group = event.currentTarget as HTMLElement
  if (!(event.relatedTarget instanceof Node && group.contains(event.relatedTarget))) focused.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  hovered.value = false
  focused.value = false
  mobileExpanded.value = false
}
</script>

<template>
  <div
    class="blog-nav-group"
    :class="{ 'in-screen-menu': screenMenu, 'is-open': menuOpen, 'align-end': align === 'end' }"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @focusin="focused = true"
    @focusout="onFocusOut"
    @keydown="onKeydown"
  >
    <div class="blog-nav-group-heading">
      <a
        class="blog-nav-item"
        :class="{ 'is-active': isLinkActive(href), 'in-screen-menu': screenMenu }"
        :href="withBase(href)"
        :aria-current="isLinkActive(href) ? 'page' : undefined"
        :aria-haspopup="links?.length ? 'true' : undefined"
        :aria-expanded="links?.length && !screenMenu ? menuOpen : undefined"
        :aria-controls="links?.length ? menuId : undefined"
        @click="onNavigate"
      >
        <span>{{ label }}</span>
        <span v-if="links?.length && !screenMenu" class="nav-chevron" aria-hidden="true">⌄</span>
      </a>
      <button
        v-if="screenMenu && links?.length"
        class="mobile-tag-toggle"
        type="button"
        :aria-label="`${label}子菜单`"
        :aria-expanded="mobileExpanded"
        :aria-controls="menuId"
        @click="mobileExpanded = !mobileExpanded"
      >
        <span aria-hidden="true">⌄</span>
      </button>
    </div>
    <div
      v-if="links?.length && (!screenMenu || mobileExpanded)"
      :id="menuId"
      class="nav-tag-dropdown"
      :class="{ 'mobile-tags': screenMenu, 'nav-tag-dropdown--end': align === 'end' }"
      :aria-label="`${label}子菜单`"
    >
      <a
        v-for="link in links"
        :key="link.label"
        class="nav-tag-link"
        :class="{ 'is-current': isLinkActive(link.href) }"
        :href="linkHref(link.href)"
        :aria-current="isLinkActive(link.href) ? 'page' : undefined"
        @click="onNavigate"
      >{{ link.label }}<span aria-hidden="true">↗</span></a>
    </div>
  </div>
</template>
