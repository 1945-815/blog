---
title: "用 Canal 同步 MySQL 变更到搜索索引"
date: "2026-10-13"
categories: ["数据同步"]
tags: ["Canal","MySQL","Elasticsearch"]
description: "说明从数据库变更日志到搜索文档更新的异步同步链路和恢复边界。"
plan_date: "2026-07-08"
phase: "后端工程实践"
---

# 用 Canal 同步 MySQL 变更到搜索索引

## 问题背景

关系数据库承担业务写入，Elasticsearch 提供文本搜索，两份数据需要保持最终可用的一致视图。同步延迟和失败是设计的一部分，而非偶发噪声。

## 核心原理

Canal 模拟 MySQL 从库协议订阅 binlog 事件，消费者解析变更后按主键更新、删除或重建搜索文档。数据库是业务事实源，搜索索引可从事实数据重建；同步必须处理重放和重复事件。

## 实现示例

先限定要订阅的库表与字段，再将事件转成领域变更消息；消费者按主键幂等 upsert 文档，对删除事件执行 delete。失败事件记录位置、异常和重试状态，必要时依据业务表做定期核对或全量重建。

```java
// 伪代码：按主键执行幂等写入
switch (event.type()) {
  case INSERT, UPDATE -> searchIndex.upsert(event.primaryKey(), loadCurrentRow(event));
  case DELETE -> searchIndex.delete(event.primaryKey());
}
```

### 源码与机制观察

重点检查 binlog row image、订阅过滤、消费位点和确认机制。以相同主键重复消费、删除后重放、ES 暂时不可用作为故障演练，观察数据最终如何收敛。

MySQL 提交事务后写入 binlog；Canal 获取变更并交给客户端消费。消费位点与 ES 写入的确认顺序决定崩溃时可能重放或遗漏，通常需要接受至少一次投递并让消费端幂等。跨系统不存在普通数据库事务。

## 重试与重复事件

如果在 Canal 之后增加 RabbitMQ，发布确认和消费确认分别覆盖 broker 接收、消费者处理等不同阶段，仍不能组成数据库、消息队列和 Elasticsearch 之间的原子事务。消费者在 ES 已写入、消息尚未确认时崩溃，消息可能再次投递；应以稳定文档 ID 做幂等写入。

Redis ZSet 可以用于安排带时间戳的待重试任务，但它本身不会解决数据库到 Redis、Redis 到 RabbitMQ 之间的原子性问题。若重试记录写入与消息发布之间没有可靠协调，仍可能丢失或重复。应明确重试状态的持久化、最大重试次数、退避策略、过期清理和告警；对于需要可靠提交边界的业务，可评估数据库 Outbox，并用可重放事件驱动索引更新。

若事件可能乱序，按主键覆盖仍可能让旧版本覆盖新数据。可使用递增版本号或更新时间条件保护写入，也可以重新读取数据库当前状态后生成索引文档。确认机制见 [RabbitMQ 消费者边界](./rabbitmq-consumer-boundary.md)。



## 边界与常见问题

不要假设收到事件就代表 ES 已成功更新；删除事件和字段为空的语义要区分。事件堆积需要监控，恢复位点、全量重建和版本兼容都要有说明。

## 改进思路

按业务主键幂等更新搜索文档，处理删除和重放；监控消费积压并准备全量重建方案。

## 设计取舍与结论

Canal 到 ES 是异步读模型同步问题。可靠性依赖幂等消费、位点管理、失败重试、监控和可重建能力。

## 常见问题

### 为什么不在业务事务里直接双写 ES？

数据库与 ES 通常没有共同事务，直接双写会产生部分成功；异步日志链路可以降低请求耦合并支持重试。

### 重复事件怎么处理？

以业务主键作为文档 id，执行幂等覆盖或删除；若事件可能乱序，还需设计版本或时间戳保护。

### Canal 同步能做到强一致吗？

常见方案提供异步最终一致；读后立即搜索可能暂时看不到新数据，需要产品级一致性预期。




## 参考资料

- [Canal Introduction](https://github.com/alibaba/canal/wiki/Introduction)
- [Elasticsearch Index API](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-index_.html)
