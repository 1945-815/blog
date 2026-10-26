# 全站技术博客内容审计记录

## 审计范围与处理原则

- 审查 `docs/articles/` 下 99 篇技术文章（不含归档页 `index.md`），并核对关于页、导航、分类/标签、路线图、站点配置、README、维护说明及文章规划数据。
- 按文章内容和示例语义逐篇调整，保留全部文章和原文件名/slug；旧 URL 中的历史标识保留以维持既有链接。
- `date`、`plan_date`、`content-plan.json` 的 `planDate`、文章 ID 与 slug 均和 `HEAD` 基线一致；文章 Frontmatter 标题、H1、规划标题与日期、主题分类已对齐。
- 文章原有 `phase` 字段在站点中用于主题展示与导航，不代表真实发布阶段；已按技术主题整理，并同步 `content-plan.json` 的 `topic` 与 `docs/roadmap.md`。
- 未提交、推送或部署任何内容。

## 发现的问题与处理

- 教学/培训式标题和段落结构：改为问题背景、原理、实现、边界、验证等按主题组织的章节；删除课程、课堂、作业语境。
- 不可核验的组织、实习或项目叙述：改写为通用技术问题、数据模型和可复现示例，不引入工作经历或性能数据。
- 示例中的业务命名与文章主题不一致：替换为目录记录、文档检索、RBAC 等中性模型，修正跨文档标题与示例引用。
- 代码与版本边界：补充/校准 Connector/J、Spring Cloud Alibaba Nacos、Elasticsearch Java Client、RabbitMQ、Sentinel、MyBatis-Plus 等示例中的版本或适用边界；修正 JDBC Java 8 示例调用和 MyBatis-Plus 实体/SQL 不一致问题。
- 元数据同步：修复 5 个规划标题与文章标题不一致项；重分主题路线图，并核实 99 个 slug、ID、标题和规划日期一一对应。

## 修改统计

按每篇文章最主要的改动归类：

| 类别 | 篇数 | 判定口径 |
| --- | ---: | --- |
| A | 17 | 主体结构、业务语境或关键模型需要整体重构 |
| B | 62 | 需要重写关键章节、代码示例、技术边界或版本说明 |
| C | 20 | 主要调整标题、措辞、章节名或主题元数据 |
| D | 0 | 本次没有文章被完全跳过；逐篇均完成了内容或主题元数据审查 |
| 合计 | 99 | 与文章目录实际数量一致 |

## 逐篇审计台账

“调整重点”按 A/B/C 类别说明本篇主要审查动作；文件名与 URL slug 保留原值。

