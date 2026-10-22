export interface PortfolioProject {
  slug: string
  title: string
  href: string
  summary: string
  positioning: string
  stack: string[]
  functions: string[]
  responsibilities: string[]
  discussion: string[]
  flow: string[]
}

export const projects: PortfolioProject[] = [
  {
    slug: 'knowledge-management-platform',
    title: '智文知识管理平台',
    href: '/projects/knowledge-management-platform',
    summary: '面向企业内部知识管理，涵盖文档管理、全文检索和智能问答。',
    positioning: '面向企业内部知识管理场景，集文档管理、全文检索与智能问答于一体。',
    stack: ['Spring Cloud Alibaba', 'MyBatis-Plus', 'MySQL', 'Redis', 'Elasticsearch', 'RabbitMQ', 'Canal'],
    functions: ['文档上传、发布、分类管理与评论回复', '热门文档统计缓存', '多字段全文检索', 'Embedding、DeepSeek API 与 RAG 智能问答'],
    responsibilities: ['参与文档管理、检索与问答相关建设。', '使用 Spring Security 与 JWT 参与身份认证和权限控制。', '参与 Redis 热门文档统计缓存。', '参与 Canal 与 RabbitMQ 异步索引同步。'],
    discussion: ['MySQL 文档变更如何异步同步到 Elasticsearch。', '如何处理消息重复消费与索引更新的幂等性。', 'RAG 检索、上下文组织与模型回答各自承担什么职责。'],
    flow: ['文档管理与 MySQL', 'Canal → RabbitMQ → Elasticsearch', 'Embedding → 检索上下文 → DeepSeek API']
  },
  {
    slug: 'dental-clinic-manager',
    title: '牙管家',
    href: '/projects/dental-clinic-manager',
    summary: '面向口腔诊所日常运营，覆盖预约、诊疗订单、项目管理和审批。',
    positioning: '面向口腔诊所日常运营管理，涉及患者预约、诊疗订单、项目管理与审批流程。',
    stack: ['Spring Boot', 'MyBatis', 'MySQL', 'Redis', 'JWT', 'Activiti 7', 'Vue'],
    functions: ['患者预约与诊疗项目管理', '诊疗订单创建和状态处理', 'Activiti 7 审批流程部署与任务处理', '审批记录查询与前后端联调'],
    responsibilities: ['参与患者预约和诊疗项目管理。', '参与 Spring 事务及重复订单校验。', '参与 Activiti 7 流程部署、任务处理及记录查询。', '参与 JWT 认证、权限校验、项目上下架及联调。'],
    discussion: ['如何在事务边界内校验重复订单。', '流程引擎任务状态与业务状态如何保持清晰关联。', '如何设计预约和订单的状态校验及权限边界。'],
    flow: ['Vue 页面 → Spring Boot REST API', 'JWT 认证与权限校验', '预约与订单业务 → MySQL / Redis', '审批流程 → Activiti 7']
  }
]
