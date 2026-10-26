import { defineConfig } from 'vitepress'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// Keep the hand-curated sidebar order intact and append articles that do not
// have a manual entry yet, so every article page remains reachable.
const docsDirectory = existsSync(join(process.cwd(), 'articles')) ? process.cwd() : join(process.cwd(), 'docs')
const articleDirectory = join(docsDirectory, 'articles')
const currentConfig = readFileSync(join(docsDirectory, '.vitepress', 'config.mts'), 'utf8')
const manuallyLinkedSlugs = new Set([...currentConfig.matchAll(/link:\s*["']\/articles\/([^"']+)["']/g)].map((match) => match[1]))
const automaticArticleLinks = readdirSync(articleDirectory, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'index.md')
  .map((entry) => {
    const slug = entry.name.slice(0, -3)
    const markdown = readFileSync(join(articleDirectory, entry.name), 'utf8')
    const frontmatter = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    const header = frontmatter?.[1] || ''
    const titleMatch = header.match(/^title:\s*(?:"((?:\\.|[^"])*)"|'([^']*)'|(.+))\s*$/m)
    let title = titleMatch?.[1] || titleMatch?.[2] || titleMatch?.[3]?.trim() || slug
    if (titleMatch?.[1]) {
      try { title = JSON.parse(`"${titleMatch[1]}"`) } catch { /* keep the displayed title as written */ }
    }
    const planDate = header.match(/^plan_date:\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1]?.trim() || ''
    return { slug, title, planDate }
  })
  .filter((article) => !manuallyLinkedSlugs.has(article.slug))
  .sort((a, b) => a.planDate.localeCompare(b.planDate) || a.slug.localeCompare(b.slug))
  .map((article) => ({ text: article.title, link: `/articles/${article.slug}` }))