| 文件 | 当前标题 | 分类 | 调整重点 |
| --- | --- | :---: | --- |
| `002-java-class-object.md` | Java 类和对象：字段、方法与封装 | C | 措辞、章节命名或主题元数据调整 |
| `004-data-structures-basics.md` | 数据结构入门：数组、链表、栈、队列与复杂度 | C | 措辞、章节命名或主题元数据调整 |
| `005-java-exceptions-file-io.md` | Java 异常与文件 IO：把失败路径写清楚 | B | 关键章节、代码一致性或技术边界重构 |
| `007-java-concurrency-basics.md` | Java 多线程起步：共享状态、线程安全与同步 | C | 措辞、章节命名或主题元数据调整 |
| `008-mysql-table-design-joins.md` | MySQL 表设计与多表查询：从实体关系写 SQL | A | 核心场景、数据模型或文章主干重构 |
| `010-mysql-explain-index.md` | 用 EXPLAIN 理解 MySQL 索引：读懂一条查询计划 | B | 关键章节、代码一致性或技术边界重构 |
| `011-jdbc-preparedstatement-dao.md` | JDBC 预编译与 DAO：参数绑定和持久层边界 | B | 关键章节、代码一致性或技术边界重构 |
| `013-spring-ioc-di.md` | Spring IoC 与 DI：对象创建和依赖管理 | C | 措辞、章节命名或主题元数据调整 |
| `015-spring-aop-transactions.md` | Spring AOP 与事务：横切逻辑和事务边界 | C | 措辞、章节命名或主题元数据调整 |
| `016-mybatis-dynamic-sql.md` | MyBatis 参数映射与动态 SQL：完成条件查询 | C | 措辞、章节命名或主题元数据调整 |
| `019-redis-types-ttl.md` | Redis 基础数据结构与 TTL：临时状态和 key 设计 | C | 措辞、章节命名或主题元数据调整 |
| `021-springboot-crud-project.md` | Spring Boot 分层 CRUD 示例：从表结构到分页接口 | A | 核心场景、数据模型或文章主干重构 |
| `043-spring-ai-ollama.md` | Spring AI 与 Ollama：配置和本地模型调用 | B | 关键章节、代码一致性或技术边界重构 |
| `044-elasticsearch-embedding-knn.md` | Embedding 接入 Elasticsearch：dense_vector、KNN 与维度核对 | B | 关键章节、代码一致性或技术边界重构 |
| `045-agent-tool-boundaries.md` | Agent 工具调用：输入校验、权限边界与失败处理 | A | 核心场景、数据模型或文章主干重构 |
| `046-java-polymorphism-interface.md` | 从接口到运行时分派：用多态组织可扩展的 Java 业务 | C | 措辞、章节命名或主题元数据调整 |
| `047-mybatis-query-batch-performance.md` | MyBatis 查询与批量写入性能：识别 N+1 并控制数据库往返 | B | 关键章节、代码一致性或技术边界重构 |
| `048-maven-multi-module.md` | Maven 多模块项目：聚合、依赖管理与团队构建边界 | B | 关键章节、代码一致性或技术边界重构 |
| `049-springboot-auto-configuration.md` | Spring Boot 启动与自动配置：从条件装配到问题诊断 | B | 关键章节、代码一致性或技术边界重构 |
| `050-ruoyi-rbac-permission-model.md` | RBAC 权限模型：角色、菜单与接口授权 | B | 关键章节、代码一致性或技术边界重构 |
| `051-completablefuture-async-orchestration.md` | CompletableFuture 异步编排：线程池隔离、超时与异常边界 | B | 关键章节、代码一致性或技术边界重构 |
| `052-jvm-memory-oom-diagnosis.md` | JVM 内存与 OOM 排查：从运行时区域到堆转储证据 | B | 关键章节、代码一致性或技术边界重构 |
| `053-java-spi-classloader.md` | Java 类加载与 SPI：从类身份到可控的扩展发现 | B | 关键章节、代码一致性或技术边界重构 |
| `054-redis-distributed-lock.md` | Redis 分布式锁实践：租约、唯一标识与数据库兜底 | B | 关键章节、代码一致性或技术边界重构 |
| `055-quartz-scheduled-jobs.md` | Spring 定时任务与 Quartz：从单机触发到多实例调度 | B | 关键章节、代码一致性或技术边界重构 |
| `056-java-reflection-bean-introspection.md` | Java 反射与内省：理解框架如何读取对象属性 | B | 关键章节、代码一致性或技术边界重构 |
| `057-redis-daily-quota-lua.md` | Redis Lua 实现每日点赞配额：把检查和计数放进同一次操作 | B | 关键章节、代码一致性或技术边界重构 |
| `058-nginx-java-load-balancing.md` | Nginx 反向代理与负载均衡：把请求稳妥地交给 Spring Boot | B | 关键章节、代码一致性或技术边界重构 |
| `059-springboot-docker-multistage.md` | Spring Boot 应用容器化发布：从可执行 JAR 到多阶段镜像 | B | 关键章节、代码一致性或技术边界重构 |
| `060-rag-retrieval-evaluation.md` | RAG 检索评估：用黄金问题集定位召回与回答问题 | B | 关键章节、代码一致性或技术边界重构 |
| `061-java-time-zone-boundaries.md` | Java 日期时间处理：用 java.time 解决时区与区间边界 | B | 关键章节、代码一致性或技术边界重构 |
| `062-mysql-grouped-reporting.md` | MySQL 分组统计：从订单明细到分类报表 | B | 关键章节、代码一致性或技术边界重构 |
| `063-gateway-filter-order-timing.md` | Spring Cloud Gateway 过滤器顺序与耗时统计 | B | 关键章节、代码一致性或技术边界重构 |
| `064-elasticsearch-bool-highlight.md` | Elasticsearch bool 查询与高亮：组合过滤条件并返回可展示片段 | B | 关键章节、代码一致性或技术边界重构 |
| `065-linux-springboot-jar-systemd.md` | Linux 上运行 Spring Boot JAR：systemd 管理与故障排查 | B | 关键章节、代码一致性或技术边界重构 |
| `066-java-string-stringbuilder.md` | Java 字符串实践：String 不可变性与 StringBuilder | B | 关键章节、代码一致性或技术边界重构 |
| `067-mysql-innodb-mvcc-consistent-read.md` | MySQL InnoDB MVCC：一致性读与事务快照 | B | 关键章节、代码一致性或技术边界重构 |
| `068-transactional-outbox-mysql-rabbitmq.md` | Transactional Outbox：让 MySQL 写入与 RabbitMQ 事件可靠衔接 | B | 关键章节、代码一致性或技术边界重构 |
| `069-spring-ai-streaming-sse.md` | Spring AI 流式响应：用 WebFlux 与 SSE 逐段返回模型内容 | B | 关键章节、代码一致性或技术边界重构 |
| `070-spring-ai-chat-memory-session.md` | Spring AI 会话记忆：会话隔离、窗口裁剪与 JDBC 持久化 | B | 关键章节、代码一致性或技术边界重构 |
| `071-java-generics-type-erasure.md` | Java 泛型为什么不能随便强转：类型擦除、通配符与分页 DTO | B | 关键章节、代码一致性或技术边界重构 |
| `072-bigdecimal-money-rounding.md` | BigDecimal 金额计算：从舍入规则到分摊尾差 | B | 关键章节、代码一致性或技术边界重构 |
| `073-springboot-file-upload-quarantine.md` | Spring Boot 文件上传：大小校验、隔离存储与失败补偿 | B | 关键章节、代码一致性或技术边界重构 |
| `074-elasticsearch-pit-search-after.md` | Elasticsearch 深分页：用 PIT 与 search_after 稳定翻页 | B | 关键章节、代码一致性或技术边界重构 |
| `075-redis-persistence-recovery.md` | Redis 持久化与恢复：RDB、AOF 和缓存重建的边界 | B | 关键章节、代码一致性或技术边界重构 |
| `097-spring-ai-mcp-client-server.md` | Spring AI MCP：用标准协议连接 Java 工具服务 | C | 措辞、章节命名或主题元数据调整 |
| `098-spring-ai-multi-agent-patterns.md` | 多智能体协同的几种编排模式：路由、串联、并行与评估 | C | 措辞、章节命名或主题元数据调整 |
| `099-hutool-java-utilities.md` | Hutool 常用工具类：字符串、标识符与 JSON | C | 措辞、章节命名或主题元数据调整 |
| `activiti-comment-report-approval.md` | 评论或举报审批如何接入 Activiti 流程 | B | 关键章节、代码一致性或技术边界重构 |
| `activiti7-approval-flow.md` | Activiti 7 审批流程：从流程定义到任务处理 | C | 措辞、章节命名或主题元数据调整 |
| `ai-coding-tools-workflow.md` | Codex 和 Cursor 如何辅助接口开发与代码理解 | B | 关键章节、代码一致性或技术边界重构 |
| `api-doc-security-checklist.md` | Java 后端项目中的接口文档与安全检查清单 | B | 关键章节、代码一致性或技术边界重构 |
| `appointment-order-state-idempotency.md` | 预约和服务订单中的状态流转与重复提交 | B | 关键章节、代码一致性或技术边界重构 |
| `approval-and-business-status.md` | 审批状态、任务状态与业务状态如何对应 | B | 关键章节、代码一致性或技术边界重构 |
| `bloom-filter-fundamentals.md` | 布隆过滤器入门：用概率结构拦截不存在的数据 | B | 关键章节、代码一致性或技术边界重构 |
| `canal-mysql-to-elasticsearch.md` | 用 Canal 同步 MySQL 变更到搜索索引 | B | 关键章节、代码一致性或技术边界重构 |
| `clinic-appointment-approval-redacted.md` | 预约与审批的状态建模：业务状态、任务状态与幂等 | A | 核心场景、数据模型或文章主干重构 |
| `dau-mau-metrics.md` | DAU 与 MAU：先统一活跃口径，再看留存和频率 | B | 关键章节、代码一致性或技术边界重构 |
| `docker-local-backend-environment.md` | 用 Docker 搭建本地后端开发环境 | B | 关键章节、代码一致性或技术边界重构 |
| `document-retrieval-platform-redacted.md` | 文档检索系统设计：MySQL、Elasticsearch 与 RAG 的边界 | A | 核心场景、数据模型或文章主干重构 |
| `document-search-api-design.md` | 文档检索服务的接口设计：上传、分类与分页 | B | 关键章节、代码一致性或技术边界重构 |
| `elasticsearch-document-search-mapping.md` | Elasticsearch 标题与内容检索的索引设计 | B | 关键章节、代码一致性或技术边界重构 |
| `gateway-openfeign-responsibilities.md` | Gateway 与 OpenFeign 在服务调用中的分工 | B | 关键章节、代码一致性或技术边界重构 |
| `git-version-control-classroom.md` | Git 版本控制：工作区、暂存与分支合并 | C | 措辞、章节命名或主题元数据调整 |
| `html-css-form-notes.md` | HTML 与 CSS 入门：表格、表单和提交方式 | C | 措辞、章节命名或主题元数据调整 |
| `internship-api-collaboration-retro.md` | 后端接口协作：契约、联调与问题定位 | A | 核心场景、数据模型或文章主干重构 |
| `java-backend-learning-route.md` | Java 后端技术地图：语言基础、工程实践与 AI 应用 | A | 核心场景、数据模型或文章主干重构 |
| `java-collections.md` | Java 集合的选择：List、Set、Map 分别解决什么问题 | B | 关键章节、代码一致性或技术边界重构 |
| `java-design-patterns-overview.md` | Java 设计模式总览：按创建、结构与行为梳理 | C | 措辞、章节命名或主题元数据调整 |
| `java-lambda-functional-interface.md` | Java Lambda、函数式接口与方法引用：以目录项筛选为例 | A | 核心场景、数据模型或文章主干重构 |
| `java-object-wrapper-notes.md` | Object 与包装类：判等、装箱和类型转换 | C | 措辞、章节命名或主题元数据调整 |
| `java-syntax-control-flow-notes.md` | Java 基础语法：变量、输入与流程控制 | C | 措辞、章节命名或主题元数据调整 |
| `javascript-dom-events-notes.md` | JavaScript 基础与 DOM：用事件更新页面 | B | 关键章节、代码一致性或技术边界重构 |
| `jdbc-employee-classroom-case.md` | JDBC 分层与数据访问：DAO、Service 与事务边界 | A | 核心场景、数据模型或文章主干重构 |
| `linux-command-basics.md` | Linux 常用命令：文件、权限与网络排查 | A | 核心场景、数据模型或文章主干重构 |
| `maven-environment-config.md` | Maven 配置文件与多环境配置的使用整理 | C | 措辞、章节命名或主题元数据调整 |
| `mybatis-association-mapping.md` | MyBatis 关联映射：分类文档的一对多与文档标签的多对多 | A | 核心场景、数据模型或文章主干重构 |
| `mybatis-plus-filter-pagination.md` | 用 MyBatis-Plus 实现条件筛选和分页查询 | B | 关键章节、代码一致性或技术边界重构 |
| `mybatis-session-mapper-basics.md` | MyBatis Mapper 与 SqlSession：配置、执行与事务边界 | B | 关键章节、代码一致性或技术边界重构 |
| `mysql-basic-crud-notes.md` | MySQL DDL、DML 与单表查询 | A | 核心场景、数据模型或文章主干重构 |
| `mysql-transaction-index-idempotency.md` | 数据库事务、索引与重复提交问题 | B | 关键章节、代码一致性或技术边界重构 |
| `nacos-service-discovery-config.md` | Nacos 在微服务中的注册发现与配置管理 | B | 关键章节、代码一致性或技术边界重构 |
| `rabbitmq-consumer-boundary.md` | RabbitMQ 异步处理的基本流程与消费者边界 | B | 关键章节、代码一致性或技术边界重构 |
| `rag-chunking-vector-search-demo.md` | RAG 文档切分与向量检索：实现和评估边界 | B | 关键章节、代码一致性或技术边界重构 |
| `rag-document-qa.md` | RAG 文档问答的基本链路：文档、检索与模型 API | B | 关键章节、代码一致性或技术边界重构 |
| `redis-hot-document-cache.md` | 热门文档访问场景下的 Redis 缓存设计 | B | 关键章节、代码一致性或技术边界重构 |
| `redis-ttl.md` | Redis TTL 在验证码和临时状态管理中的应用 | B | 关键章节、代码一致性或技术边界重构 |
| `restful-employee-api-design.md` | REST 接口设计：资源路径、HTTP 方法与状态码 | A | 核心场景、数据模型或文章主干重构 |
| `sentinel-flow-control.md` | Sentinel 限流实践：规则、入口与降级边界 | B | 关键章节、代码一致性或技术边界重构 |
| `servlet-jsp-webcrud-classroom.md` | Servlet 与 JSP 请求流程：列表查询、转发和数据绑定 | A | 核心场景、数据模型或文章主干重构 |
| `servlet-tomcat-lifecycle.md` | Tomcat 与 Servlet：从 URL 映射到生命周期 | C | 措辞、章节命名或主题元数据调整 |
| `software-development-workflow-scrum.md` | 软件开发流程与 Scrum：从需求到迭代反馈 | B | 关键章节、代码一致性或技术边界重构 |
| `spring-mvc-request-flow.md` | Spring MVC 请求从进入到返回的大致流程 | C | 措辞、章节命名或主题元数据调整 |
| `spring-security-jwt-flow.md` | Spring Security 与 JWT 的认证授权流程 | B | 关键章节、代码一致性或技术边界重构 |
| `spring-validation-error-response.md` | Spring Boot 接口中的参数校验与统一错误响应 | B | 关键章节、代码一致性或技术边界重构 |
| `stream-api-side-effects.md` | Stream API 的常见用法与容易忽略的副作用 | B | 关键章节、代码一致性或技术边界重构 |
| `swagger2-skywalking-observability.md` | Swagger 2 接口文档与 SkyWalking 链路追踪：兼容边界 | A | 核心场景、数据模型或文章主干重构 |
| `vue2-admin-learning-notes.md` | Vue 2 单页应用：响应式、路由与请求拦截 | A | 核心场景、数据模型或文章主干重构 |
| `wolf2w-course-project-flow.md` | 微服务中的内容发布链路：服务边界、互动统计与搜索同步 | A | 核心场景、数据模型或文章主干重构 |

