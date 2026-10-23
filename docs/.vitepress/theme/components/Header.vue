<script setup lang="ts">
import { computed, defineComponent, h, inject, ref, type VNode } from 'vue'
import { useRoute, withBase } from 'vitepress'
import { House, Network, NotebookPen, UserRound, ChevronDown, BookOpen, Send } from 'lucide-vue-next'
import type { ContactId } from '../data/contacts'
import { isMobileDevice, openAppWithFallback } from '../utils/contactActions'
import BrandIcon from './BrandIcon.vue'

type NavIcon = 'home' | 'code' | 'network' | 'database' | 'ai' | 'frontend' | 'notes' | 'about' | 'python' | 'peripheral' | 'help' | 'contact'
type NavLink = { label: string; href?: string; appHref?: string; icon?: ContactId; external?: boolean; hint?: string }
const props = defineProps<{ label: string; icon: NavIcon; href: string; links?: NavLink[]; screenMenu?: boolean; align?: 'start' | 'end' }>()

function createNavIcon(name: string, draw: (strokeWidth: number) => VNode[]) {
  return defineComponent({
    name: name + 'NavigationIcon',
    inheritAttrs: false,
    props: {
      size: { type: Number, default: 16 },
      strokeWidth: { type: Number, default: 1.8 }
    },
    setup(iconProps, { attrs }) {
      return () => h('svg', {
        ...attrs,
        class: ['blog-nav-icon', 'blog-nav-icon--' + name, attrs.class],
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 24 24',
        width: iconProps.size,
        height: iconProps.size,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: iconProps.strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        focusable: 'false'
      }, draw(iconProps.strokeWidth))
    }
  })
}

const JavaNavIcon = createNavIcon('java', () => [
  h('path', { d: 'M9 7c-1.5-1.7.8-2.4 0-4', stroke: '#bd5638', strokeWidth: 1.6 }),
  h('path', { d: 'M13 7c-1.5-1.7.8-2.4 0-4', stroke: '#bd5638', strokeWidth: 1.6 }),
  h('path', { d: 'M17 7c-1.5-1.7.8-2.4 0-4', stroke: '#bd5638', strokeWidth: 1.6 }),
  h('path', { d: 'M4 10h14v4.3a5.7 5.7 0 0 1-5.7 5.7H9.7A5.7 5.7 0 0 1 4 14.3V10Z', fill: '#f7e6d9', stroke: '#a34a35' }),
  h('path', { d: 'M18 11.5h1.2a2.3 2.3 0 0 1 0 4.6H18', stroke: '#a34a35' }),
  h('path', { d: 'M7 22h12', stroke: '#a34a35' })
])

const PythonNavIcon = createNavIcon('python', () => [
  h('path', { d: 'M12 2.5c-4.4 0-4.7 2-4.7 4.3v2.6h8.1v1.4H5.2c-2.2 0-3.2 1.4-3.2 3.8V16c0 2.6 1.3 4 4 4h2.2v-3.2c0-2.3 1.5-3.9 4-3.9h3c2.4 0 3.8-1.4 3.8-3.7V6.5c0-2.5-1.8-4-7-4Z', fill: '#3776ab', stroke: 'none' }),
  h('path', { d: 'M12 21.5c4.4 0 4.7-2 4.7-4.3v-2.6H8.6v-1.4h10.2c2.2 0 3.2-1.4 3.2-3.8V8c0-2.6-1.3-4-4-4h-2.2v3.2c0 2.3-1.5 3.9-4 3.9h-3c-2.4 0-3.8 1.4-3.8 3.7v2.7c0 2.5 1.8 4 7 4Z', fill: '#ffd343', stroke: 'none' }),
  h('circle', { cx: 10, cy: 6.3, r: 0.8, fill: '#fff', stroke: 'none' }),
  h('circle', { cx: 14, cy: 17.7, r: 0.8, fill: '#fff', stroke: 'none' })
])

const FrontendNavIcon = createNavIcon('frontend', () => [
  h('path', { d: 'M12 1.8 21 5v7.2c0 4.9-3.6 8.1-9 10-5.4-1.9-9-5.1-9-10V5l9-3.2Z', fill: '#f5df62', stroke: '#9a7825', strokeWidth: 1.3 }),
  h('text', { x: 12, y: 15.3, textAnchor: 'middle', fontSize: 8, fontFamily: 'Arial, sans-serif', fontWeight: 800, fill: '#25313b', stroke: 'none' }, 'JS')
])

const DatabaseNavIcon = createNavIcon('database', () => [
  h('ellipse', { cx: 12, cy: 5.5, rx: 8, ry: 2.7 }),
  h('path', { d: 'M4 5.5v13c0 1.5 3.6 2.7 8 2.7s8-1.2 8-2.7v-13' }),
  h('path', { d: 'M4 11.5c0 1.5 3.6 2.7 8 2.7s8-1.2 8-2.7' }),
  h('path', { d: 'M4 16.5c0 1.5 3.6 2.7 8 2.7s8-1.2 8-2.7' })
])

