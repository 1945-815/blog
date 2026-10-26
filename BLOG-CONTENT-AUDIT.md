# 全站技术博客内容审计报告

审计日期：2026-10-26
工作区：`G:\codex\blog`
基线提交：`d17cc331cbc6d878920dd79db3a1806bf2337008`（审计开始时工作区干净）

## 范围与数量

- 文章总数：98 篇；本地 Markdown 文章源逐篇检查：98 篇。
- 本轮改动：35 篇文章（27 篇内容有改动；其中 14 篇更换路由，8 篇只有路由更名，其余路由更名文章也有内容或链接调整）。
- 无文章源码改动：63 篇；仍逐篇完成审阅。
- `content-plan.json`：98 条，与文章文件名逐项匹配；`plan_date` 无错配。
- `docs/` 下 Markdown 页面共 116 个；仓库忽略目录 `.blog-studio` 中没有 Markdown/MDX 草稿，`drafts/`、`trash/`、`backups/` 没有额外文章草稿。
- 文章 `date` 和 `plan_date` 值均保留原值；相较基线，98 篇文章的两个日期字段均无变更。
- 站点使用 VitePress，源文章在 `docs/articles/`，站点 base 为 `/blog/`，使用 `cleanUrls`；GitHub Actions 会在 main 推送后构建并部署。本报告记录的是本次推送前的线上基线扫描。

## 逐篇审计状态

“无需修改”表示该文已审阅，但本轮没有发现需要改动的文章源码；时间字段的整体待确认事项见下文。

