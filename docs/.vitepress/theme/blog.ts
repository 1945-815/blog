import type { BlogArticle } from '../../articles.data'

export const topics = [
  { id: 'java', name: 'Java 核心', description: '语言、集合、并发、JVM 与常用设计', icon: '01' },
  { id: 'spring', name: 'Spring 生态', description: 'Spring Boot、MyBatis、Web 与工作流', icon: '02' },
  { id: 'microservices', name: '分布式系统', description: '服务发现、网关、调用治理与调度', icon: '03' },
  { id: 'database', name: '数据库与缓存', description: 'MySQL、Redis、SQL 与数据同步', icon: '04' },
  { id: 'middleware', name: '中间件与搜索', description: '消息队列、搜索引擎、缓存与服务治理', icon: '05' },
  { id: 'ai', name: 'AI 应用开发', description: 'RAG、Embedding、MCP 与模型集成', icon: '06' },
  { id: 'frontend', name: 'Web 基础', description: 'Vue、HTML、CSS 与 JavaScript', icon: '07' },
  { id: 'notes', name: '工程与工具', description: '部署、接口设计、协作与可观测性', icon: '08' }
] as const

export type TopicId = (typeof topics)[number]['id']

export function belongsTo(article: BlogArticle, topic: TopicId): boolean {
  const text = [article.title, article.category, ...article.tags].join(' ').toLowerCase()
  switch (topic) {
    case 'java': return article.phase.includes('Java') || /java|集合|stream|maven|jvm|多线程|并发/.test(text)
    case 'spring': return /spring|mybatis|activiti/.test(text)
    case 'microservices': return /nacos|gateway|openfeign|sentinel|微服务|spring cloud/.test(text)
    case 'database': return /mysql|mybatis|数据库|canal|索引/.test(text)
    case 'middleware': return /redis|rabbitmq|elasticsearch|缓存|消息|检索|docker/.test(text)
    case 'ai': return /rag|大模型|ai 编程|模型 api|向量/.test(text)
    case 'frontend': return /vue|react|前端|typescript/.test(text)
    case 'notes': return /docker|linux|git|部署|工程|项目|协作|接口|api|可观测/.test(text) || article.phase.includes('工程实践')
  }
}

export function topicArticles(articles: BlogArticle[], topic: TopicId) {
  return articles.filter((article) => belongsTo(article, topic))
}

export function topicHref(topic: TopicId) {
  return `/categories/${topic}`
}