const AiNavIcon = createNavIcon('ai', () => [
  h('path', { d: 'M8 2v2M12 2v2M16 2v2M8 20v2M12 20v2M16 20v2M2 8h2M2 12h2M2 16h2M20 8h2M20 12h2M20 16h2' }),
  h('rect', { x: 4.5, y: 4.5, width: 15, height: 15, rx: 2.5, fill: '#edf1f6', stroke: '#526579' }),
  h('text', { x: 12, y: 14.8, textAnchor: 'middle', fontSize: 7.5, fontFamily: 'Arial, sans-serif', fontWeight: 800, fill: '#314658', stroke: 'none' }, 'AI')
])

const PeripheralNavIcon = createNavIcon('peripheral', () => [
  h('rect', { x: 2.5, y: 4, width: 14.2, height: 11.5, rx: 1.4 }),
  h('path', { d: 'M7.3 20h4.7m-2.35-4.5V20' }),
  h('rect', { x: 18, y: 7.5, width: 4, height: 11.5, rx: 1.1 }),
  h('path', { d: 'M19.2 16.7h1.6' })
])

const icons = {
  home: House,
  code: JavaNavIcon,
  network: Network,
  database: DatabaseNavIcon,
  ai: AiNavIcon,
  frontend: FrontendNavIcon,
  notes: NotebookPen,
  about: UserRound,
  python: PythonNavIcon,
  peripheral: PeripheralNavIcon,
  help: BookOpen,
  contact: Send
}
const route = useRoute()
const closeScreen = inject<(() => void) | undefined>('close-screen', undefined)
function isLinkActive(href: string) {
  if (/^https?:\/\//.test(href)) return false
  const path = withBase(href.split(/[?#]/)[0]).replace(/\/$/, '') || '/'
  const currentPath = route.path.replace(/\/$/, '') || '/'
  return currentPath === path || currentPath === `${path}.html`
}

function linkHref(href: string) {
  return /^https?:\/\//.test(href) ? href : withBase(href)
}

function onContactLinkClick(event: MouseEvent, link: NavLink) {
  if (!link.appHref || !link.href || !isMobileDevice()) return
  event.preventDefault()
  openAppWithFallback(link.appHref, link.href)
}

const active = computed(() => isLinkActive(props.href))
const mobileExpanded = ref(false)
const hovered = ref(false)
const focused = ref(false)
const menuOpen = computed(() => hovered.value || focused.value)

function onNavigate() {
  hovered.value = false
  focused.value = false
  if (props.screenMenu) closeScreen?.()
}

function onFocusOut(event: FocusEvent) {
  const group = event.currentTarget as HTMLElement
  if (!(event.relatedTarget instanceof Node && group.contains(event.relatedTarget))) focused.value = false
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
  <div class="blog-nav-group" :class="{ 'in-screen-menu': screenMenu, 'is-open': menuOpen, 'align-end': align === 'end' }" @mouseenter="hovered = true" @mouseleave="hovered = false" @focusin="focused = true" @focusout="onFocusOut">
    <div class="blog-nav-group-heading">
      <a class="blog-nav-item" :class="{ 'is-active': active, 'in-screen-menu': screenMenu }" :href="withBase(href)" :aria-current="active ? 'page' : undefined" :aria-haspopup="links?.length && !screenMenu ? 'true' : undefined" :aria-expanded="links?.length && !screenMenu ? menuOpen : undefined" @click="onNavigate">
        <component :is="icons[icon]" :size="16" :stroke-width="1.8" aria-hidden="true" />
        <span>{{ label }}</span>
        <ChevronDown v-if="links?.length && !screenMenu" :size="13" :stroke-width="1.8" class="nav-chevron" aria-hidden="true" />
      </a>
      <button v-if="screenMenu && links?.length" class="mobile-tag-toggle" type="button" :aria-label="label + '子菜单'" :aria-expanded="mobileExpanded" @click="mobileExpanded = !mobileExpanded"><ChevronDown :size="16" aria-hidden="true" /></button>
    </div>
    <div v-if="links?.length && (!screenMenu || mobileExpanded)" class="nav-tag-dropdown" :class="{ 'mobile-tags': screenMenu, 'nav-tag-dropdown--end': align === 'end' }" :aria-label="label + '子菜单'">
      <template v-for="link in links" :key="link.label">
        <a v-if="link.href" class="nav-tag-link" :class="{ 'is-current': isLinkActive(link.href) }" :href="linkHref(link.href)" :aria-current="isLinkActive(link.href) ? 'page' : undefined" @click="onContactLinkClick($event, link); onMenuClick($event)">
          <BrandIcon v-if="link.icon" :name="link.icon" :size="16" />
          <span>{{ link.label }}</span>
          <small v-if="link.external" class="nav-external-mark" aria-hidden="true">↗</small>
        </a>
        <span v-else class="nav-tag-link" :class="link.hint ? 'is-contact-info' : 'is-unavailable'" :aria-disabled="link.hint ? undefined : 'true'" :title="link.hint">
          <BrandIcon v-if="link.icon" :name="link.icon" :size="16" />
          <span>{{ link.label }}</span>
          <small>{{ link.hint || '地址待补充' }}</small>
        </span>
      </template>
    </div>
  </div>
</template>