| 文章源文件 | 标题 | 审计结论 |
| --- | --- | --- |
| [`002-java-class-object`](docs/articles/002-java-class-object.md) | Java 类和对象：字段、方法与封装 | 同步指向新 Object 与包装类路由的内部链接。 |
| [`004-data-structures-basics`](docs/articles/004-data-structures-basics.md) | 数据结构入门：数组、链表、栈、队列与复杂度 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`005-java-exceptions-file-io`](docs/articles/005-java-exceptions-file-io.md) | Java 异常与文件 IO：把失败路径写清楚 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`007-java-concurrency-basics`](docs/articles/007-java-concurrency-basics.md) | Java 多线程起步：共享状态、线程安全与同步 | 删除带日期的“笔记”自述，重写 Thread、Runnable、Callable 的说明。 |
| [`008-mysql-table-design-joins`](docs/articles/008-mysql-table-design-joins.md) | MySQL 表设计与多表查询：从实体关系写 SQL | 已逐篇审阅；本轮无需修改文章源码。 |
| [`010-mysql-explain-index`](docs/articles/010-mysql-explain-index.md) | 用 EXPLAIN 理解 MySQL 索引：读懂一条查询计划 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`011-jdbc-preparedstatement-dao`](docs/articles/011-jdbc-preparedstatement-dao.md) | JDBC 预编译与 DAO：参数绑定和持久层边界 | 驱动版本更新到官方当前 Connector/J 26.10.0，并校准兼容性表述。 |
| [`013-spring-ioc-di`](docs/articles/013-spring-ioc-di.md) | Spring IoC 与 DI：对象创建和依赖管理 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`015-spring-aop-transactions`](docs/articles/015-spring-aop-transactions.md) | Spring AOP 与事务：横切逻辑和事务边界 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`016-mybatis-dynamic-sql`](docs/articles/016-mybatis-dynamic-sql.md) | MyBatis 参数映射与动态 SQL：完成条件查询 | 将“真实项目”泛化为应用 schema 的技术说明。 |
| [`019-redis-types-ttl`](docs/articles/019-redis-types-ttl.md) | Redis 基础数据结构与 TTL：临时状态和 key 设计 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`021-springboot-crud-project`](docs/articles/021-springboot-crud-project.md) | Spring Boot 分层 CRUD 示例：从表结构到分页接口 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`043-spring-ai-ollama`](docs/articles/043-spring-ai-ollama.md) | Spring AI 与 Ollama：配置和本地模型调用 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`044-elasticsearch-embedding-knn`](docs/articles/044-elasticsearch-embedding-knn.md) | Embedding 接入 Elasticsearch：dense_vector、KNN 与维度核对 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`045-agent-tool-boundaries`](docs/articles/045-agent-tool-boundaries.md) | Agent 工具调用：输入校验、权限边界与失败处理 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`046-java-polymorphism-interface`](docs/articles/046-java-polymorphism-interface.md) | 从接口到运行时分派：用多态组织可扩展的 Java 业务 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`047-mybatis-query-batch-performance`](docs/articles/047-mybatis-query-batch-performance.md) | MyBatis 查询与批量写入性能：识别 N+1 并控制数据库往返 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`048-maven-multi-module`](docs/articles/048-maven-multi-module.md) | Maven 多模块项目：聚合、依赖管理与团队构建边界 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`049-springboot-auto-configuration`](docs/articles/049-springboot-auto-configuration.md) | Spring Boot 启动与自动配置：从条件装配到问题诊断 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`050-rbac-permission-model`](docs/articles/050-rbac-permission-model.md) | RBAC 权限模型：角色、菜单与接口授权 | 移除旧项目名路由和防御性自述；补充租户条件来自服务端认证上下文。 |
| [`051-completablefuture-async-orchestration`](docs/articles/051-completablefuture-async-orchestration.md) | CompletableFuture 异步编排：线程池隔离、超时与异常边界 | 将“真实项目”改为应用数据访问层的准确表述。 |
| [`052-jvm-memory-oom-diagnosis`](docs/articles/052-jvm-memory-oom-diagnosis.md) | JVM 内存与 OOM 排查：从运行时区域到堆转储证据 | 删除与示例游标查询无关的 created_at 组合索引。 |
| [`053-java-spi-classloader`](docs/articles/053-java-spi-classloader.md) | Java 类加载与 SPI：从类身份到可控的扩展发现 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`054-redis-distributed-lock`](docs/articles/054-redis-distributed-lock.md) | Redis 分布式锁实践：租约、唯一标识与数据库兜底 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`055-quartz-scheduled-jobs`](docs/articles/055-quartz-scheduled-jobs.md) | Spring 定时任务与 Quartz：从单机触发到多实例调度 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`056-java-reflection-bean-introspection`](docs/articles/056-java-reflection-bean-introspection.md) | Java 反射与内省：理解框架如何读取对象属性 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`057-redis-daily-quota-lua`](docs/articles/057-redis-daily-quota-lua.md) | Redis Lua 实现每日点赞配额：把检查和计数放进同一次操作 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`058-nginx-java-load-balancing`](docs/articles/058-nginx-java-load-balancing.md) | Nginx 反向代理与负载均衡：把请求稳妥地交给 Spring Boot | 修正 proxy_pass 带 URI 时的路径结果，并修正 Spring Boot 转发头配置键。 |
| [`059-springboot-docker-multistage`](docs/articles/059-springboot-docker-multistage.md) | Spring Boot 应用容器化发布：从可执行 JAR 到多阶段镜像 | 将过时的 OpenJDK 基础镜像替换为 Eclipse Temurin 17 JRE。 |
| [`060-rag-retrieval-evaluation`](docs/articles/060-rag-retrieval-evaluation.md) | RAG 检索评估：用黄金问题集定位召回与回答问题 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`061-java-time-zone-boundaries`](docs/articles/061-java-time-zone-boundaries.md) | Java 日期时间处理：用 java.time 解决时区与区间边界 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`062-mysql-grouped-reporting`](docs/articles/062-mysql-grouped-reporting.md) | MySQL 分组统计：从订单明细到分类报表 | 为外层明细查询增加 status = PAID，保持查询含义一致。 |
| [`063-gateway-filter-order-timing`](docs/articles/063-gateway-filter-order-timing.md) | Spring Cloud Gateway 过滤器顺序与耗时统计 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`064-elasticsearch-bool-highlight`](docs/articles/064-elasticsearch-bool-highlight.md) | Elasticsearch bool 查询与高亮：组合过滤条件并返回可展示片段 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`065-linux-springboot-jar-systemd`](docs/articles/065-linux-springboot-jar-systemd.md) | Linux 上运行 Spring Boot JAR：systemd 管理与故障排查 | 将“生产项目”改为“生产环境”。 |
| [`066-java-string-stringbuilder`](docs/articles/066-java-string-stringbuilder.md) | Java 字符串实践：String 不可变性与 StringBuilder | 已逐篇审阅；本轮无需修改文章源码。 |
| [`067-mysql-innodb-mvcc-consistent-read`](docs/articles/067-mysql-innodb-mvcc-consistent-read.md) | MySQL InnoDB MVCC：一致性读与事务快照 | 将示例库 study 改为中性名称 backend_demo。 |
| [`068-transactional-outbox-mysql-rabbitmq`](docs/articles/068-transactional-outbox-mysql-rabbitmq.md) | Transactional Outbox：让 MySQL 写入与 RabbitMQ 事件可靠衔接 | 分类由“项目实践”改为“工程实践”。 |
| [`069-spring-ai-streaming-sse`](docs/articles/069-spring-ai-streaming-sse.md) | Spring AI 流式响应：用 WebFlux 与 SSE 逐段返回模型内容 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`070-spring-ai-chat-memory-session`](docs/articles/070-spring-ai-chat-memory-session.md) | Spring AI 会话记忆：会话隔离、窗口裁剪与 JDBC 持久化 | 将示例库 study 改为中性名称 backend_demo。 |
| [`071-java-generics-type-erasure`](docs/articles/071-java-generics-type-erasure.md) | Java 泛型为什么不能随便强转：类型擦除、通配符与分页 DTO | 已逐篇审阅；本轮无需修改文章源码。 |
| [`072-bigdecimal-money-rounding`](docs/articles/072-bigdecimal-money-rounding.md) | BigDecimal 金额计算：从舍入规则到分摊尾差 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`073-springboot-file-upload-quarantine`](docs/articles/073-springboot-file-upload-quarantine.md) | Spring Boot 文件上传：大小校验、隔离存储与失败补偿 | 分类由“项目实践”改为“工程实践”。 |
| [`074-elasticsearch-pit-search-after`](docs/articles/074-elasticsearch-pit-search-after.md) | Elasticsearch 深分页：用 PIT 与 search_after 稳定翻页 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`075-redis-persistence-recovery`](docs/articles/075-redis-persistence-recovery.md) | Redis 持久化与恢复：RDB、AOF 和缓存重建的边界 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`097-spring-ai-mcp-client-server`](docs/articles/097-spring-ai-mcp-client-server.md) | Spring AI MCP：用标准协议连接 Java 工具服务 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`098-spring-ai-multi-agent-patterns`](docs/articles/098-spring-ai-multi-agent-patterns.md) | 多智能体协同的几种编排模式：路由、串联、并行与评估 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`099-hutool-java-utilities`](docs/articles/099-hutool-java-utilities.md) | Hutool 常用工具类：字符串、标识符与 JSON | 版本更新到 Hutool 5.8.48，并补充官方发布链接。 |
| [`activiti-comment-report-approval`](docs/articles/activiti-comment-report-approval.md) | 评论或举报审批如何接入 Activiti 流程 | 分类由“项目实践”改为“工程实践”。 |
| [`activiti7-approval-flow`](docs/articles/activiti7-approval-flow.md) | Activiti 7 审批流程：从流程定义到任务处理 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`ai-coding-tools-workflow`](docs/articles/ai-coding-tools-workflow.md) | Codex 和 Cursor 如何辅助接口开发与代码理解 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`api-doc-security-checklist`](docs/articles/api-doc-security-checklist.md) | Java 后端项目中的接口文档与安全检查清单 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`appointment-approval-state-model`](docs/articles/appointment-approval-state-model.md) | 预约与审批的状态建模：业务状态、任务状态与幂等 | 旧 clinic/redacted 路径改为通用预约状态主题；旧地址保留跳转。 |
| [`appointment-order-state-idempotency`](docs/articles/appointment-order-state-idempotency.md) | 预约和服务订单中的状态流转与重复提交 | 分类由“项目实践”改为“工程实践”。 |
| [`approval-and-business-status`](docs/articles/approval-and-business-status.md) | 审批状态、任务状态与业务状态如何对应 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`backend-api-collaboration`](docs/articles/backend-api-collaboration.md) | 后端接口协作：契约、联调与问题定位 | 旧 internship/retro 路径改为通用接口协作主题；旧地址保留跳转。 |
| [`bloom-filter-fundamentals`](docs/articles/bloom-filter-fundamentals.md) | 布隆过滤器入门：用概率结构拦截不存在的数据 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`canal-mysql-to-elasticsearch`](docs/articles/canal-mysql-to-elasticsearch.md) | 用 Canal 同步 MySQL 变更到搜索索引 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`content-publishing-service-design`](docs/articles/content-publishing-service-design.md) | 微服务中的内容发布链路：服务边界、互动统计与搜索同步 | 移除 wolf2w/course-project 路径标识；改为通用内容发布架构主题。 |
| [`dau-mau-metrics`](docs/articles/dau-mau-metrics.md) | DAU 与 MAU：先统一活跃口径，再看留存和频率 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`docker-local-backend-environment`](docs/articles/docker-local-backend-environment.md) | 用 Docker 搭建本地后端开发环境 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`document-retrieval-system-design`](docs/articles/document-retrieval-system-design.md) | 文档检索系统设计：MySQL、Elasticsearch 与 RAG 的边界 | 旧 redacted/platform 路径改为通用系统设计主题；旧地址保留跳转。 |
| [`document-search-api-design`](docs/articles/document-search-api-design.md) | 文档检索服务的接口设计：上传、分类与分页 | 分类由“项目实践”改为“工程实践”。 |
| [`elasticsearch-document-search-mapping`](docs/articles/elasticsearch-document-search-mapping.md) | Elasticsearch 标题与内容检索的索引设计 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`gateway-openfeign-responsibilities`](docs/articles/gateway-openfeign-responsibilities.md) | Gateway 与 OpenFeign 在服务调用中的分工 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`git-version-control-basics`](docs/articles/git-version-control-basics.md) | Git 版本控制：工作区、暂存与分支合并 | 移除 classroom 路径标识；旧地址保留跳转。 |
| [`html-css-form-and-submission`](docs/articles/html-css-form-and-submission.md) | HTML 与 CSS 入门：表格、表单和提交方式 | 移除 notes 路径标识，并同步前端相关链接文字和目标。 |
| [`java-collections`](docs/articles/java-collections.md) | Java 集合的选择：List、Set、Map 分别解决什么问题 | 移除与求职面试相关的表达，改为代码评审和问题排查语境。 |
| [`java-design-patterns-overview`](docs/articles/java-design-patterns-overview.md) | Java 设计模式总览：按创建、结构与行为梳理 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`java-lambda-functional-interface`](docs/articles/java-lambda-functional-interface.md) | Java Lambda、函数式接口与方法引用：以目录项筛选为例 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`java-object-wrapper-types`](docs/articles/java-object-wrapper-types.md) | Object 与包装类：判等、装箱和类型转换 | 移除 notes 路径标识；相关内部链接已同步。 |
| [`java-syntax-control-flow`](docs/articles/java-syntax-control-flow.md) | Java 基础语法：变量、输入与流程控制 | 移除 notes 路径标识；旧地址保留跳转。 |
| [`javascript-dom-events`](docs/articles/javascript-dom-events.md) | JavaScript 基础与 DOM：用事件更新页面 | 移除笔记式开头；修正自查问题中的变量名 courses 为实际代码 entries。 |
| [`jdbc-data-access-layer`](docs/articles/jdbc-data-access-layer.md) | JDBC 分层与数据访问：DAO、Service 与事务边界 | 移除 classroom 路径标识；跨文文章链接已同步。 |
| [`linux-command-basics`](docs/articles/linux-command-basics.md) | Linux 常用命令：文件、权限与网络排查 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`maven-environment-config`](docs/articles/maven-environment-config.md) | Maven 构建配置与 Spring 多环境配置：职责和加载优先级 | 重写标题与摘要，使其直接说明 Maven 构建配置和 Spring 运行配置的职责。 |
| [`mybatis-association-mapping`](docs/articles/mybatis-association-mapping.md) | MyBatis 关联映射：分类文档的一对多与文档标签的多对多 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`mybatis-plus-filter-pagination`](docs/articles/mybatis-plus-filter-pagination.md) | 用 MyBatis-Plus 实现条件筛选和分页查询 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`mybatis-session-mapper-basics`](docs/articles/mybatis-session-mapper-basics.md) | MyBatis Mapper 与 SqlSession：配置、执行与事务边界 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`mysql-basic-crud`](docs/articles/mysql-basic-crud.md) | MySQL DDL、DML 与单表查询 | 移除 notes 路径标识；示例数据库改为 backend_demo，引用同步。 |
| [`mysql-transaction-index-idempotency`](docs/articles/mysql-transaction-index-idempotency.md) | 数据库事务、索引与重复提交问题 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`nacos-service-discovery-config`](docs/articles/nacos-service-discovery-config.md) | Nacos 在微服务中的注册发现与配置管理 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`rabbitmq-consumer-boundary`](docs/articles/rabbitmq-consumer-boundary.md) | RabbitMQ 异步处理的基本流程与消费者边界 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`rag-chunking-vector-search-demo`](docs/articles/rag-chunking-vector-search-demo.md) | RAG 文档切分与向量检索：实现和评估边界 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`rag-document-qa`](docs/articles/rag-document-qa.md) | RAG 文档问答的基本链路：文档、检索与模型 API | 已逐篇审阅；本轮无需修改文章源码。 |
| [`redis-hot-document-cache`](docs/articles/redis-hot-document-cache.md) | 热门文档访问场景下的 Redis 缓存设计 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`redis-ttl`](docs/articles/redis-ttl.md) | Redis TTL 在验证码和临时状态管理中的应用 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`restful-employee-api-design`](docs/articles/restful-employee-api-design.md) | REST 接口设计：资源路径、HTTP 方法与状态码 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`sentinel-flow-control`](docs/articles/sentinel-flow-control.md) | Sentinel 限流实践：规则、入口与降级边界 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`servlet-jsp-request-flow`](docs/articles/servlet-jsp-request-flow.md) | Servlet 与 JSP 请求流程：列表查询、转发和数据绑定 | 移除 classroom 路径标识；站内引用已同步。 |
| [`servlet-tomcat-lifecycle`](docs/articles/servlet-tomcat-lifecycle.md) | Tomcat 与 Servlet：从 URL 映射到生命周期 | 将 Servlet/JSP 示例的内部链接更新到新路由。 |
| [`software-development-workflow-scrum`](docs/articles/software-development-workflow-scrum.md) | 软件开发流程与 Scrum：从需求到迭代反馈 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`spring-mvc-request-flow`](docs/articles/spring-mvc-request-flow.md) | Spring MVC 请求从进入到返回的大致流程 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`spring-security-jwt-flow`](docs/articles/spring-security-jwt-flow.md) | Spring Security 与 JWT 的认证授权流程 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`spring-validation-error-response`](docs/articles/spring-validation-error-response.md) | Spring Boot 接口中的参数校验与统一错误响应 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`stream-api-side-effects`](docs/articles/stream-api-side-effects.md) | Stream API 的常见用法与容易忽略的副作用 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`swagger2-skywalking-observability`](docs/articles/swagger2-skywalking-observability.md) | Swagger 2 接口文档与 SkyWalking 链路追踪：兼容边界 | 已逐篇审阅；本轮无需修改文章源码。 |
| [`vue2-admin-spa-routing`](docs/articles/vue2-admin-spa-routing.md) | Vue 2 单页应用：响应式、路由与请求拦截 | 移除 learning-notes 路径标识；删除重复描述并更新 RBAC 路由。 |