export default defineConfig({
  lang: 'zh-CN',
  title: 'Cyzee · 技术与日常',
  description: '记录 Java 后端开发、分布式技术、数据基础设施与 AI 应用。',
  base: '/blog/',
  cleanUrls: true,
  sitemap: { hostname: 'https://1945-815.github.io/blog/' },
  transformHead({ page, pageData, title, description }) {
    const relativePath = page
      .replace(/^\/+/, '')
      .replace(/(^|\/)index\.md$/, '$1')
      .replace(/\.md$/, '')
    const canonical = new URL('/blog/' + relativePath, 'https://1945-815.github.io').toString()
    const pageTitle = String(pageData.frontmatter.title || title.replace(/ \| .+$/, ''))
    const pageDescription = String(pageData.frontmatter.description || description)
    const isArticle = relativePath.startsWith('articles/') && relativePath !== 'articles'
    const isNotFound = relativePath === '404'
    return [
      ...(isNotFound ? [] : [['link', { rel: 'canonical', href: canonical }]]),
      ['meta', { property: 'og:type', content: isArticle ? 'article' : 'website' }],
      ['meta', { property: 'og:title', content: pageTitle }],
      ['meta', { property: 'og:description', content: pageDescription }],
      ['meta', { property: 'og:url', content: canonical }],
      ['meta', { property: 'og:image', content: 'https://1945-815.github.io/blog/banner-water-desktop.jpg' }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'twitter:title', content: pageTitle }],
      ['meta', { name: 'twitter:description', content: pageDescription }],
      ...(isNotFound ? [['meta', { name: 'robots', content: 'noindex' }]] : [])
    ]
  },
  themeConfig: {
    logo: undefined,
    siteTitle: 'Cyzee',
    nav: [
      { component: 'BlogNavItem', props: { label: '首页', href: '/' } },
      { component: 'BlogNavItem', props: { label: '技术文章', href: '/articles/' } },
      { component: 'BlogNavItem', props: { label: '分类标签', href: '/categories/', links: [
        { label: '全部分类', href: '/categories/' },
        { label: '按标签查找', href: '/tags/' }
      ] } },
      { component: 'BlogNavItem', props: { label: '生活', href: '/albums/', links: [
        { label: '公开相册', href: '/albums/' },
        { label: '说说', href: '/moments/' },
        { label: '音乐', href: '/music/' },
        { label: '友情链接', href: '/friends/' }
      ] } },
      { component: 'BlogNavItem', props: { label: '关于我', href: '/about' } }
    ],
    search: { provider: 'local' },
    sidebar: {
      '/articles/': [
        {
          text: "Java 与并发",
          collapsed: true,
          items: [
            { text: "Java 类和对象", link: "/articles/002-java-class-object" },
            { text: "Java 字符串与 StringBuilder", link: "/articles/066-java-string-stringbuilder" },
            { text: "Java 集合的选择", link: "/articles/java-collections" },
            { text: "Java 泛型与类型擦除", link: "/articles/071-java-generics-type-erasure" },
            { text: "BigDecimal 金额与尾差", link: "/articles/072-bigdecimal-money-rounding" },
            { text: "数据结构入门", link: "/articles/004-data-structures-basics" },
            { text: "Java 异常与文件 IO", link: "/articles/005-java-exceptions-file-io" },
            { text: "Lambda 与函数式接口", link: "/articles/java-lambda-functional-interface" },
            { text: "Stream API 与副作用", link: "/articles/stream-api-side-effects" },
            { text: "Java 多线程起步", link: "/articles/007-java-concurrency-basics" },
            { text: "Java 多态与运行时分派", link: "/articles/046-java-polymorphism-interface" },
            { text: "CompletableFuture 异步编排", link: "/articles/051-completablefuture-async-orchestration" },
            { text: "JVM 内存与 OOM 排查", link: "/articles/052-jvm-memory-oom-diagnosis" },
            { text: "Java 类加载与 SPI", link: "/articles/053-java-spi-classloader" },
            { text: "Java 反射与内省", link: "/articles/056-java-reflection-bean-introspection" },
            { text: "Java 日期时间与时区", link: "/articles/061-java-time-zone-boundaries" },
          ]
        },
        {
          text: "Spring 与数据持久化",
          collapsed: true,
          items: [
            { text: "MySQL 表设计与多表查询", link: "/articles/008-mysql-table-design-joins" },
            { text: "事务、索引与重复提交", link: "/articles/mysql-transaction-index-idempotency" },
            { text: "EXPLAIN 与索引", link: "/articles/010-mysql-explain-index" },
            { text: "JDBC 预编译与 DAO", link: "/articles/011-jdbc-preparedstatement-dao" },
            { text: "Tomcat 与 Servlet", link: "/articles/servlet-tomcat-lifecycle" },
            { text: "Servlet 请求与 JSP 页面", link: "/articles/servlet-jsp-request-flow" },
            { text: "Spring MVC 请求流程", link: "/articles/spring-mvc-request-flow" },
            { text: "REST 接口设计", link: "/articles/restful-employee-api-design" },
            { text: "Spring IoC 与 DI", link: "/articles/013-spring-ioc-di" },
            { text: "Maven 多环境配置", link: "/articles/maven-environment-config" },
            { text: "Maven 多模块项目", link: "/articles/048-maven-multi-module" },
            { text: "Spring AOP 与事务", link: "/articles/015-spring-aop-transactions" },
            { text: "Spring Boot 自动配置", link: "/articles/049-springboot-auto-configuration" },
            { text: "MyBatis 入门与会话", link: "/articles/mybatis-session-mapper-basics" },
            { text: "MyBatis 参数映射与动态 SQL", link: "/articles/016-mybatis-dynamic-sql" },
            { text: "MyBatis 关联映射", link: "/articles/mybatis-association-mapping" },
            { text: "MyBatis 查询与批量写入性能", link: "/articles/047-mybatis-query-batch-performance" },
            { text: "接口校验与错误响应", link: "/articles/spring-validation-error-response" },
            { text: "MyBatis-Plus 筛选分页", link: "/articles/mybatis-plus-filter-pagination" },
            { text: "MySQL 分组统计报表", link: "/articles/062-mysql-grouped-reporting" },
            { text: "InnoDB MVCC 与一致性读", link: "/articles/067-mysql-innodb-mvcc-consistent-read" },
            { text: "Redis 数据结构与 TTL", link: "/articles/019-redis-types-ttl" },
            { text: "Docker 本地环境", link: "/articles/docker-local-backend-environment" },
            { text: "Spring Boot 分层 CRUD", link: "/articles/021-springboot-crud-project" },
            { text: "Git 版本控制", link: "/articles/git-version-control-basics" },
          ]
        },
        {
          text: "分布式与中间件",
          collapsed: true,
          items: [
            { text: "Nacos 注册与配置", link: "/articles/nacos-service-discovery-config" },
            { text: "Gateway 与 OpenFeign", link: "/articles/gateway-openfeign-responsibilities" },
            { text: "Gateway 过滤器顺序与耗时", link: "/articles/063-gateway-filter-order-timing" },
            { text: "Redis 热门文档缓存", link: "/articles/redis-hot-document-cache" },
            { text: "RabbitMQ 异步处理", link: "/articles/rabbitmq-consumer-boundary" },
            { text: "Elasticsearch 检索", link: "/articles/elasticsearch-document-search-mapping" },
            { text: "Elasticsearch bool 查询与高亮", link: "/articles/064-elasticsearch-bool-highlight" },
            { text: "Elasticsearch PIT 与深分页", link: "/articles/074-elasticsearch-pit-search-after" },
            { text: "Sentinel 限流", link: "/articles/sentinel-flow-control" },
            { text: "Spring Security 与 JWT", link: "/articles/spring-security-jwt-flow" },
          ]
        },
        {
          text: "后端工程实践",
          collapsed: true,
          items: [
            { text: "接口文档与安全清单", link: "/articles/api-doc-security-checklist" },
            { text: "预约与订单状态", link: "/articles/appointment-order-state-idempotency" },
            { text: "预约与审批状态建模", link: "/articles/appointment-approval-state-model" },
            { text: "Redis TTL 与验证码", link: "/articles/redis-ttl" },
            { text: "RBAC 权限模型", link: "/articles/050-rbac-permission-model" },
            { text: "Redis 分布式锁", link: "/articles/054-redis-distributed-lock" },
            { text: "Spring 定时任务与 Quartz", link: "/articles/055-quartz-scheduled-jobs" },
            { text: "Redis 每日点赞配额", link: "/articles/057-redis-daily-quota-lua" },
            { text: "Redis 持久化与恢复", link: "/articles/075-redis-persistence-recovery" },
            { text: "Nginx 反向代理与负载均衡", link: "/articles/058-nginx-java-load-balancing" },
            { text: "Spring Boot 容器化发布", link: "/articles/059-springboot-docker-multistage" },
            { text: "Linux JAR 服务与 systemd", link: "/articles/065-linux-springboot-jar-systemd" },
            { text: "Transactional Outbox 与 RabbitMQ", link: "/articles/068-transactional-outbox-mysql-rabbitmq" },
            { text: "Activiti 7 审批流程", link: "/articles/activiti7-approval-flow" },
            { text: "文档检索接口设计", link: "/articles/document-search-api-design" },
            { text: "文件上传、隔离与补偿", link: "/articles/073-springboot-file-upload-quarantine" },
            { text: "评论与举报审批", link: "/articles/activiti-comment-report-approval" },
            { text: "审批、任务与业务状态", link: "/articles/approval-and-business-status" },
            { text: "Canal 同步搜索索引", link: "/articles/canal-mysql-to-elasticsearch" },
            { text: "Codex 与 Cursor", link: "/articles/ai-coding-tools-workflow" },
            { text: "文档检索系统设计", link: "/articles/document-retrieval-system-design" },
            { text: "后端接口协作与联调", link: "/articles/backend-api-collaboration" },
          ]
        },
        {
          text: "AI 应用开发",
          collapsed: true,
          items: [
            { text: "RAG 文档问答链路", link: "/articles/rag-document-qa" },
            { text: "文档切分与向量检索", link: "/articles/rag-chunking-vector-search-demo" },
            { text: "Spring AI 与 Ollama", link: "/articles/043-spring-ai-ollama" },
            { text: "Embedding 与 Elasticsearch KNN", link: "/articles/044-elasticsearch-embedding-knn" },
            { text: "Agent 工具调用边界", link: "/articles/045-agent-tool-boundaries" },
            { text: "RAG 检索评估", link: "/articles/060-rag-retrieval-evaluation" },
            { text: "Spring AI 流式响应与 SSE", link: "/articles/069-spring-ai-streaming-sse" },
            { text: "Spring AI 会话记忆", link: "/articles/070-spring-ai-chat-memory-session" },
            { text: "Spring AI MCP Client / Server", link: "/articles/097-spring-ai-mcp-client-server" },
            { text: "多智能体协同模式", link: "/articles/098-spring-ai-multi-agent-patterns" },
            { text: "Hutool 常用工具类", link: "/articles/099-hutool-java-utilities" },
          ]
        },
        {
          text: "Web 基础",
          collapsed: true,
          items: [
            { text: "HTML 与 CSS 表单", link: "/articles/html-css-form-and-submission" },
            { text: "JavaScript 与 DOM 事件", link: "/articles/javascript-dom-events" },
            { text: "Vue 2 路由与请求拦截", link: "/articles/vue2-admin-spa-routing" },
          ]
        },
        ...(automaticArticleLinks.length ? [{ text: "其他文章", collapsed: true, items: automaticArticleLinks }] : [])
      ]
    },
    footer: {
      copyright: '© 2026 张耘璨（Cyzee） · 用文字记录技术与日常'
    },
    outline: { label: '文章目录', level: [2, 3] },
    docFooter: { prev: '上一篇', next: '下一篇' }
  },
  markdown: {
    lineNumbers: true
  },
  head: [
    ['meta', { name: 'theme-color', content: '#f7f7f4' }]
  ]
})
