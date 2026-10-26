---
title: "文档检索系统设计：MySQL、Elasticsearch 与 RAG 的边界"
date: "2026-10-13"
categories: ["搜索"]
tags: ["Java 后端", "Elasticsearch", "RAG", "系统设计"]
description: "从文档生命周期和查询需求出发，区分关系数据、全文检索与生成式问答的职责。"
plan_date: "2026-08-19"
phase: "后端工程实践"
---

# 文档检索系统设计：MySQL、Elasticsearch 与 RAG 的边界

文档管理、全文搜索和基于资料的问答解决的是相邻但不同的问题。关系数据库适合保存文档元数据和业务状态；Elasticsearch 提供倒排索引与相关性排序；RAG 将检索到的片段作为生成模型的上下文。把三者的边界说清楚，比单纯堆叠组件更能帮助后续维护。

## 先定义数据事实

可以用一条通用文档记录表示标题、所有者、分类、版本、可见范围、存储位置和处理状态。文件字节通常放在对象存储或受控文件存储中，数据库保存引用与生命周期状态。删除、替换或权限变化时，数据库、文件存储和搜索索引需要有明确的更新策略。

搜索索引是面向查询的读模型，允许从数据库或原始文件重新构建。索引同步存在延迟时，搜索结果可能短暂落后；返回结果前仍应按权威数据校验访问权限，不能把“搜得到”当作“有权读取”。

## 拆分检索与问答链路

```text
文件接收 -> 类型与大小校验 -> 隔离存储 -> 解析与切分
                                      -> 元数据写入
                                      -> 搜索索引更新
查询 -> 权限过滤 -> 关键词/向量召回 -> 重排或上下文组装 -> 可选的模型生成
```

上传接口宜先返回处理状态，再由异步任务解析和建索引，避免长时间占用请求线程。每个阶段记录可重试状态和失败原因，重复消息通过文档 ID 与版本号幂等处理。重新上传时应使用版本或内容哈希区分旧索引，防止新旧内容交错。

全文搜索回答“哪些文档匹配查询”；RAG 还要回答“哪些片段支持生成结果”。因此生成结果应保留来源文档、片段位置和检索分数，并在 UI 中提供可核查的引用。候选文档列表本身并不能证明答案中的每句话都由这些来源支持。

## 权限与数据保护

权限过滤需要尽可能进入召回阶段，以减少未授权片段进入模型上下文的机会；生成前和结果返回前仍应按权威 ACL 再校验。上传内容可能包含恶意指令或隐私信息，解析器和模型调用都应处在明确的数据处理边界内。日志只记录诊断所需的标识与状态，不应复制整段文档内容或令牌。

## 设计取舍

MySQL 与 Elasticsearch 的双写会产生部分成功窗口。可以通过 Outbox、变更日志或可重建索引流程收敛差异，但这些方案都需要定义重试、删除、乱序和版本冲突的处理方式。只有当检索需求确实需要独立搜索能力时，才值得承担额外的同步与运维成本。

进一步阅读：[文档检索 API 设计](/articles/document-search-api-design)、[RAG 文档问答链路](/articles/rag-document-qa)、[Transactional Outbox](/articles/068-transactional-outbox-mysql-rabbitmq)。

## 参考资料

- [Elasticsearch: text fields](https://www.elastic.co/guide/en/elasticsearch/reference/current/text.html)
- [Canal Introduction](https://github.com/alibaba/canal/wiki/Introduction)
- [Spring Security Reference](https://docs.spring.io/spring-security/reference/)