## 培训痕迹与表达清理

- 移除并重构了 `007-java-concurrency-basics.md` 中以“3 月 16–17 日笔记”组织技术概念的段落，以及对 `ThreadPoolExecutor` 的“笔记提及”表述；改为独立技术说明。
- `javascript-dom-events.md` 的笔记式开头已改为技术主题介绍，自查变量名由 `courses` 更正为代码中实际声明的 `entries`。
- `java-collections.md` 删除求职面试语境；全站文章源扫描没有发现“面试问答”“面试题”或面试问答小节。
- 将五篇文章的“项目实践”分类调整为“工程实践”。清理了 `050-rbac-permission-model.md` 中“示例不虚构生产项目经历”的元叙述，改为多租户授权边界说明。
- 针对课堂、课程、实习、培训、具体公司项目、`某公司`/`某项目`、旧 `RuoYi`/`wolf2w` 内容标识做了全文扫描；当前文章正文、元数据和有效导航中没有命中这些培训或具体项目叙述。技术文档中“脱敏”等安全术语保留。

### 旧路由兼容映射

以下源文章路由已改为技术主题名称。每个旧地址在 `docs/public/articles/` 留有 `noindex,follow`、canonical 指向新页并立即跳转的静态页，以保留旧书签和外部链接；旧地址不进入 sitemap。

