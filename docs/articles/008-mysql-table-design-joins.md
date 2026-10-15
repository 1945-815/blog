---
title: "MySQL 表设计与多表查询：从实体关系写 SQL"
date: "2026-11-03"
categories: ["数据库"]
tags: [
  "MySQL",
  "业务设计"
]
description: "用学生、课程和选课关系练习主外键、关系表以及 INNER JOIN 与 LEFT JOIN。"
plan_date: "2024-01-20"
phase: "数据库与 Spring 基础"
---

# MySQL 表设计与多表查询：从实体关系写 SQL

### 文章定位

这篇文章把数据库基础练习中的实体关系和多表查询放在同一个例子里。学生、课程和选课是教学数据，不对应真实客户、公司或业务系统。

### 学习目标

- 从实体和关系推导表结构。
- 用主键、外键和唯一约束表达数据规则。
- 区分 INNER JOIN 与 LEFT JOIN 在结果集上的差异。

## 一、为什么学习这个技术

如果把学生姓名、课程名和成绩都写进同一张表，学生选多门课时姓名会重复，课程名也会重复。名称变更时要更新多行，漏掉某些行就会留下互相矛盾的数据。

把实体和关系分开建模，可以减少重复，并让数据库约束负责拦截一部分无效数据。设计表后再写查询，也更容易判断结果为什么会重复或缺失。

## 二、技术原理

示例包含三个实体关系：

- student 保存学生自身信息。
- course 保存课程自身信息。
- enrollment 表示学生选了哪门课程，并保存该关系上的成绩。

一个学生可以选多门课程，一门课程也可以有多个学生，因此 student 和 course 是多对多关系，需要一张关系表。选课记录用 student_id 与 course_id 组成联合主键，防止同一学生重复选同一门课程。外键要求引用的学生和课程存在。

规范化的目标是减少不必要的重复和更新异常。范式是分析依赖关系的工具，不是要求所有场景都拆成尽可能多的表；查询需求、约束和维护成本仍要一起考虑。

## 三、核心代码实现

下面的 SQL 面向 MySQL 8.0+，可在练习数据库中依次执行。生产库执行 DDL 前应先评估已有数据和迁移方式。

~~~sql
CREATE TABLE student (
    id BIGINT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE course (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE enrollment (
    student_id BIGINT NOT NULL,
    course_id BIGINT NOT NULL,
    score DECIMAL(5, 2),
    PRIMARY KEY (student_id, course_id),
    CONSTRAINT fk_enrollment_student
        FOREIGN KEY (student_id) REFERENCES student (id),
    CONSTRAINT fk_enrollment_course
        FOREIGN KEY (course_id) REFERENCES course (id)
);

INSERT INTO student (id, name) VALUES
    (1, '小林'),
    (2, '小周'),
    (3, '小陈');

INSERT INTO course (id, name) VALUES
    (101, 'Java 基础'),
    (102, '数据库基础');

INSERT INTO enrollment (student_id, course_id, score) VALUES
    (1, 101, 92.00),
    (1, 102, 88.00),
    (2, 101, 81.00);

-- 只看至少选过一门课的学生和课程
SELECT s.name AS student_name, c.name AS course_name, e.score
FROM student AS s
INNER JOIN enrollment AS e ON e.student_id = s.id
INNER JOIN course AS c ON c.id = e.course_id
ORDER BY s.id, c.id;

-- 统计所有学生的选课数，包括尚未选课的学生
SELECT s.id, s.name, COUNT(e.course_id) AS course_count
FROM student AS s
LEFT JOIN enrollment AS e ON e.student_id = s.id
GROUP BY s.id, s.name
ORDER BY s.id;
~~~

INNER JOIN 只返回两侧都能匹配的记录；第二条查询从 student 出发做 LEFT JOIN，所以小陈仍会出现，选课数为 0。这里用 COUNT(e.course_id)，因为未匹配时右侧 course_id 为 NULL，COUNT 不会把它计入。

## 四、真实项目落地

课程数据库练习中，可以先画出学生、课程与选课之间的关系，再将关系映射成表和外键，最后用查询验证数据是否符合预期。上述例子是个人学习 Demo，不代表在职期间设计过选课系统。

实际开发时还要讨论主键策略、删除规则、索引、字段长度、字符集、数据量以及迁移方案。外键是否由数据库强制也要看团队规范，不能只凭一个练习例子套到所有系统。

## 五、遇到的问题

LEFT JOIN 后统计时，如果使用 COUNT(*)，即使右侧没有匹配记录，左侧行仍然存在，计数可能得到 1。统计右表匹配数量时，应该选择右侧非空键，例如 COUNT(e.course_id)。

多表查询重复行不一定是数据库错误，可能是关系本身是一对多。需要先明确结果粒度：每条选课记录一行，还是每个学生一行；再决定是否聚合或去重。

## 六、优化方案

- 主外键字段的数据类型和长度保持一致。
- 为常用连接和筛选条件设计索引，并用执行计划验证。
- 避免用 DISTINCT 掩盖错误的连接条件或错误的结果粒度。
- DDL 变更使用迁移脚本并考虑回滚与存量数据校验。

## 七、个人思考

写查询前先描述“一行结果代表什么”，能帮助我检查连接是否正确。表设计和 SQL 查询是一件事的两面：设计决定数据如何表达，查询检验我们是否理解这些关系。

## 延伸：面试问答

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