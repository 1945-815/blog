import { createContentLoader } from 'vitepress'

export interface BlogArticle {
  url: string
  title: string
  date: string
  planDate: string
  phase: string
  category: string
  tags: string[]
  description: string
  readingMinutes: number
}

declare const data: BlogArticle[]
export { data }

export default createContentLoader<BlogArticle[]>('articles/*.md', {
  includeSrc: true,
  transform(pages) {
    return pages
      .filter((page) => page.url !== '/articles/' && page.frontmatter.title)
      .map((page) => {
        const fm = page.frontmatter
        const src = (page.src || '').replace(/^---[\s\S]*?---/, '')
        const chinese = (src.match(/[\u4e00-\u9fff]/g) || []).length
        const words = (src.match(/[A-Za-z]+/g) || []).length
        return {
          url: page.url,
          title: String(fm.title),
          date: String(fm.date || ''),
          planDate: String(fm.plan_date || ''),
          phase: String(fm.phase || ''),
          category: Array.isArray(fm.categories) ? String(fm.categories[0] || '') : String(fm.categories || ''),
          tags: Array.isArray(fm.tags) ? fm.tags.map(String) : [],
          description: String(fm.description || ''),
          readingMinutes: Math.max(2, Math.ceil(chinese / 360 + words / 220))
        }
      })
      .sort((a, b) => a.planDate.localeCompare(b.planDate))
  }
})
