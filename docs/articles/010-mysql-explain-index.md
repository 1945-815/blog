---
title: "用 EXPLAIN 理解 MySQL 索引：读懂一条查询计划"
date: "2026-11-10"
categories: ["数据库"]
tags: [
  "MySQL",
  "后端基础"
]
description: "通过联合索引和订单查询练习读取 EXPLAIN 中的 key、rows 与 Extra。"
plan_date: "2024-02-25"
phase: "数据库与 Spring 基础"
---

# 用 EXPLAIN 理解 MySQL 索引：读懂一条查询计划

> **计划公开日期：**2026-11-10　·　**学习阶段参考日期：**2024-02-25　·　**阶段：**数据库与 Spring 基础。参考日期表示学习路线顺序，不代表历史发文。

### 文章定位

这篇文章记录从“给列加索引”转向“根据查询和执行计划验证索引”的学习过程。示例是可复用的练习 SQL，不代表真实线上调优结果或性能指标。

### 学习目标

- 通过 EXPLAIN 查看优化器为查询选择的访问计划。
- 理解联合索引的列顺序和最左前缀。
- 形成添加索引前后比较的验证步骤。

## 一、为什么学习这个技术

查询结果正确，不代表查询方式适合数据量增长后的使用场景。直接给每个字段都建索引也不合适，因为索引占空间，并且插入、更新和删除时需要维护索引。

EXPLAIN 能展示优化器计划，包括可能使用的索引、实际选中的索引和估算扫描行数。它提供判断依据，但不是实际运行耗时的保证。

## 二、技术原理

B-tree 索引按键值组织数据，适合等值、范围和排序等访问方式。联合索引 (user_id, status, created_at) 按列顺序组织键值，通常可以利用 user_id、user_id 加 status，或完整的三列前缀。只按 status 查找时，不能假设该索引与单列 status 索引等价。

当 SQL 对联合索引前面的列使用等值条件，再对后续列使用范围条件时，优化器可能利用相应索引范围。最终是否选用索引取决于统计信息、数据分布、查询代价和版本实现，应查看计划而不是只凭经验判断。

EXPLAIN 中，possible_keys 是候选索引，key 是实际选中的索引，rows 是优化器估计要检查的行数。Extra 补充说明执行方式。rows 是估算值；不同版本、数据规模和统计信息下计划可能不同。

## 三、核心代码实现

下面示例针对 MySQL 8.0+。练习环境可先建表、添加索引，再检查这条查询的计划。

~~~sql
CREATE TABLE order_demo (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at DATETIME NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL
);

CREATE INDEX idx_order_user_status_created
    ON order_demo (user_id, status, created_at);

EXPLAIN
SELECT id, created_at, total_amount
FROM order_demo
WHERE user_id = 42
  AND status = 'PAID'
  AND created_at >= '2026-01-01 00:00:00'
ORDER BY created_at DESC
LIMIT 20;
~~~

阅读结果时可以按顺序检查：

1. table 是否是预期表，type 表示使用哪类访问方式。
2. possible_keys 是否包含设计的联合索引。
3. key 是否选中了该索引，key_len 可辅助判断实际使用了哪些索引列。
4. rows 是估算检查行数，不是查询结果行数，也不是精确扫描计数。
5. Extra 是否显示额外过滤或排序信息，并结合完整查询判断是否合理。

若练习表为空或只有少量数据，优化器可能选择全表扫描，因为扫描少量数据的成本更低。看到 key 为 NULL 不足以单独证明索引设计错误。应加入有代表性的数据、更新统计信息，再观察计划；验证前后使用相同查询条件，并考虑读写成本。

## 四、真实项目落地

数据库基础练习中，可以从常见过滤和排序条件设计候选索引，然后使用 EXPLAIN 检查优化器的选择。这段 SQL 是通用练习，不代表真实订单系统、线上数据或性能提升比例。

在真实服务里还要结合慢查询记录、表规模、数据分布、并发和写入频率。复盘时记录查询条件、索引定义、变更前后的计划和测量方法，避免只留下“加了索引所以变快”的结论。

## 五、遇到的问题

- 小表可能全表扫描更便宜。
- 联合索引列顺序不符合查询条件时，索引未必能按预期缩小范围。
- 给低选择性字段单独建索引不一定有收益。
- 索引可能改善读取，却增加写入维护成本。
- EXPLAIN 的 rows 是估算，不能替代真实负载下的测量。

Extra 中的 Using filesort 表示需要额外排序步骤；名称不等于一定使用磁盘文件，也不能仅凭这一个词断定查询必然很慢。要结合扫描行数、排序规模和实际测量判断。

## 六、优化方案

- 从真实查询形态出发，确认过滤、连接和排序列。
- 依据最左前缀设计联合索引，并检查索引列顺序。
- 添加索引前后分别保存 EXPLAIN 结果，同时测量代表性数据集下的耗时。
- 评估读查询收益和写入维护成本，删除长期无用或重复的索引前先确认依赖。
- 计划和数据都发生变化时重新验证，避免把某次实验的结果推广成固定结论。

## 七、个人思考

索引不是装饰 SQL 的选项，而是为一类访问方式付出的空间和写入成本。EXPLAIN 让我能把“我觉得会走索引”变成一个可检查的计划，再进一步用数据验证它是否真的有帮助。

## 延伸：面试问答

### 联合索引的最左前缀是什么意思？

多列索引通常可以支持从最左侧开始的连续列前缀查找；中间跳过前列后，不能直接假设后面的列仍能按同样方式定位。

### EXPLAIN 的 rows 是什么？

它是优化器估算执行时需要检查的行数，不等于精确实际扫描量，也不代表最终返回行数。

### 为什么建了索引却没有使用？

可能是表很小、条件选择性低、统计信息或数据分布影响了成本估算，也可能查询条件不适配索引列顺序。需要结合计划和数据验证。

## 参考资料

- [MySQL 8.4 Reference Manual: How MySQL Uses Indexes](https://dev.mysql.com/doc/refman/8.4/en/mysql-indexes.html)
- [MySQL 8.4 Reference Manual: Multiple-Column Indexes](https://dev.mysql.com/doc/refman/8.4/en/multiple-column-indexes.html)
- [MySQL 8.4 Reference Manual: EXPLAIN Output Format](https://dev.mysql.com/doc/refman/8.4/en/explain-output.html)
- [MySQL 8.4 Reference Manual: EXPLAIN Statement](https://dev.mysql.com/doc/refman/8.4/en/explain.html)