| 旧路由 | 新路由 |
| --- | --- |
| `clinic-appointment-approval-redacted` | `appointment-approval-state-model` |
| `document-retrieval-platform-redacted` | `document-retrieval-system-design` |
| `git-version-control-classroom` | `git-version-control-basics` |
| `internship-api-collaboration-retro` | `backend-api-collaboration` |
| `wolf2w-course-project-flow` | `content-publishing-service-design` |
| `jdbc-employee-classroom-case` | `jdbc-data-access-layer` |
| `servlet-jsp-webcrud-classroom` | `servlet-jsp-request-flow` |
| `050-ruoyi-rbac-permission-model` | `050-rbac-permission-model` |
| `vue2-admin-learning-notes` | `vue2-admin-spa-routing` |
| `html-css-form-notes` | `html-css-form-and-submission` |
| `javascript-dom-events-notes` | `javascript-dom-events` |
| `java-object-wrapper-notes` | `java-object-wrapper-types` |
| `java-syntax-control-flow-notes` | `java-syntax-control-flow` |
| `mysql-basic-crud-notes` | `mysql-basic-crud` |

## 技术修正与改写对比

- Nginx 路径：原文把 `location /api/` + `proxy_pass http://document_api/` 的后端路径误写为 `/strategies/42`；现在改为 `/documents/42`，并说明不带 URI 的 `proxy_pass` 保留 `/api/` 前缀。
- Spring Boot 转发头：`server.forward-headers-document` 更正为有效配置键 `server.forward-headers-strategy`。
- MySQL 订单明细查询：外层增加 `status = 'PAID'`，避免子查询只筛选用户、外层却同时返回该用户未支付明细。
- JDBC：Connector/J 示例从 26.7.0 更新到 26.10.0，并根据官方兼容说明调整为支持 MySQL Server 8.0 及以上；Hutool 示例从 5.8.34 更新到 5.8.48，并补充发布说明链接。
- Docker：把 `openjdk:17.0.2` 示例基础镜像更新为 `eclipse-temurin:17-jre`，并保留生产镜像应固定版本的说明。
- JVM 导出示例：移除与 `id` 游标扫描条件无关的 `(created_at, id)` 索引，避免误导索引选择。
- 数据库示例：把 `java_sql_lab`、`study` 改为中性的 `backend_demo`，保留表结构和业务逻辑。
- Maven：标题和摘要改为说明 Maven 构建配置与 Spring 运行配置的职责，去除“使用整理”式表达。

