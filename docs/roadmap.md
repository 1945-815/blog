# 内容路线图

## 日期说明

学习路线从 **2023-10-11** 开始整理，覆盖 Java 基础、数据库与 Spring、2025 年技术练习、2026 年 1—9 月实习，以及 2026 年 10 月后的 AI 应用探索。


## 五个阶段

| 阶段 | 时间 | 写作重点 |
|---|---|---|
| 阶段一：Java 基础与数据结构 | 2023.10—2024.03 | 从 Java 语法、对象和集合开始，先建立可以解释的基础。 |
| 阶段二：数据库与 Spring 基础 | 2024.01—2024.08 | 把数据持久化、请求链路和工程配置连成一个小型后端应用。 |
| 阶段三：企业开发技术学习 | 2025.01—2025.12 | 通过个人 Demo 认识微服务、缓存、消息与搜索的边界。 |
| 阶段四：Java 后端实习与业务实践 | 2026.01.06—2026.09.30 | 结合简历可支撑的接口、预约、文档检索与审批职责做脱敏复盘。 |
| 阶段五：AI 应用探索 | 2026.10 起 | 沿文档处理、检索、模型 API 的链路继续学习；后续节点仍属规划。 |

## 45 篇文章的学习顺序

| 日期 | 文章 | 阶段 |
|---|---|---|
| 2023-10-20 | [我的 Java 后端学习路线：学过什么，哪些还在实践](/articles/java-backend-learning-route) | Java 基础与数据结构 |
| 2023-10-30 | [第一次理解 Java 类和对象：字段、方法与封装](/articles/002-java-class-object) | Java 基础与数据结构 |
| 2023-11-18 | [Java 集合的选择：List、Set、Map 分别解决什么问题](/articles/java-collections) | Java 基础与数据结构 |
| 2023-11-28 | [数据结构入门：数组、链表、栈、队列与复杂度](/articles/004-data-structures-basics) | Java 基础与数据结构 |
| 2023-12-10 | [Java 异常与文件 IO：把失败路径写清楚](/articles/005-java-exceptions-file-io) | Java 基础与数据结构 |
| 2023-12-25 | [Stream API 的常见用法与容易忽略的副作用](/articles/stream-api-side-effects) | Java 基础与数据结构 |
| 2023-12-28 | [Java 多线程起步：共享状态、线程安全与同步](/articles/007-java-concurrency-basics) | Java 基础与数据结构 |
| 2024-01-20 | [MySQL 表设计与多表查询：从实体关系写 SQL](/articles/008-mysql-table-design-joins) | 数据库与 Spring 基础 |
| 2024-02-10 | [数据库事务、索引与重复提交问题](/articles/mysql-transaction-index-idempotency) | 数据库与 Spring 基础 |
| 2024-02-25 | [用 EXPLAIN 理解 MySQL 索引：读懂一条查询计划](/articles/010-mysql-explain-index) | 数据库与 Spring 基础 |
| 2024-03-15 | [JDBC 预编译与 DAO：参数绑定和持久层边界](/articles/011-jdbc-preparedstatement-dao) | 数据库与 Spring 基础 |
| 2024-04-05 | [Spring MVC 请求从进入到返回的大致流程](/articles/spring-mvc-request-flow) | 数据库与 Spring 基础 |
| 2024-04-20 | [Spring IoC 与 DI：对象创建和依赖管理](/articles/013-spring-ioc-di) | 数据库与 Spring 基础 |
| 2024-05-10 | [Maven 配置文件与多环境配置的使用整理](/articles/maven-environment-config) | 数据库与 Spring 基础 |
| 2024-05-25 | [Spring AOP 与事务：横切逻辑和事务边界](/articles/015-spring-aop-transactions) | 数据库与 Spring 基础 |
| 2024-06-10 | [MyBatis 参数映射与动态 SQL：完成条件查询](/articles/016-mybatis-dynamic-sql) | 数据库与 Spring 基础 |
| 2024-06-20 | [Spring Boot 接口中的参数校验与统一错误响应](/articles/spring-validation-error-response) | 数据库与 Spring 基础 |
| 2024-07-20 | [用 MyBatis-Plus 实现条件筛选和分页查询](/articles/mybatis-plus-filter-pagination) | 数据库与 Spring 基础 |
| 2024-07-30 | [Redis 基础数据结构与 TTL：临时状态和 key 设计](/articles/019-redis-types-ttl) | 数据库与 Spring 基础 |
| 2024-08-20 | [用 Docker 搭建本地后端开发环境](/articles/docker-local-backend-environment) | 数据库与 Spring 基础 |
| 2024-08-30 | [Spring Boot 练习项目：从表结构到分页 CRUD 接口](/articles/021-springboot-crud-project) | 数据库与 Spring 基础 |
| 2025-01-15 | [Nacos 在微服务中的注册发现与配置管理](/articles/nacos-service-discovery-config) | 企业开发技术学习 |
| 2025-02-12 | [Gateway 与 OpenFeign 在服务调用中的分工](/articles/gateway-openfeign-responsibilities) | 企业开发技术学习 |
| 2025-03-10 | [热门文档访问场景下的 Redis 缓存设计](/articles/redis-hot-document-cache) | 企业开发技术学习 |
| 2025-05-18 | [RabbitMQ 异步处理的基本流程与消费者边界](/articles/rabbitmq-consumer-boundary) | 企业开发技术学习 |
| 2025-07-20 | [Elasticsearch 标题与内容检索的索引设计](/articles/elasticsearch-document-search-mapping) | 企业开发技术学习 |
| 2025-09-10 | [Sentinel 限流实践：规则、入口与降级边界](/articles/sentinel-flow-control) | 企业开发技术学习 |
| 2025-10-08 | [Spring Security 与 JWT 的认证授权流程](/articles/spring-security-jwt-flow) | 企业开发技术学习 |
| 2026-01-20 | [Java 后端项目中的接口文档与安全检查清单](/articles/api-doc-security-checklist) | Java 后端实习与业务实践 |
| 2026-02-12 | [预约和服务订单中的状态流转与重复提交](/articles/appointment-order-state-idempotency) | Java 后端实习与业务实践 |
| 2026-03-05 | [诊所预约与审批平台的业务流程设计（脱敏）](/articles/clinic-appointment-approval-redacted) | Java 后端实习与业务实践 |
| 2026-03-26 | [Redis TTL 在验证码和临时状态管理中的应用](/articles/redis-ttl) | Java 后端实习与业务实践 |
| 2026-04-15 | [Activiti 7 审批流程：从流程定义到任务处理](/articles/activiti7-approval-flow) | Java 后端实习与业务实践 |
| 2026-05-06 | [文档检索服务的接口设计：上传、分类与分页](/articles/document-search-api-design) | Java 后端实习与业务实践 |
| 2026-05-27 | [评论或举报审批如何接入 Activiti 流程](/articles/activiti-comment-report-approval) | Java 后端实习与业务实践 |
| 2026-06-17 | [审批状态、任务状态与业务状态如何对应](/articles/approval-and-business-status) | Java 后端实习与业务实践 |
| 2026-07-08 | [用 Canal 同步 MySQL 变更到搜索索引](/articles/canal-mysql-to-elasticsearch) | Java 后端实习与业务实践 |
| 2026-07-29 | [Codex 和 Cursor 如何辅助接口开发与代码理解](/articles/ai-coding-tools-workflow) | Java 后端实习与业务实践 |
| 2026-08-19 | [企业文档检索平台的模块划分与技术选型（脱敏）](/articles/document-retrieval-platform-redacted) | Java 后端实习与业务实践 |
| 2026-09-30 | [从实习项目中复盘接口开发、联调与问题定位](/articles/internship-api-collaboration-retro) | Java 后端实习与业务实践 |
| 2026-10-01 | [RAG 文档问答的基本链路：文档、检索与模型 API](/articles/rag-document-qa) | AI 应用探索 |
| 2026-10-04 | [文档切分和向量检索：一个小型 RAG Demo 的实现](/articles/rag-chunking-vector-search-demo) | AI 应用探索 |
| 2026-10-08 | [用 Spring AI 和 Ollama 完成第一次本地模型调用](/articles/043-spring-ai-ollama) | AI 应用探索 |
| 2026-10-12 | [Embedding 接入 Elasticsearch：dense_vector、KNN 与维度核对](/articles/044-elasticsearch-embedding-knn) | AI 应用探索 |
| 2026-10-15 | [Agent 工具调用：输入校验、权限边界与失败处理](/articles/045-agent-tool-boundaries) | AI 应用探索 |

