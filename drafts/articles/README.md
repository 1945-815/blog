# 30 篇文章草稿

本目录保存路线图中的 27 篇完整 Markdown 草稿。另有 3 篇完整文章已放在 `docs/articles/` 并随站点公开。主题顺序与日期来自 `docs/roadmap.md`。

**日期说明：**2026-09-25 是路线图起始日期，当前已晚于该日期。表格中的日期是规划顺序，不表示文章在当天真实发布；已在站点展示的三篇使用实际站点日期，规划日期保存在 `plan_date` 字段。

**发布流程：**草稿目录位于 VitePress 的 `docs/` 之外，不会被自动部署。发布某篇前，请先核对代码和版本、补充本地验证结果、删除 `draft: true` 并复制到 `docs/articles/`，再更新文章列表和侧栏。

项目复盘文章只使用简历可支撑的描述；案例代码是通用示例。不要补写未确认的公司实现、指标、客户数据或生产环境信息。

## 全部主题

| 规划日期 | 文章 | 当前状态 |
|---|---|---|
| 2026-09-25 | [我的 Java 后端学习路线：学过什么，哪些还在实践](001-java-backend-learning-route.md) | 草稿 |
| 2026-10-02 | [Java 集合的选择：List、Set、Map 分别解决什么问题](../../docs/articles/java-collections.md) | 站点文章 |
| 2026-10-09 | [Stream API 的常见用法与容易忽略的副作用](003-stream-api-side-effects.md) | 草稿 |
| 2026-10-16 | [Spring Boot 接口中的参数校验与统一错误响应](004-spring-validation-error-response.md) | 草稿 |
| 2026-10-23 | [Maven 配置文件与多环境配置的使用整理](005-maven-environment-config.md) | 草稿 |
| 2026-10-30 | [Spring MVC 请求从进入到返回的大致流程](006-spring-mvc-request-flow.md) | 草稿 |
| 2026-11-06 | [用 MyBatis-Plus 实现条件筛选和分页查询](007-mybatis-plus-filter-pagination.md) | 草稿 |
| 2026-11-13 | [数据库事务、索引与重复提交问题](008-mysql-transaction-index-idempotency.md) | 草稿 |
| 2026-11-20 | [Redis TTL 在验证码和临时状态管理中的应用](../../docs/articles/redis-ttl.md) | 站点文章 |
| 2026-11-27 | [热门文档访问场景下的 Redis 缓存设计](010-redis-hot-document-cache.md) | 草稿 |
| 2026-12-04 | [Spring Security 与 JWT 的认证授权流程](011-spring-security-jwt-flow.md) | 草稿 |
| 2026-12-11 | [Activiti 7 审批流程：从流程定义到任务处理](012-activiti7-approval-flow.md) | 草稿 |
| 2026-12-18 | [审批状态、任务状态与业务状态如何对应](013-approval-and-business-status.md) | 草稿 |
| 2026-12-25 | [Elasticsearch 标题与内容检索的索引设计](014-elasticsearch-document-search-mapping.md) | 草稿 |
| 2027-01-01 | [用 Canal 同步 MySQL 变更到搜索索引](015-canal-mysql-to-elasticsearch.md) | 草稿 |
| 2027-01-08 | [RabbitMQ 异步处理的基本流程与消费者边界](016-rabbitmq-consumer-boundary.md) | 草稿 |
| 2027-01-15 | [Nacos 在微服务中的注册发现与配置管理](017-nacos-service-discovery-config.md) | 草稿 |
| 2027-01-22 | [Gateway 与 OpenFeign 在服务调用中的分工](018-gateway-openfeign-responsibilities.md) | 草稿 |
| 2027-01-29 | [Sentinel 限流实践：规则、入口与降级边界](019-sentinel-flow-control.md) | 草稿 |
| 2027-02-05 | [用 Docker 搭建本地后端开发环境](020-docker-local-backend-environment.md) | 草稿 |
| 2027-02-12 | [RAG 文档问答的基本链路：文档、检索与模型 API](../../docs/articles/rag-document-qa.md) | 站点文章 |
| 2027-02-19 | [文档切分和向量检索：一个小型 RAG Demo 的实现](022-rag-chunking-vector-search-demo.md) | 草稿 |
| 2027-02-26 | [Codex 和 Cursor 如何辅助接口开发与代码理解](023-ai-coding-tools-workflow.md) | 草稿 |
| 2027-03-05 | [Java 后端项目中的接口文档与安全检查清单](024-api-doc-security-checklist.md) | 草稿 |
| 2027-03-12 | [文档检索服务的接口设计：上传、分类与分页](025-document-search-api-design.md) | 草稿 |
| 2027-03-19 | [评论或举报审批如何接入 Activiti 流程](026-activiti-comment-report-approval.md) | 草稿 |
| 2027-03-26 | [预约和服务订单中的状态流转与重复提交](027-appointment-order-state-idempotency.md) | 草稿 |
| 2027-04-02 | [企业文档检索平台的模块划分与技术选型（脱敏）](028-document-retrieval-platform-redacted.md) | 草稿 |
| 2027-04-09 | [诊所预约与审批平台的业务流程设计（脱敏）](029-clinic-appointment-approval-redacted.md) | 草稿 |
| 2027-04-16 | [从实习项目中复盘接口开发、联调与问题定位](030-internship-api-collaboration-retro.md) | 草稿 |

## 文件约定

- 文件名前缀序号对应路线图顺序。
- 重点文章包含文章定位、学习目标、机制分析、项目追问和面试问答。
- 发布前需本人运行或审阅示例；不能验证的代码应明确标为伪代码或示意。
