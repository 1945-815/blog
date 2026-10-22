import { defineAsyncComponent, h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import Header from './components/Header.vue'
import BrandMark from './components/BrandMark.vue'
import Banner from './components/Banner.vue'
import ArticleCard from './components/ArticleCard.vue'
import ProfileCard from './components/ProfileCard.vue'
import CategoryCard from './components/CategoryCard.vue'
import BlogHome from './components/BlogHome.vue'
import BlogList from './components/BlogList.vue'
import CategoriesHome from './components/CategoriesHome.vue'
import BlogCategory from './components/BlogCategory.vue'
import ArticleMeta from './components/ArticleMeta.vue'
import TagSearch from './components/TagSearch.vue'
import ReadingTools from './components/ReadingTools.vue'
import ArticleRelations from './components/ArticleRelations.vue'
import ContactCard from './components/ContactCard.vue'
import './custom.css'

const MusicPlayer = defineAsyncComponent(() => import('./components/MusicPlayer.vue'))
const ArticleImageLightbox = defineAsyncComponent(() => import('./components/ArticleImageLightbox.vue'))
const AlbumPage = defineAsyncComponent(() => import('./components/AlbumPage.vue'))
const FriendsPage = defineAsyncComponent(() => import('./components/FriendsPage.vue'))
const MomentsPage = defineAsyncComponent(() => import('./components/MomentsPage.vue'))
const MusicPage = defineAsyncComponent(() => import('./components/MusicPage.vue'))

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {
    'nav-bar-title-before': () => h(BrandMark),
    'doc-before': () => h(ArticleMeta),
    'doc-after': () => h(ArticleRelations),
    'layout-bottom': () => h('div', { class: 'global-site-tools' }, [h(ReadingTools), h(ArticleImageLightbox), h(MusicPlayer)])
  }),
  enhanceApp({ app }) {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      }, { rootMargin: '0px 0px -36px 0px', threshold: 0.04 })
      app.directive('reveal', {
        mounted(el: HTMLElement) {
          el.classList.add('reveal-pending')
          observer.observe(el)
        },
        unmounted(el: HTMLElement) { observer.unobserve(el) }
      })
    } else {
      app.directive('reveal', {})
    }
    app.component('BlogNavItem', Header)
    app.component('Banner', Banner)
    app.component('ArticleCard', ArticleCard)
    app.component('ProfileCard', ProfileCard)
    app.component('CategoryCard', CategoryCard)
    app.component('BlogHome', BlogHome)
    app.component('BlogList', BlogList)
    app.component('CategoriesHome', CategoriesHome)
    app.component('BlogCategory', BlogCategory)
    app.component('TagSearch', TagSearch)
    app.component('ContactCard', ContactCard)
    app.component('AlbumPage', AlbumPage)
    app.component('FriendsPage', FriendsPage)
    app.component('MomentsPage', MomentsPage)
    app.component('MusicPage', MusicPage)
  }
} satisfies Theme