## 主题补充文章

下面补充当前文章归档中的其他文章，按主题提供导航入口，不表示学习时间、首次公开时间或发布时间。主线学习顺序仍以上表为准；文章的计划日期和实际公开状态请以各文章页说明为准。

### Java 语言、并发与 JVM

- [从接口到运行时分派：用多态组织可扩展的 Java 业务](/articles/046-java-polymorphism-interface)
- [CompletableFuture 异步编排：线程池隔离、超时与异常边界](/articles/051-completablefuture-async-orchestration)
- [JVM 内存与 OOM 排查：从运行时区域到堆转储证据](/articles/052-jvm-memory-oom-diagnosis)
- [Java 类加载与 SPI：从类身份到可控的扩展发现](/articles/053-java-spi-classloader)
- [Java 反射与内省：理解框架如何读取对象属性](/articles/056-java-reflection-bean-introspection)
- [Java 日期时间处理：用 java.time 解决时区与区间边界](/articles/061-java-time-zone-boundaries)
- [Java 字符串实践：String 不可变性与 StringBuilder](/articles/066-java-string-stringbuilder)
- [Java 泛型为什么不能随便强转：类型擦除、通配符与分页 DTO](/articles/071-java-generics-type-erasure)
- [BigDecimal 金额计算：从舍入规则到分摊尾差](/articles/072-bigdecimal-money-rounding)

