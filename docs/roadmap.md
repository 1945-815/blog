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
