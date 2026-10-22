import { createContentLoader } from 'vitepress'

export interface ArticleSearchRecord {
  url: string
  text: string
}

declare const data: ArticleSearchRecord[]
export { data }

export default createContentLoader<ArticleSearchRecord[]>('articles/*.md', {
  includeSrc: true,
  transform(pages) {
    return pages
      .filter((page) => page.url !== '/articles/' && page.frontmatter.title)
      .map((page) => {
        const markdown = (page.src || '').replace(/^---\r?\n[\s\S]*?\r?\n---\s*/, '')
        const text = markdown
          .replace(/```[\s\S]*?```/g, ' ')
          .replace(/`([^`]+)`/g, ' $1 ')
          .replace(/!?\[([^\]]*)\]\([^)]*\)/g, ' $1 ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/^\s{0,3}#{1,6}\s*/gm, ' ')
          .replace(/[\p{P}\p{S}]/gu, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .toLocaleLowerCase()
        return { url: page.url, text }
      })
  }
})
