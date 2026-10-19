import { h } from 'vue'
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
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {
    'nav-bar-title-before': () => h(BrandMark),
    'doc-before': () => h(ArticleMeta),
    'layout-bottom': () => h(ReadingTools)
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
  }
} satisfies Theme
