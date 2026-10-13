import { withBase } from 'vitepress'
import type { BlogArticle } from '../../articles.data'
import { topicArticles } from './blog'
import type { TopicId } from './blog'

// Empty topics remain visible as learning directions. Published tag counts come from Front Matter.
const topicSuggestions: Partial<Record<TopicId, readonly string[]>> = {
  java: ['Java 基础', 'JVM', '集合', '并发'],
  spring: ['Spring Boot', 'Spring Cloud', 'MyBatis'],
  microservices: ['Spring Boot', 'Spring Cloud', 'Nacos', 'Gateway', 'OpenFeign'],
  database: ['MySQL', 'Redis', 'Elasticsearch', 'MongoDB'],
  middleware: ['Redis', 'RabbitMQ', 'Elasticsearch'],
  ai: ['RAG', 'Agent', 'LLM', '向量数据库'],
  frontend: ['Vue', 'React', 'TypeScript'],
  notes: ['实习', '项目复盘', '接口设计']
}

export interface TagOption { name: string; count: number }

export function tagKey(name: string) {
  return name.trim().toLocaleLowerCase().replace(/\s+/g, '')
}

export function articleTagNames(article: BlogArticle) {
  return [...new Set([article.category, ...article.tags].filter(Boolean))]
}

export function hasTag(article: BlogArticle, name: string) {
  const key = tagKey(name)
  return articleTagNames(article).some((tag) => {
    const candidate = tagKey(tag)
    const label = tag.toLocaleLowerCase()
    const prefix = name.trim().toLocaleLowerCase()
    return candidate === key || label.startsWith(`${prefix} `) || label.startsWith(`${prefix}-`) || label.endsWith(` ${prefix}`)
  })
}

export function tagCount(articles: BlogArticle[], name: string) {
  return articles.filter((article) => hasTag(article, name)).length
}

export function topicTagOptions(articles: BlogArticle[], topic: TopicId, includeArticleTags = false): TagOption[] {
  const suggestions = topicSuggestions[topic] || []
  const names = [...suggestions]
  if (includeArticleTags) {
    const discovered = topicArticles(articles, topic).flatMap(articleTagNames)
    const extras = [...new Set(discovered)].filter((name) => !names.some((existing) => tagKey(existing) === tagKey(name)))
    extras.sort((a, b) => tagCount(articles, b) - tagCount(articles, a) || a.localeCompare(b, 'zh-CN'))
    names.push(...extras.slice(0, Math.max(0, 10 - names.length)))
  }
  return names.map((name) => ({ name, count: tagCount(articles, name) }))
}

export function allTagOptions(articles: BlogArticle[]): TagOption[] {
  const names = [...new Set([...Object.values(topicSuggestions).flat(), ...articles.flatMap(articleTagNames)])]
  return names.map((name) => ({ name, count: tagCount(articles, name) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'))
}

export function tagHref(name: string) {
  return `/tags/?tag=${encodeURIComponent(name)}`
}

export function onTagLinkClick(event: MouseEvent, name: string) {
  if (typeof window === 'undefined' || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
  if (window.location.pathname.replace(/\/$/, '') === withBase('/tags/').replace(/\/$/, '')) {
    event.preventDefault()
    window.history.pushState({}, '', withBase(tagHref(name)))
    window.dispatchEvent(new Event('blog-tags-change'))
  }
}

export function byPublishedDate(a: BlogArticle, b: BlogArticle) {
  return b.date.localeCompare(a.date) || b.planDate.localeCompare(a.planDate) || a.title.localeCompare(b.title, 'zh-CN')
}