## 验证记录

- `npm run docs:build`：通过。VitePress 构建并渲染 118 个 HTML 页面；包含 99 篇文章路由和归档页。Rollup 提示存在超过 500 KB 的压缩 JS 分块，未阻断构建。
- 构建产物本地链接扫描：检查 14,272 个同站 `href`/`src` 引用（含片段锚点），未发现缺失目标；渲染页面可见文本的禁用语境扫描为 0 命中。外部链接未做全站可达性探测。
- 日期/规划元数据比对：99 篇文章的 `date`、`plan_date`、`planDate`、ID 和 slug 与基线一致；当前文章标题、H1、规划标题、主题和规划日期一致。`git -c core.whitespace=cr-at-eol diff --check` 没有空白错误。
- 关键词复查：未发现课程、课堂、培训、教师/学员、实习经历或“项目真实落地”等培训叙述残留。业务词如订单、预约、商品只保留为通用技术场景。旧 slug 中的历史词保留仅为 URL 兼容。
- `package.json` 未配置独立单元/集成测试脚本。使用 JDK 17 编译了 14 个自包含 Java 示例，0 个编译失败；`ClassObjectDemo`、`DateMigrationDemo` 和 `GenericPageDemo` 也已运行并正常退出。需要数据库、Redis、消息代理或模型服务的片段没有在真实依赖环境运行。
- 本地预览服务可启动，但桌面自动化工具未能可靠确认浏览器当前 URL，按其规则停止了 UI 操作；因此没有完成实际浏览器及移动端宽度验收。

## 最终状态

内容重构、主题与元数据同步、全站构建和静态内链扫描已完成。没有发布或部署。实际浏览器交互和窄屏视觉检查尚未完成；超过 500 KB 的 JS 分块构建警告仍存在。
