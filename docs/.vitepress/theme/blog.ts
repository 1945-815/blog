import type { BlogArticle } from '../../articles.data'

export const topics = [
  { id: 'java', name: 'Java 技术栈', description: '语言基础、集合与工程习惯', icon: '01' },
  { id: 'python', name: 'Python 技术', description: '这个方向的文章正在整理', icon: '02' },
  { id: 'spring', name: 'Spring 生态', description: 'Spring Boot、MVC、安全与持久化', icon: '03' },
  { id: 'microservices', name: '微服务', description: 'Nacos、Gateway、OpenFeign 与限流', icon: '04' },
  { id: 'database', name: '数据库', description: 'MySQL、MyBatis 与数据同步', icon: '05' },
  { id: 'middleware', name: '中间件', description: 'Redis、RabbitMQ 与 Elasticsearch', icon: '06' },
  { id: 'ai', name: 'AI 生态', description: 'RAG、检索与模型应用探索', icon: '07' },
  { id: 'frontend', name: '前端技术', description: '面向完整应用的前端学习记录', icon: '08' },
  { id: 'notes', name: '随笔与实践', description: '实习协作、接口设计和项目复盘', icon: '09' }
] as const

export type TopicId = (typeof topics)[number]['id']

export function belongsTo(article: BlogArticle, topic: TopicId): boolean {
  const text = [article.title, article.category, ...article.tags].join(' ').toLowerCase()
  switch (topic) {
    case 'java': return article.phase.includes('Java 基础') || /java|集合|stream|maven/.test(text)
    case 'python': return /python/.test(text)
    case 'spring': return /spring|mybatis|activiti/.test(text)
    case 'microservices': return /nacos|gateway|openfeign|sentinel|微服务|spring cloud/.test(text)
    case 'database': return /mysql|mybatis|数据库|canal|索引/.test(text)
    case 'middleware': return /redis|rabbitmq|elasticsearch|缓存|消息|检索|docker/.test(text)
    case 'ai': return /rag|大模型|ai 编程|模型 api|向量/.test(text)
    case 'frontend': return /vue|react|前端|typescript/.test(text)
    case 'notes': return article.phase.includes('实习') || /复盘|项目|协作/.test(text)
  }
}

export function topicArticles(articles: BlogArticle[], topic: TopicId) {
  return articles.filter((article) => belongsTo(article, topic))
}

export function topicHref(topic: TopicId) {
  return `/categories/${topic}`
}
