---
title: "MySQL 基础 SQL：从建表到单表查询"
date: "2026-10-16"
categories: ["数据库"]
tags: ["MySQL", "SQL", "数据库基础"]
description: "梳理 MySQL DDL、DML、约束、过滤、排序、分页和聚合的练习顺序。"
plan_date: "2026-10-16"
phase: "数据库与 Spring 基础"
---

# MySQL 基础 SQL：从建表到单表查询

课堂讲了 DDL 建表、DML 增删改和 DQL 查询；下面把零散语句整理为可在**独立练习库**执行的最小流程。表与记录是学习数据，不对应真实公司员工。

## 建表与约束

示例面向 MySQL 8.0/8.4 的 InnoDB。新建一个专门的练习库后执行；若已有同名表，先检查结构，不要在共享环境直接删除数据。`PRIMARY KEY` 唯一标识行，`UNIQUE` 约束工号，`NOT NULL` 限制必填，`DECIMAL` 保存精确金额。

~~~sql
CREATE DATABASE IF NOT EXISTS java_sql_practice
  DEFAULT CHARACTER SET utf8mb4;
USE java_sql_practice;

CREATE TABLE IF NOT EXISTS employee_practice (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    emp_no VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(60) NOT NULL,
    department VARCHAR(40) NOT NULL,
    salary DECIMAL(12, 2) NOT NULL,
    hired_on DATE NOT NULL
) ENGINE=InnoDB;

INSERT INTO employee_practice
    (emp_no, name, department, salary, hired_on)
VALUES
    ('E001', '小林', '技术', 8500.00, '2026-03-01'),
    ('E002', '小陈', '财务', 7200.00, '2026-03-02'),
    ('E003', '小周', '技术', 9300.00, '2026-03-03');
~~~

重复执行 `INSERT` 会触发工号唯一约束；这正好用来观察约束错误。`CREATE TABLE IF NOT EXISTS` 只避免同名建表错误，不检查旧表结构是否与这里相同。

## 增删改与查询

先用 `SELECT` 确认条件再执行 `UPDATE`/`DELETE`，尤其注意 `WHERE`。下面的修改和删除都只作用于指定工号；若希望保留三条初始记录，可以只执行查询部分。

~~~sql
SELECT id, emp_no, name, salary
FROM employee_practice
WHERE department = '技术' AND salary >= 8000.00
ORDER BY salary DESC, id ASC;

SELECT id, name
FROM employee_practice
WHERE name LIKE '小%'
ORDER BY id
LIMIT 2 OFFSET 0;

SELECT department, COUNT(*) AS employee_count,
       SUM(salary) AS salary_total
FROM employee_practice
GROUP BY department
ORDER BY department;

UPDATE employee_practice
SET salary = 8800.00
WHERE emp_no = 'E001';

DELETE FROM employee_practice
WHERE emp_no = 'E003';
~~~

`WHERE` 过滤行，`ORDER BY` 排序，`LIMIT`/`OFFSET` 取页面，聚合函数配合 `GROUP BY` 按部门汇总。分页需要稳定排序，否则数据变化时不同页可能重复或遗漏；大偏移分页还有额外扫描成本，后续可按索引和游标方案评估。

`DELETE` 删除符合条件的行；`DROP TABLE` 删除整张表及其定义，作用范围完全不同。实际应用从 Java 调用 SQL 时，应使用参数绑定，不把用户输入拼进字符串；具体示例见 [JDBC 与 DAO](./011-jdbc-preparedstatement-dao.md)。多表关联和分组报表另见 [表设计与 JOIN](./008-mysql-table-design-joins.md) 和 [分组统计](./062-mysql-grouped-reporting.md)。

### 课堂单表查询的其他条件

3 月 20 日的员工 SQL 练习还反复使用区间、集合、空值与模糊匹配。针对上面的练习表，可分别执行：

~~~sql
SELECT emp_no, name FROM employee_practice
WHERE salary BETWEEN 7000.00 AND 9000.00;

SELECT emp_no, name FROM employee_practice
WHERE emp_no IN ('E001', 'E003');

SELECT emp_no, name FROM employee_practice
WHERE name LIKE '%林%';

SELECT MIN(salary) AS lowest, MAX(salary) AS highest
FROM employee_practice;
~~~

`BETWEEN` 在此包含两端。`LIKE` 的 `%` 表示任意长度字符；前置通配符对普通 B 树索引的使用方式与前缀匹配不同，应结合执行计划判断。检查可空列要用 `IS NULL`，不能写 `= NULL`；例如 [员工课堂案例](./jdbc-employee-classroom-case.md) 的 `bonus` 可为空，可用 `WHERE bonus IS NULL` 找未设置奖金的行。聚合、排序和分页应根据真实需求组合，不把课堂 27 道查询机械复制成 27 篇文章。

## 自查问题

- `salary` 为什么选择 `DECIMAL` 而非课堂原始案例中的 `DOUBLE`？
- `UPDATE` 忘记 `WHERE` 会发生什么？如何用事务与事前查询降低操作风险？
- `WHERE department = '技术'` 与 `HAVING COUNT(*) > 1` 分别在什么阶段筛选？

## 资料与参考

- [MySQL 官方教程](https://dev.mysql.com/doc/refman/8.4/en/tutorial.html)
- [MySQL SELECT](https://dev.mysql.com/doc/refman/8.4/en/select.html)
