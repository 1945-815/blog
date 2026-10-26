---
title: "JDBC 分层与数据访问：DAO、Service 与事务边界"
date: "2026-10-16"
categories: ["持久层"]
tags: ["Java", "JDBC", "DAO", "分层设计"]
description: "通过通用记录模型说明 JDBC、DAO 与 Service 的职责，补充参数绑定、事务和分页边界。"
plan_date: "2026-10-16"
phase: "Spring 与数据持久化"
---

# JDBC 分层与数据访问：DAO、Service 与事务边界

JDBC 负责连接数据库并执行 SQL。把 SQL 操作集中在 DAO 中，可以隔离持久化细节；Service 则组织输入校验、多个数据操作及其事务边界。以下用不含个人数据的目录记录说明职责划分。

## 数据模型与查询

`PreparedStatement` 将数据值与 SQL 结构分开，避免通过字符串拼接传入查询条件。表名和列名不能通过占位符绑定；如果排序字段来自请求，应使用代码白名单映射到固定列名。

~~~sql
CREATE TABLE catalog_entry (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    entry_key VARCHAR(40) NOT NULL UNIQUE,
    title VARCHAR(120) NOT NULL,
    category VARCHAR(40) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_category_created (category, created_at)
) ENGINE=InnoDB;

INSERT INTO catalog_entry (entry_key, title, category)
VALUES ('guide-001', '索引设计基础', 'database');

SELECT id, entry_key, title, category
FROM catalog_entry
WHERE entry_key = 'guide-001';
~~~

唯一约束防止业务键重复，联合索引可支持以分类过滤并按创建时间排序的查询。是否需要该索引仍应结合查询频率、选择性和写入成本评估。

## DAO 与 Service 的责任

DAO 负责 SQL、参数绑定、结果映射和资源关闭。Service 负责业务输入规则、操作顺序及结果语义。单条删除可以写成如下方法：

~~~java
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public class CatalogEntryDao {
    public int deleteByKey(Connection connection, String entryKey)
            throws SQLException {
        if (entryKey == null || entryKey.isBlank()) {
            throw new IllegalArgumentException("entryKey must not be blank");
        }

        String sql = "DELETE FROM catalog_entry WHERE entry_key = ?";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, entryKey);
            return statement.executeUpdate();
        }
    }
}
~~~

该方法使用调用方提供的连接，因此事务由调用方控制。`executeUpdate()` 返回受影响行数：0 表示没有匹配记录，不能解释为连接失败。如果一项操作包含多条必须一起成功的 SQL，调用方应关闭自动提交，在全部操作成功后提交，异常时回滚，并在 `finally` 中恢复连接状态或交还连接池。

## 查询、分页与输入边界

查询列表应限制页大小，并使用稳定排序键；大偏移量分页可能需要扫描大量记录，可以根据索引和访问模式评估基于游标的分页。筛选值使用参数绑定。动态排序只能接受有限的排序字段和方向，不能把原始请求拼进 `ORDER BY`。

JDBC 的连接与事务配置见[预编译、DAO 与事务](./011-jdbc-preparedstatement-dao.md)。MySQL 的 DDL、DML 和单表查询见 [MySQL 基础 SQL](./mysql-basic-crud-notes.md)。
