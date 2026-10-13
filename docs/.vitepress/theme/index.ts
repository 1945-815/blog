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
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {
    'nav-bar-title-before': () => h(BrandMark),
    'nav-bar-title-after': () => h('span', { class: 'brand-detail' }, 'Java 后端 · AI 应用'),
    'doc-before': () => h(ArticleMeta)
  }),
  enhanceApp({ app }) {
    app.component('BlogNavItem', Header)
    app.component('Banner', Banner)
    app.component('ArticleCard', ArticleCard)
    app.component('ProfileCard', ProfileCard)
    app.component('CategoryCard', CategoryCard)
    app.component('BlogHome', BlogHome)
    app.component('BlogList', BlogList)
    app.component('CategoriesHome', CategoriesHome)
    app.component('BlogCategory', BlogCategory)
  }
} satisfies Theme
