---
title: "Java 后端技术地图：语言基础、工程实践与 AI 应用"
date: "2026-10-13"
categories: ["技术路线"]
tags: ["Java", "Spring", "分布式系统", "RAG"]
description: "按技术依赖关系整理 Java 后端、数据系统与 AI 应用的阅读顺序。"
plan_date: "2023-10-20"
phase: "Java 与并发"
---

# Java 后端技术地图：语言基础、工程实践与 AI 应用

Java 后端涉及语言、数据、框架、网络和运行环境。按依赖关系组织这些主题，比把工具名称排成清单更容易形成完整模型：先理解程序如何运行，再连接数据库与 Web 请求，最后讨论分布式协作和生成式 AI。

## 语言与运行时

从类、对象、集合、异常和泛型开始，理解数据如何表达、状态如何保护。继续关注线程安全、线程池、JVM 内存、类加载与日期时间边界。这些概念会反复出现在 Spring 容器、异步任务和问题排查中。

## 请求与持久化

HTTP 方法、请求映射、参数校验和错误响应定义服务接口边界。JDBC 与 MyBatis 展示 Java 对 SQL 的组织方式；MySQL 的索引、事务、隔离级别和执行计划则决定数据读写的正确性与成本。Redis 可以承担缓存和短期状态，但不应取代权威数据存储。

## 服务协作与工程运行

当单个进程的边界不足以满足需求时，再考虑服务发现、网关、声明式调用、消息队列和搜索索引。它们带来超时、重复投递、数据同步、权限传播和故障恢复等新问题。Docker、Linux、Nginx、监控和日志帮助解释程序如何构建、运行与排障。

## AI 应用

RAG 应用可以拆成文档解析、切分、向量化、召回、上下文组装和生成。Spring AI 等框架降低模型调用的接入成本，但不会自动解决权限、检索质量、引用追踪、提示注入或成本控制。Agent 工具调用还要为每个工具设置输入校验与授权边界。

## 阅读和验证方式

阅读每个主题时，可按三个问题推进：核心抽象是什么、一次调用经过哪些边界、失败时留下什么证据。代码示例要注明依赖版本、运行条件和未覆盖的场景；结论以可复现代码和当前官方文档为依据，不把“看过”描述成已经掌握。

站内文章按 [Java 核心](/categories/java)、[Spring 生态](/categories/spring)、[数据库与缓存](/categories/database)、[分布式系统](/categories/microservices) 和 [AI 应用](/categories/ai) 等主题组织。这个页面是阅读地图，不是个人履历时间线。

## 参考资料

- [Oracle Java Documentation](https://docs.oracle.com/en/java/)
- [Spring Boot Reference](https://docs.spring.io/spring-boot/reference/)
- [MySQL Reference Manual](https://dev.mysql.com/doc/refman/8.4/en/)
