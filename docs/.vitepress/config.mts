import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'Cyzee · Java 后端与 AI 应用',
  description: '记录 Java 后端工程实践、业务工作流与 RAG 应用探索。',
  base: '/blog/',
  cleanUrls: true,
  themeConfig: {
    logo: undefined,
    siteTitle: 'Cyzee 的博客',
    nav: [
      { component: 'BlogNavItem', props: { label: '首页', icon: 'home', href: '/' } },
      { component: 'BlogNavItem', props: { label: 'Java技术栈', icon: 'code', href: '/categories/java', links: [
        { label: 'Java 基础', href: '/categories/java' },
        { label: 'Spring 生态', href: '/categories/spring' },
        { label: '微服务', href: '/categories/microservices' }
      ] } },
      { component: 'BlogNavItem', props: { label: 'Python技术', icon: 'python', href: '/categories/python' } },
      { component: 'BlogNavItem', props: { label: '前端技术', icon: 'frontend', href: '/categories/frontend', links: [
        { label: '前端文章', href: '/categories/frontend' },
        { label: '项目记录', href: '/projects' }
      ] } },
      { component: 'BlogNavItem', props: { label: '数据存储', icon: 'database', href: '/categories/database', links: [
        { label: '数据库', href: '/categories/database' },
        { label: '中间件', href: '/categories/middleware' }
      ] } },
      { component: 'BlogNavItem', props: { label: 'AI生态', icon: 'ai', href: '/categories/ai' } },
      { component: 'BlogNavItem', props: { label: '周边技术', icon: 'peripheral', href: '/categories/middleware', links: [
        { label: '微服务', href: '/categories/microservices' },
        { label: '中间件', href: '/categories/middleware' },
        { label: '随笔与实践', href: '/categories/notes' }
      ] } },
      { component: 'BlogNavItem', props: { label: '帮助文档', icon: 'help', href: '/roadmap', links: [
        { label: '技术分类', href: '/categories/' },
        { label: '成长路线', href: '/roadmap' },
        { label: '项目记录', href: '/projects' },
        { label: '关于我', href: '/about' }
      ] } }
    ],
    socialLinks: [{ icon: { svg: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18V4.8a1 1 0 0 1 1.2-1A17 17 0 0 1 12 6a17 17 0 0 1 7.8-2.2 1 1 0 0 1 1.2 1V18a1 1 0 0 1-1 1 17 17 0 0 0-8 2 17 17 0 0 0-8-2 1 1 0 0 1-1-1Z"/></svg>' }, link: '/blog/roadmap', ariaLabel: '成长路线' }],
    search: { provider: 'local' },
    sidebar: {
      '/articles/': [
        {
          text: "阶段一：Java 基础与数据结构",
          collapsed: true,
          items: [
            { text: "Java 后端学习路线", link: "/articles/java-backend-learning-route" },
            { text: "Java 类和对象", link: "/articles/002-java-class-object" },
            { text: "Java 字符串与 StringBuilder", link: "/articles/066-java-string-stringbuilder" },
            { text: "Java 集合的选择", link: "/articles/java-collections" },
            { text: "Java 泛型与类型擦除", link: "/articles/071-java-generics-type-erasure" },
            { text: "BigDecimal 金额与尾差", link: "/articles/072-bigdecimal-money-rounding" },
            { text: "数据结构入门", link: "/articles/004-data-structures-basics" },
            { text: "Java 异常与文件 IO", link: "/articles/005-java-exceptions-file-io" },
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
          text: "阶段二：数据库与 Spring 基础",
          collapsed: true,
          items: [
            { text: "MySQL 表设计与多表查询", link: "/articles/008-mysql-table-design-joins" },
            { text: "事务、索引与重复提交", link: "/articles/mysql-transaction-index-idempotency" },
            { text: "EXPLAIN 与索引", link: "/articles/010-mysql-explain-index" },
            { text: "JDBC 预编译与 DAO", link: "/articles/011-jdbc-preparedstatement-dao" },
            { text: "Spring MVC 请求流程", link: "/articles/spring-mvc-request-flow" },
            { text: "Spring IoC 与 DI", link: "/articles/013-spring-ioc-di" },
            { text: "Maven 多环境配置", link: "/articles/maven-environment-config" },
            { text: "Maven 多模块项目", link: "/articles/048-maven-multi-module" },
            { text: "Spring AOP 与事务", link: "/articles/015-spring-aop-transactions" },
            { text: "Spring Boot 自动配置", link: "/articles/049-springboot-auto-configuration" },
            { text: "MyBatis 参数映射与动态 SQL", link: "/articles/016-mybatis-dynamic-sql" },
            { text: "MyBatis 查询与批量写入性能", link: "/articles/047-mybatis-query-batch-performance" },
            { text: "接口校验与错误响应", link: "/articles/spring-validation-error-response" },
            { text: "MyBatis-Plus 筛选分页", link: "/articles/mybatis-plus-filter-pagination" },
            { text: "MySQL 分组统计报表", link: "/articles/062-mysql-grouped-reporting" },
            { text: "InnoDB MVCC 与一致性读", link: "/articles/067-mysql-innodb-mvcc-consistent-read" },
            { text: "Redis 数据结构与 TTL", link: "/articles/019-redis-types-ttl" },
            { text: "Docker 本地环境", link: "/articles/docker-local-backend-environment" },
            { text: "Spring Boot CRUD 练习项目", link: "/articles/021-springboot-crud-project" },
          ]
        },
        {
          text: "阶段三：企业开发技术学习",
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
          text: "阶段四：Java 后端实习与业务实践",
          collapsed: true,
          items: [
            { text: "接口文档与安全清单", link: "/articles/api-doc-security-checklist" },
            { text: "预约与订单状态", link: "/articles/appointment-order-state-idempotency" },
            { text: "诊所预约与审批（脱敏）", link: "/articles/clinic-appointment-approval-redacted" },
            { text: "Redis TTL 与验证码", link: "/articles/redis-ttl" },
            { text: "RuoYi RBAC 权限模型", link: "/articles/050-ruoyi-rbac-permission-model" },
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
            { text: "Spring AI 与 Ollama", link: "/articles/043-spring-ai-ollama" },
            { text: "Embedding 与 Elasticsearch KNN", link: "/articles/044-elasticsearch-embedding-knn" },
            { text: "Agent 工具调用边界", link: "/articles/045-agent-tool-boundaries" },
            { text: "RAG 检索评估", link: "/articles/060-rag-retrieval-evaluation" },
            { text: "Spring AI 流式响应与 SSE", link: "/articles/069-spring-ai-streaming-sse" },
            { text: "Spring AI 会话记忆", link: "/articles/070-spring-ai-chat-memory-session" },
          ]
        },
      ]
    },
    footer: {
      message: '内容以个人学习与项目复盘为主，企业经历只做经许可的脱敏表达。',
      copyright: '© 2026 Cyzee · 用 Markdown 记录工程实践'
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
    ['meta', { property: 'og:title', content: 'Cyzee · Java 后端与 AI 应用' }],
    ['meta', { property: 'og:description', content: 'Java 后端工程实践、业务工作流与 RAG 应用探索。' }]
  ]
})
