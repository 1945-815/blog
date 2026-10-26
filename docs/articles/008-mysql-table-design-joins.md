---
title: "MySQL 表设计与多表查询：从实体关系写 SQL"
date: "2026-11-03"
categories: ["数据库"]
tags: [
  "MySQL",
  "业务设计"
]
description: "用用户、文档与收藏关系说明主外键、中间表以及 INNER JOIN 与 LEFT JOIN 的结果差异。"
plan_date: "2024-01-20"
phase: "Spring 与数据持久化"
---

# MySQL 表设计与多表查询：从实体关系写 SQL

## 问题背景

如果把用户名称、文档标题和收藏时间都放进一张表，同一用户收藏多篇文档时名称会重复，同一文档被多人收藏时标题也会重复。名称变更需要更新多行，遗漏会留下不一致的数据。

把实体和关系分开建模，可以减少重复，并让数据库约束负责拦截一部分无效数据。设计表后再写查询，也更容易判断结果为什么会重复或缺失。

## 核心原理

示例包含三个实体关系：

- user_account 保存用户自身信息。
- document 保存文档自身信息。
- bookmark 表示用户收藏了哪篇文档，并保存关系建立时间。

一个用户可以收藏多篇文档，一篇文档也可以被多个用户收藏，因此用户与文档是多对多关系，需要一张关系表。收藏记录用 user_id 与 document_id 组成联合主键，防止同一用户重复收藏同一文档。外键要求引用的用户和文档存在。

关系表在 Java 对象中如何映射，可继续看 [MyBatis 关联映射](/articles/mybatis-association-mapping)。

规范化的目标是减少不必要的重复和更新异常。范式是分析依赖关系的工具，不是要求所有场景都拆成尽可能多的表；查询需求、约束和维护成本仍要一起考虑。

第二范式检查非主属性是否完全依赖候选键，联合键尤其容易出现只依赖其中一列的字段；第三范式进一步检查非主属性对键的传递依赖。用户名称不依赖收藏关系，应该保留在 `user_account`；收藏时间则属于 `bookmark`。这是该关系模型的取舍，不意味着所有场景都要机械拆表。

## 实现示例

下面的 SQL 面向 MySQL 8.0+，可在独立测试数据库中依次执行。生产库执行 DDL 前应先评估已有数据和迁移方式。

~~~sql
CREATE TABLE user_account (
    id BIGINT PRIMARY KEY,
    display_name VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE document (
    id BIGINT PRIMARY KEY,
    title VARCHAR(200) NOT NULL
);

CREATE TABLE bookmark (
    user_id BIGINT NOT NULL,
    document_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, document_id),
    CONSTRAINT fk_bookmark_user
        FOREIGN KEY (user_id) REFERENCES user_account (id),
    CONSTRAINT fk_bookmark_document
        FOREIGN KEY (document_id) REFERENCES document (id)
);

INSERT INTO user_account (id, display_name) VALUES
    (1, 'Lin'),
    (2, 'Zhou'),
    (3, 'Chen');

INSERT INTO document (id, title) VALUES
    (101, 'Index Design'),
    (102, 'Transaction Boundaries');

INSERT INTO bookmark (user_id, document_id) VALUES
    (1, 101),
    (1, 102),
    (2, 101);

-- 只看至少收藏过一篇文档的用户和文档
SELECT u.display_name, d.title, b.created_at AS bookmarked_at
FROM user_account AS u
INNER JOIN bookmark AS b ON b.user_id = u.id
INNER JOIN document AS d ON d.id = b.document_id
ORDER BY u.id, d.id;

-- 统计所有用户的收藏数，包括尚未收藏文档的用户
SELECT u.id, u.display_name, COUNT(b.document_id) AS bookmark_count
FROM user_account AS u
LEFT JOIN bookmark AS b ON b.user_id = u.id
GROUP BY u.id, u.display_name
ORDER BY u.id;
~~~

INNER JOIN 只返回两侧都能匹配的记录；第二条查询从 user_account 出发做 LEFT JOIN，所以 Chen 仍会出现，收藏数为 0。这里用 COUNT(b.document_id)，因为未匹配时右侧 document_id 为 NULL，COUNT 不会把它计入。

## 应用场景与边界

建模时可以先画出用户、文档与收藏关系，再映射为表和外键，最后用查询验证关联结果。该示例只说明关系结构和 JOIN 语义。

还要结合实际约束讨论主键策略、删除规则、索引、字段长度、字符集、数据量和迁移方案。是否由数据库强制外键取决于系统边界和一致性策略。

## 边界与常见问题

LEFT JOIN 后统计时，如果使用 COUNT(*)，即使右侧没有匹配记录，左侧行仍然存在，计数可能得到 1。统计右表匹配数量时，应选择右侧非空键，例如 `COUNT(b.document_id)`。

多表查询重复行不一定是数据库错误，可能是关系本身是一对多。需要先明确结果粒度：每条收藏关系一行，还是每个用户一行；再决定是否聚合或去重。

## 改进思路

- 主外键字段的数据类型和长度保持一致。
- 为常用连接和筛选条件设计索引，并用执行计划验证。
- 避免用 DISTINCT 掩盖错误的连接条件或错误的结果粒度。
- DDL 变更使用迁移脚本并考虑回滚与存量数据校验。

## 设计取舍与结论

写查询前先定义“一行结果代表什么”，再检查关联是否保持了这个粒度。表设计决定数据如何表达，查询则检验关系是否按预期组合。

## 常见问题

### 多对多关系为什么通常需要中间表？

中间表把两侧的一对多关系分别表达出来，也可以保存关系自身的属性，例如选课成绩或加入时间。

### INNER JOIN 和 LEFT JOIN 有什么区别？

INNER JOIN 只保留匹配行；LEFT JOIN 保留左表全部行，没有匹配时右侧列为 NULL。

### 为什么需要外键？

外键能约束引用关系，防止出现引用不存在记录的值；是否使用数据库外键还要结合系统架构和团队规范评估。

## 参考资料

- [MySQL 8.4 Reference Manual: JOIN Clause](https://dev.mysql.com/doc/refman/8.4/en/join.html)
- [MySQL 8.4 Reference Manual: FOREIGN KEY Constraints](https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html)
- [MySQL 8.4 Reference Manual: InnoDB and Foreign Keys](https://dev.mysql.com/doc/refman/8.4/en/innodb-foreign-key-constraints.html)
