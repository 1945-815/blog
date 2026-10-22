import type { BlogArticle } from '../../articles.data'

export const topics = [
  { id: 'java', name: 'Java 核心', description: '语言基础、集合、并发与 JVM', icon: '01' },
  { id: 'python', name: 'Python 技术', description: '当前没有归入此方向的文章', icon: '02' },
  { id: 'spring', name: '后端框架', description: 'Spring、Spring Boot、MyBatis 与工作流', icon: '03' },
  { id: 'microservices', name: '微服务', description: 'Nacos、Gateway、OpenFeign 与限流', icon: '04' },
  { id: 'database', name: '数据库与缓存', description: 'MySQL、Redis、SQL 优化与数据同步', icon: '05' },
  { id: 'middleware', name: '中间件', description: 'Redis、RabbitMQ 与 Elasticsearch', icon: '06' },
  { id: 'ai', name: 'AI 应用开发', description: 'RAG、Embedding、MCP 与模型应用探索', icon: '07' },
  { id: 'frontend', name: '前端笔记', description: '现有的 Vue、HTML 与 JavaScript 学习记录', icon: '08' },
  { id: 'notes', name: '工程实践与项目复盘', description: '部署、接口设计、协作与项目复盘', icon: '09' }
] as const

export type TopicId = (typeof topics)[number]['id']

export function belongsTo(article: BlogArticle, topic: TopicId): boolean {
  const text = [article.title, article.category, ...article.tags].join(' ').toLowerCase()
  switch (topic) {
    case 'java': return article.phase.includes('Java 基础') || /java|集合|stream|maven|jvm|多线程|并发/.test(text)
    case 'python': return /python/.test(text)
    case 'spring': return /spring|mybatis|activiti/.test(text)
    case 'microservices': return /nacos|gateway|openfeign|sentinel|微服务|spring cloud/.test(text)
    case 'database': return /mysql|mybatis|数据库|canal|索引/.test(text)
    case 'middleware': return /redis|rabbitmq|elasticsearch|缓存|消息|检索|docker/.test(text)
    case 'ai': return /rag|大模型|ai 编程|模型 api|向量/.test(text)
    case 'frontend': return /vue|react|前端|typescript/.test(text)
    case 'notes': return /docker|linux|git|部署|工程|项目|复盘|协作|接口|api/.test(text) || article.phase.includes('实习')
  }
}

export function topicArticles(articles: BlogArticle[], topic: TopicId) {
  return articles.filter((article) => belongsTo(article, topic))
}

export function topicHref(topic: TopicId) {
  return `/categories/${topic}`
}
