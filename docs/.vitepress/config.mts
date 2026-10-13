import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: '张耘璨 · Java 后端与 AI 应用',
  description: '记录 Java 后端工程实践、业务工作流与 RAG 应用探索。',
  base: '/blog/',
  cleanUrls: true,
  themeConfig: {
    logo: undefined,
    siteTitle: '张耘璨的博客',
    nav: [
      { component: 'BlogNavItem', props: { label: '首页', icon: 'home', href: '/' } },
      { component: 'BlogNavItem', props: { label: 'Java技术栈', icon: 'code', href: '/categories/java', topic: 'java' } },
      { component: 'BlogNavItem', props: { label: '微服务', icon: 'network', href: '/categories/microservices', topic: 'microservices' } },
      { component: 'BlogNavItem', props: { label: '数据库', icon: 'database', href: '/categories/database', topic: 'database' } },
      { component: 'BlogNavItem', props: { label: 'AI生态', icon: 'ai', href: '/categories/ai', topic: 'ai' } },
      { component: 'BlogNavItem', props: { label: '前端技术', icon: 'frontend', href: '/categories/frontend', topic: 'frontend' } },
      { component: 'BlogNavItem', props: { label: '随笔', icon: 'notes', href: '/categories/notes', topic: 'notes' } },
      { component: 'BlogNavItem', props: { label: '关于我', icon: 'about', href: '/about' } }
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/1945-815' }],
    search: { provider: 'local' },
    sidebar: {
      '/articles/': [
        {
          text: "阶段一：Java 基础与数据结构",
          collapsed: true,
          items: [
            { text: "Java 后端学习路线", link: "/articles/java-backend-learning-route" },
            { text: "Java 类和对象", link: "/articles/002-java-class-object" },
            { text: "Java 集合的选择", link: "/articles/java-collections" },
            { text: "数据结构入门", link: "/articles/004-data-structures-basics" },
            { text: "Stream API 与副作用", link: "/articles/stream-api-side-effects" },
          ]
        },
        {
          text: "阶段二：数据库与 Spring 基础",
          collapsed: true,
          items: [
            { text: "MySQL 表设计与多表查询", link: "/articles/008-mysql-table-design-joins" },
            { text: "事务、索引与重复提交", link: "/articles/mysql-transaction-index-idempotency" },
            { text: "EXPLAIN 与索引", link: "/articles/010-mysql-explain-index" },
            { text: "JDBC 预编译与 DAO", link: "/articles/011-jdbc-preparedstatement-dao" },
            { text: "Spring MVC 请求流程", link: "/articles/spring-mvc-request-flow" },
            { text: "Maven 多环境配置", link: "/articles/maven-environment-config" },
            { text: "接口校验与错误响应", link: "/articles/spring-validation-error-response" },
            { text: "MyBatis-Plus 筛选分页", link: "/articles/mybatis-plus-filter-pagination" },
            { text: "Docker 本地环境", link: "/articles/docker-local-backend-environment" },
          ]
        },
        {
          text: "阶段三：企业开发技术学习",
          collapsed: true,
          items: [
            { text: "Nacos 注册与配置", link: "/articles/nacos-service-discovery-config" },
            { text: "Gateway 与 OpenFeign", link: "/articles/gateway-openfeign-responsibilities" },
            { text: "Redis 热门文档缓存", link: "/articles/redis-hot-document-cache" },
            { text: "RabbitMQ 异步处理", link: "/articles/rabbitmq-consumer-boundary" },
            { text: "Elasticsearch 检索", link: "/articles/elasticsearch-document-search-mapping" },
            { text: "Sentinel 限流", link: "/articles/sentinel-flow-control" },
            { text: "Spring Security 与 JWT", link: "/articles/spring-security-jwt-flow" },
          ]
        },
        {
          text: "阶段四：Java 后端实习与业务实践",
          collapsed: true,
          items: [
            { text: "接口文档与安全清单", link: "/articles/api-doc-security-checklist" },
            { text: "预约与订单状态", link: "/articles/appointment-order-state-idempotency" },
            { text: "诊所预约与审批（脱敏）", link: "/articles/clinic-appointment-approval-redacted" },
            { text: "Redis TTL 与验证码", link: "/articles/redis-ttl" },
            { text: "Activiti 7 审批流程", link: "/articles/activiti7-approval-flow" },
            { text: "文档检索接口设计", link: "/articles/document-search-api-design" },
            { text: "评论与举报审批", link: "/articles/activiti-comment-report-approval" },
            { text: "审批、任务与业务状态", link: "/articles/approval-and-business-status" },
            { text: "Canal 同步搜索索引", link: "/articles/canal-mysql-to-elasticsearch" },
            { text: "Codex 与 Cursor", link: "/articles/ai-coding-tools-workflow" },
            { text: "文档检索平台（脱敏）", link: "/articles/document-retrieval-platform-redacted" },
            { text: "实习接口开发复盘", link: "/articles/internship-api-collaboration-retro" },
          ]
        },
        {
          text: "阶段五：AI 应用探索",
          collapsed: true,
          items: [
            { text: "RAG 文档问答链路", link: "/articles/rag-document-qa" },
            { text: "文档切分与向量检索", link: "/articles/rag-chunking-vector-search-demo" },
          ]
        },
      ]
    },
    footer: {
      message: '内容以个人学习与项目复盘为主，企业经历只做经许可的脱敏表达。',
      copyright: '© 2026 张耘璨 · 用 Markdown 记录工程实践'
    },
    outline: { label: '文章目录', level: [2, 3] },
    docFooter: { prev: '上一篇', next: '下一篇' }
  },
  markdown: {
    lineNumbers: true
  },
  head: [
    ['meta', { name: 'theme-color', content: '#f7f8f5' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: '张耘璨 · Java 后端与 AI 应用' }],
    ['meta', { property: 'og:description', content: 'Java 后端工程实践、业务工作流与 RAG 应用探索。' }]
  ]
})
