---
title: 智文知识管理平台
description: 文档管理、全文检索和 RAG 智能问答项目经历与技术复盘。
---

# 智文知识管理平台

## 项目背景

面向企业内部知识管理场景，集文档管理、全文检索和智能问答于一体。

## 系统功能

- 文档上传、发布、分类管理与评论回复。
- Redis 热门文档统计缓存。
- Spring Security + JWT 身份认证与权限控制。
- Elasticsearch 多字段全文检索。
- Canal + RabbitMQ 异步索引同步。
- Embedding、DeepSeek API 和 RAG 智能问答相关建设。

## 技术栈

Spring Cloud Alibaba、MyBatis-Plus、MySQL、Redis、Elasticsearch、RabbitMQ、Canal，以及 Embedding、DeepSeek API 和 RAG 相关能力。

## 概念性技术流向

> 以下是根据简历列出的技术与功能绘制的概念示意，不代表实际生产环境拓扑或服务拆分。

```text
文档管理与评论 → MySQL
                    ├─ Redis：热门文档统计缓存
                    └─ Canal → RabbitMQ → Elasticsearch：异步索引同步

文档内容 → Embedding → 检索上下文 → DeepSeek API：RAG 智能问答
```

## 本人职责

- 参与文档上传、发布、分类、评论回复等业务功能建设。
- 参与 Redis 热门文档统计缓存。
- 参与 Spring Security + JWT 身份认证与权限控制。
- 参与 Elasticsearch 多字段全文检索和 Canal + RabbitMQ 异步索引同步。
- 参与 Embedding、DeepSeek API 与 RAG 智能问答相关建设。

## 核心技术问题与实现思路

### 文档更新与搜索索引同步

项目涉及 Canal、RabbitMQ 和 Elasticsearch。复盘时可以围绕“数据库变更如何可靠传播到搜索索引”说明异步链路的职责边界，再讨论消息重复、消费失败与索引重建等问题。具体重试策略、消息确认方式与生产拓扑需要以实际项目经历为准。

### RAG 智能问答链路

根据项目经历，可以介绍 Embedding、检索上下文与 DeepSeek API 在问答流程中的分工，并说明检索结果如何为生成阶段提供参考。具体分块参数、向量库配置和评估指标未在当前简历摘要中提供，因此页面不填写具体数值。

## 面试中可以展开

- 如何区分文档主数据、缓存和搜索索引的职责。
- 异步索引更新有哪些失败窗口，如何验证最终一致性。
- RAG 检索内容如何进入模型上下文，如何检查回答是否有依据。
- Spring Security 与 JWT 如何参与认证和权限控制。

## 资料边界

以上职责根据当前提供的简历摘要整理。架构图是概念性示意；页面不包含企业源代码、内部数据、真实接口地址或未经核实的生产指标。
