---
title: "MySQL DDL、DML 与单表查询"
date: "2026-10-16"
categories: ["数据库"]
tags: ["MySQL", "SQL", "数据库基础"]
description: "从表结构和约束到增删改查，梳理 MySQL 单表 SQL 的基本语义与常见边界。"
plan_date: "2026-10-16"
phase: "Spring 与数据持久化"
---

# MySQL DDL、DML 与单表查询

下面用目录记录演示建表、约束、增删改查和聚合。示例针对 MySQL 8.x 与 InnoDB，建议在专用数据库中执行；若已存在同名表，先检查结构，不要在共享环境删除数据。

## 建表与约束

~~~sql
CREATE DATABASE IF NOT EXISTS java_sql_lab
  DEFAULT CHARACTER SET utf8mb4;
USE java_sql_lab;

CREATE TABLE IF NOT EXISTS catalog_entry (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    entry_key VARCHAR(40) NOT NULL UNIQUE,
    title VARCHAR(120) NOT NULL,
    category VARCHAR(40) NOT NULL,
    view_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_category_created (category, created_at)
) ENGINE=InnoDB;

INSERT INTO catalog_entry (entry_key, title, category, view_count)
VALUES
    ('guide-001', '索引设计基础', 'database', 12),
    ('guide-002', '事务隔离级别', 'database', 8),
    ('guide-003', '消息确认机制', 'messaging', 5);
~~~

`PRIMARY KEY` 唯一标识行，`UNIQUE` 限制业务键重复，`NOT NULL` 表示必填，`DEFAULT` 提供默认值。`CREATE TABLE IF NOT EXISTS` 只避免同名表错误，不会检查已有表结构是否与定义一致。重复插入相同的 `entry_key` 会触发唯一约束错误。

## 增删改与查询

先用 `SELECT` 检查目标行，再执行更新或删除。下面的写操作按业务键限定范围：

~~~sql
SELECT id, entry_key, title, view_count
FROM catalog_entry
WHERE category = 'database' AND view_count >= 8
ORDER BY view_count DESC, id ASC;

SELECT id, title
FROM catalog_entry
WHERE title LIKE '%事务%'
ORDER BY id
LIMIT 20 OFFSET 0;

UPDATE catalog_entry
SET view_count = view_count + 1
WHERE entry_key = 'guide-001';

DELETE FROM catalog_entry
WHERE entry_key = 'guide-003';
~~~

`WHERE` 过滤行，`ORDER BY` 排序，`LIMIT` 与 `OFFSET` 截取结果。分页需要稳定排序，否则数据变化时翻页可能重复或遗漏；偏移量很大时还会增加扫描成本，可按索引和查询模式考虑游标分页。

`DELETE` 删除符合条件的行；`DROP TABLE` 删除整张表及其定义，影响范围不同。应用从 Java 执行 SQL 时应使用参数绑定，不要把请求值拼进 SQL 字符串。示例见 [JDBC 与 DAO](./011-jdbc-preparedstatement-dao.md) 和 [JDBC 分层与事务边界](./jdbc-employee-classroom-case.md)。

## 条件、聚合与空值

~~~sql
SELECT entry_key, title
FROM catalog_entry
WHERE view_count BETWEEN 5 AND 12;

SELECT entry_key, title
FROM catalog_entry
WHERE entry_key IN ('guide-001', 'guide-003');

SELECT MIN(view_count) AS lowest, MAX(view_count) AS highest,
       AVG(view_count) AS average_count
FROM catalog_entry;

SELECT category, COUNT(*) AS entry_count
FROM catalog_entry
GROUP BY category
HAVING COUNT(*) >= 1
ORDER BY category;
~~~

`BETWEEN` 在此包含两端。`LIKE` 的 `%` 表示任意长度字符；前置通配符与前缀匹配使用普通 B 树索引的方式不同，需结合执行计划判断。判断可空列要用 `IS NULL`，不能写 `= NULL`。`WHERE` 先筛选行，`HAVING` 则筛选分组后的聚合结果。多表关联和聚合报表见[表设计与 JOIN](./008-mysql-table-design-joins.md)和[分组统计](./062-mysql-grouped-reporting.md)。

## 自查问题

- `UPDATE` 忘记 `WHERE` 会发生什么？如何通过事务和事前查询降低误操作风险？
- `WHERE category = 'database'` 与 `HAVING COUNT(*) > 1` 分别在哪个阶段筛选？
- 怎样从执行计划判断过滤和排序是否使用了预期索引？

## 参考资料

- [MySQL 官方教程](https://dev.mysql.com/doc/refman/8.4/en/tutorial.html)
- [MySQL SELECT](https://dev.mysql.com/doc/refman/8.4/en/select.html)