版本核对依据： [MySQL Connector/J 26.10 发布说明](https://dev.mysql.com/doc/relnotes/connector-j/en/)、[Hutool 5.8.48 官方发布页](https://github.com/chinabugotech/hutool/releases/tag/5.8.48)、[Nginx proxy 模块文档](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)、[Spring Boot 应用属性](https://docs.spring.io/spring-boot/appendix/application-properties/)。

## 全站复检与线上交叉核对

- 98 篇源文章全部有合法 Front Matter 日期；标题与 H1 不匹配：0；`plan_date` 与内容计划不匹配：0。
- 检查 `docs/` 内 149 个 Markdown 内部链接和资源引用：断链 0。116 个 Markdown 文件的代码围栏配对检查：异常 0。
- 对构建生成的 98 个文章 HTML 页面复扫：缺页 0，面试问答命中 0，培训/项目标识命中 0。
- 文章 Markdown 没有图片或 figure/img 引用，也没有文章目录下的图片资源；因此不存在文章内图片说明待清理项。
- 本地 VitePress sitemap 收录 98 个文章页；14 个旧路由跳转页都生成成功，均不在 sitemap 中。
- 本地 `vitepress preview` 检查了 14 个旧的无扩展名 URL 与 14 个新 URL：旧、新地址均返回 HTTP 200，旧页均包含 `noindex,follow`。
- 推送前核查的线上 sitemap 有 98 个单篇文章 URL，全部返回 HTTP 200；并行读取 98 个页面的结果均成功。页面中未发现培训、实习或面试问答词组，但共享导航/页面数据仍包含 `wolf2w`、`ruoyi` 旧路由标识。
- 推送前线上 `/articles/002-java-class-object` 页面未显示“面试问答”；此前删除的 `/articles/java-backend-learning-route` 返回 404。这是本次授权发布前的线上基线，不代表本次提交后的最终页面状态。
- 构建命令：`npm run docs:build`。结果：VitePress 1.6.4 构建、渲染和 sitemap 生成成功（退出码 0）。唯一警告是有一个压缩后的 JS chunk 超过 500 kB；不影响构建。
- 没有可运行的测试脚本；按要求没有新增或运行测试。运行了站点构建、路由产物、文章清单、日期元数据、链接、标题和围栏检查。
- CRLF 感知的 `git diff --check` 通过，无新增行尾空格问题。

## 尚未解决事项与验收结论

1. 有 44 篇文章的 frontmatter `date` 晚于审计日，范围为 2026-10-27 至 2027-08-24。日期字段目前在文章归档中作为记录日期使用；无法从仓库确认它们代表预排发布、源记录还是其他含义。遵照“不擅自修改日期”的要求，本轮没有改动；时间线验收需确认这些日期的来源与含义后才能判断。
2. 旧路由字符串仍出现在兼容跳转页的文件名/请求地址中，这是为保护旧链接而保留；跳转页本身只有指向新主题页的内容，声明 noindex 并未进入 sitemap。

结论：本地源码的逐篇审计、必要修复和构建验证已完成；文章问答和明显培训正文痕迹已清理，导航、路线图、内容计划与内部链接保持一致。由于未来日期含义仍待确认，时间线验收暂不能判定完全通过。
