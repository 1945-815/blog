---
title: "用 MyBatis-Plus 实现条件筛选和分页查询"
date: "2026-11-06"
categories: ["持久层"]
tags: [
  "MyBatis-Plus",
  "MySQL",
  "分页"
]
description: "从查询 DTO 到条件构造和分页响应，搭建可控的列表接口查询链路。"
draft: true
plan_date: "2026-11-06"
---

# 用 MyBatis-Plus 实现条件筛选和分页查询

## 文章定位

这篇文章对应路线图中的“持久层”阶段，目标是把概念、实现和验证过程连接起来。内容以个人学习与简历可支撑的实践为边界；没有经过本人环境验证的操作应在发布前补做。

## 学习目标

- 能解释本文核心机制以及它解决的问题。
- 能搭建最小示例，并说明输入、输出和失败路径。
- 能区分通用 Demo、个人练习与实习协作内容。

## 背景与问题

文档和管理列表通常按分类、关键词、状态过滤并分页返回。把所有条件拼成动态 SQL 容易漏掉空值处理，也可能开放不安全的排序参数。

## 核心概念与设计

请求 DTO 只承载查询条件；服务层校验分页范围并组装查询；Mapper 执行数据库查询；响应 DTO 隔离持久化模型。分页插件帮助生成分页 SQL，但总数查询与排序规则仍要按数据库和插件版本验证。

## 实现与运行机制

对可选分类和状态使用条件构造器，仅在值有效时添加 where 条件。页码、页大小设上限；排序字段通过白名单映射为预定义列，不把客户端字符串直接交给 SQL。接口返回 records、total、page、size 等明确信息。

查询条件从 Controller DTO 进入服务层，再被映射成 QueryWrapper 或自定义 SQL。分页拦截器在执行阶段改写查询并可能生成 count 查询。大偏移量分页会增加扫描成本，可根据场景评估基于游标或时间/id 的 seek pagination。

## 源码与机制观察

**源码观察：**检查 MybatisPlusInterceptor 对 Executor 查询的拦截点和分页拦截器如何调整 SQL。插件版本和分页方言会影响配置；分页插件应按官方版本文档设置，并验证 count SQL。

```java
Page<Document> page = new Page<>(safePage, safeSize);
LambdaQueryWrapper<Document> query = Wrappers.lambdaQuery();
query.eq(categoryId != null, Document::getCategoryId, categoryId)
     .orderByDesc(Document::getUpdatedAt);
IPage<Document> result = mapper.selectPage(page, query);
```
## 实践边界与常见问题

空字符串和 null 的语义要统一；条件遗漏可能扩大结果集。实体不宜直接暴露到响应。MyBatis-Plus 分页插件配置随版本变化，拦截器顺序和依赖版本要查官方文档，不能照搬过期配置。

## 高频面试问题

### 排序字段为什么要白名单？

列名不能像普通值一样安全绑定，白名单可以把客户端可选项映射到固定列，降低注入与误排序风险。

### total 为什么可能很贵？

count 查询需要评估过滤条件、索引和数据规模；某些业务可以采用近似、延迟统计或游标分页。

### 什么时候写自定义 SQL？

复杂 join、聚合或特定执行计划需求下，自定义 SQL 更容易明确查询意图并便于分析。

## 项目追问

**追问：**如果把这项技术放进简历所述的文档管理、预约或审批场景，如何说明自己的工作？

**回答思路：**先限定本人实际负责范围，再讲接口边界、数据流、异常路径和验证方法。若内容来自独立 Demo，应直接说明是个人练习，不借用公司项目表述。

## 总结

分页接口要同时约束输入、查询条件、排序和响应模型。框架负责减少重复代码，不能代替 SQL 设计。

## 参考资料

- [MyBatis-Plus 分页插件](https://baomidou.com/plugins/pagination/)
- [MyBatis Dynamic SQL](https://mybatis.org/mybatis-3/dynamic-sql.html)