### Spring、工程化与微服务

- [MyBatis 查询与批量写入性能：识别 N+1 并控制数据库往返](/articles/047-mybatis-query-batch-performance)
- [Maven 多模块项目：聚合、依赖管理与团队构建边界](/articles/048-maven-multi-module)
- [Spring Boot 启动与自动配置：从条件装配到问题诊断](/articles/049-springboot-auto-configuration)
- [RuoYi RBAC 权限模型：从角色菜单到后端接口校验](/articles/050-ruoyi-rbac-permission-model)
- [Spring 定时任务与 Quartz：从单机触发到多实例调度](/articles/055-quartz-scheduled-jobs)
- [Nginx 反向代理与负载均衡：把请求稳妥地交给 Spring Boot](/articles/058-nginx-java-load-balancing)
- [Spring Boot 应用容器化发布：从可执行 JAR 到多阶段镜像](/articles/059-springboot-docker-multistage)
- [Spring Cloud Gateway 过滤器顺序与耗时统计](/articles/063-gateway-filter-order-timing)
- [Linux 上运行 Spring Boot JAR：systemd 管理与故障排查](/articles/065-linux-springboot-jar-systemd)

### 数据库、缓存与搜索

- [Redis 分布式锁实践：租约、唯一标识与数据库兜底](/articles/054-redis-distributed-lock)
- [Redis Lua 实现每日点赞配额：把检查和计数放进同一次操作](/articles/057-redis-daily-quota-lua)
- [MySQL 分组统计实战：从订单明细到分类报表](/articles/062-mysql-grouped-reporting)
- [Elasticsearch bool 查询与高亮：组合过滤条件并返回可展示片段](/articles/064-elasticsearch-bool-highlight)
- [MySQL InnoDB MVCC：一致性读与事务快照](/articles/067-mysql-innodb-mvcc-consistent-read)
- [Elasticsearch 深分页：用 PIT 与 search_after 稳定翻页](/articles/074-elasticsearch-pit-search-after)
- [Redis 持久化与恢复：RDB、AOF 和缓存重建的边界](/articles/075-redis-persistence-recovery)

### AI 与工程实践

- [RAG 检索评估：用黄金问题集定位召回与回答问题](/articles/060-rag-retrieval-evaluation)
- [Transactional Outbox：让 MySQL 写入与 RabbitMQ 事件可靠衔接](/articles/068-transactional-outbox-mysql-rabbitmq)
- [Spring AI 流式响应：用 WebFlux 与 SSE 逐段返回模型内容](/articles/069-spring-ai-streaming-sse)
- [Spring AI 会话记忆：会话隔离、窗口裁剪与 JDBC 持久化](/articles/070-spring-ai-chat-memory-session)
- [Spring Boot 文件上传：大小校验、隔离存储与失败补偿](/articles/073-springboot-file-upload-quarantine)
