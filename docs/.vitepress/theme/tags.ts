import { withBase } from 'vitepress'
import type { BlogArticle } from '../../articles.data'
import { belongsTo, topics } from './blog'
import type { TopicId } from './blog'

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

export function topicTagOptions(articles: BlogArticle[], topic: TopicId): TagOption[] {
  const scopedArticles = articles.filter((article) => belongsTo(article, topic))
  const names = [...new Map(scopedArticles.flatMap(articleTagNames).map((name) => [tagKey(name), name.trim()])).values()]

  return names
    .map((name) => ({ name, count: tagCount(scopedArticles, name) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'))
}

export function allTagOptions(articles: BlogArticle[]): TagOption[] {
  const names = [...new Set(articles.flatMap(articleTagNames))]
  return names.map((name) => ({ name, count: tagCount(articles, name) }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'))
}

export function categoryTagHref(topic: TopicId, name?: string) {
  const path = `/categories/${topic}`
  return name ? `${path}?tag=${encodeURIComponent(name)}` : path
}

export function selectedCategoryTag() {
  return typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('tag')?.trim() || ''
}

export function setCategoryTag(topic: TopicId, name?: string) {
  if (typeof window === 'undefined') return
  window.history.pushState({}, '', withBase(categoryTagHref(topic, name)))
  window.dispatchEvent(new Event('blog-category-tag-change'))
}

export function onCategoryTagLinkClick(event: MouseEvent, topic: TopicId, name: string) {
  if (typeof window === 'undefined' || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
  const cleanPath = (path: string) => path.replace(/\.html$/, '').replace(/\/$/, '')
  if (cleanPath(window.location.pathname) === cleanPath(withBase(categoryTagHref(topic)))) {
    event.preventDefault()
    setCategoryTag(topic, name)
  }
}

// Article tags outside a category page still open an existing category with the tag preselected.
export function topicForTag(articles: BlogArticle[], name: string, article?: BlogArticle): TopicId {
  const matching = topics.map((topic) => topic.id).filter((topic) =>
    articles.some((item) => belongsTo(item, topic) && hasTag(item, name))
  )
  if (article) {
    const ownTopic = matching.find((topic) => belongsTo(article, topic))
    if (ownTopic) return ownTopic
  }
  if (matching.length) return matching[0]
  if (article) {
    const ownTopic = topics.find((topic) => belongsTo(article, topic.id))
    if (ownTopic) return ownTopic.id
  }
  return topics.find((topic) => topicArticles(articles, topic.id).some((item) => hasTag(item, name)))?.id || 'java'
}

export function byRouteDate(a: BlogArticle, b: BlogArticle) {
  return b.planDate.localeCompare(a.planDate) || b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'zh-CN')
}
