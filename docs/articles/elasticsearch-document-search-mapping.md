---
title: "Elasticsearch 标题与内容检索的索引设计"
date: "2026-10-13"
categories: ["搜索"]
tags: ["Elasticsearch","Mapping","全文检索"]
description: "结合文档标题和正文设计字段映射、分词与多字段检索。"
plan_date: "2025-07-20"
phase: "分布式与中间件"
---

# Elasticsearch 标题与内容检索的索引设计

## 问题背景

业务列表可用关系数据库筛选，但关键词检索通常需要分析文本、相关性和高亮。搜索索引是面向检索的读模型，需要权衡分析器、字段类型与同步方式。

## 核心原理

text 字段会经过 analyzer 分词，适合全文检索；keyword 保留整体值，适合精确过滤、聚合和排序。标题和正文可以使用不同权重，分类、状态和租户范围应使用结构化字段进行过滤。

## 实现示例

为文档创建明确 mapping：标题和正文用 text，可选 keyword 子字段支持精确场景；分类 id、状态和更新时间使用合适类型。用代表性中文样本观察 analyzer 输出，再设计 match、multi_match 和过滤条件。排序优先使用可排序字段。

```json
PUT documents-v1
{
  "mappings": {"properties": {
    "title": {"type": "text"},
    "content": {"type": "text"},
    "categoryId": {"type": "keyword"},
    "updatedAt": {"type": "date"}
  }}
}
```

### 源码与机制观察

从 mapping、analyzer 和倒排索引三个层次检查问题：字段是否可检索、文本怎样切分、查询是否走预期字段。通过 _analyze API 检查样例分词，再检查 explain 或命中详情理解评分。

写入时 analyzer 将文本转换为 token 并建立倒排索引；查询使用相应分析器将用户输入转换为检索词，再计算相关性。mapping 一旦与字段类型冲突通常不能直接原地更改，需要重建索引并迁移数据。

### 分析器与客户端版本

中文分词需要结合语料和插件选择。IK 插件提供 `ik_max_word` 与 `ik_smart` 等分析器，但目标集群必须安装兼容版本的插件；用代表性文本检查 `_analyze` 结果，不要假设每个集群都已具备相同 analyzer。

Elasticsearch Java 客户端与服务端版本应按官方兼容策略选择；Spring Data Elasticsearch 还需要与 Spring Data 和 Spring Boot 版本匹配。不要只凭某个依赖组合推断另一套环境兼容。组合查询、高亮与“ES 搜 ID、MySQL 回查”的流程见 [bool 查询与高亮](./064-elasticsearch-bool-highlight.md)。相关边界见 [Elasticsearch Java 客户端兼容说明](https://www.elastic.co/docs/reference/elasticsearch/clients/java#_version_compatibility)。

## 应用场景与边界

以公开或自造文档建立小索引，分别查询标题和正文，并用分词分析接口检查检索词的处理结果。

## 边界与常见问题

不能把所有字段都设为 text；全文内容不要默认用于聚合。分页深度和排序需考虑索引规模与产品体验。演示必须说明样本数据与配置，不编造延迟、准确率或容量数字。

## 改进思路

先用代表性文本检查分词和字段映射，再调整权重与过滤条件；映射变更通过重建索引完成。

## 设计取舍与结论

搜索质量从数据模型和分析器开始。用真实代表性文本验证 mapping、分词、过滤和排序，再讨论索引维护。

## 常见问题

### text 与 keyword 区别？

text 面向分析后的全文检索，keyword 保持整体值，常用于精确匹配、聚合或排序。

### 为什么先检查分词？

分析器决定索引和查询中的 token；分词不符合语言内容时，查询结果会偏离预期。

### 字段类型改错怎么办？

通常新建正确 mapping 的索引、重建数据并切换别名或读写目标，而不是期待已有字段自动变类型。




## 参考资料

- [Elasticsearch text fields](https://www.elastic.co/guide/en/elasticsearch/reference/current/text.html)
- [Elasticsearch analysis](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis.html)
