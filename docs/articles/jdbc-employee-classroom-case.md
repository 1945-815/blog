---
title: "员工信息管理：原生 JDBC 课堂案例的分层与边界"
date: "2026-10-16"
categories: ["持久层"]
tags: ["Java", "JDBC", "DAO", "课堂练习"]
description: "梳理员工管理练习中的表、菜单、DAO 与 Service 流程，并指出旧示例在口令和金额类型上的改进点。"
plan_date: "2026-10-16"
phase: "数据库与 Spring 基础"
---

# 员工信息管理：原生 JDBC 课堂案例的分层与边界

这是一份**课堂综合案例复盘**，依据需求、SQL 正文和代码截图整理。现有材料没有证明该系统用于公司生产环境，也没有独立源码仓库可供完整复现；以下只写可核验的课堂范围。截图中的实现细节不直接当作运行通过的源码发布。

## 课堂需求与数据流

资料明确列出登录校验，以及员工信息的添加、删除、修改、全部查询、关键字搜索、部门查询、分页和排序菜单。课堂推荐的分层顺序是：建表与初始化 → JavaBean → `db.properties`/JDBC 工具类 → DAO 接口与实现 → Service → 菜单或测试入口。

以“按工号删除”为例，菜单读取工号，Service 检查参数并调用 DAO；DAO 使用 `PreparedStatement` 按工号查找和删除；Service 根据影响行数返回“已删除”或“未找到”。如果删除前还要确认员工信息，应先查询并向用户展示，再执行删除。查询和删除之间仍可能被其他操作改变，真正需要一致性时要定义事务与并发策略。

原始课堂 SQL 建有 `employee` 表，含自增 ID、员工工号、姓名、账号、邮箱、部门、薪资和奖金等字段；菜单与 DAO/Service 截图覆盖了上述操作。**原始练习把口令明文写入表，并用 `DOUBLE` 保存薪资。**这两点只作为理解课堂代码的历史事实，不能复制为新的安全或财务示例。下面给出缩小后的练习表，保留员工 CRUD 所需字段，金额改为 `DECIMAL`；登录设计另行处理：

~~~sql
CREATE TABLE employee_case_practice (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    emp_no VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(60) NOT NULL,
    department_no BIGINT NOT NULL,
    salary DECIMAL(12, 2) NOT NULL,
    bonus DECIMAL(12, 2),
    KEY idx_department_no (department_no)
) ENGINE=InnoDB;

INSERT INTO employee_case_practice
    (emp_no, name, department_no, salary, bonus)
VALUES ('E001', '课堂示例', 2, 8500.00, NULL);

SELECT id, emp_no, name, salary
FROM employee_case_practice
WHERE emp_no = 'E001';
~~~

此表名和字段是为说明改进点编写的**独立练习方案**，不是对原始课堂 SQL 的逐字复刻。请在单独练习库执行；[MySQL 基础 SQL](./mysql-basic-crud-notes.md) 使用另一张表讲查询。

## DAO 与 Service 的责任

DAO 负责 SQL、参数绑定、结果映射与资源关闭；Service 负责输入规则、操作顺序和业务结果。若一项操作包含多条必须一起成功的 SQL，事务边界应覆盖整个操作，不要在 DAO 的每一步各自新开连接并自动提交。JDBC 的连接与事务示例见 [预编译、DAO 与事务](./011-jdbc-preparedstatement-dao.md)。

~~~java
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public class EmployeeDeleteDemo {
    static int deleteByEmpNo(Connection connection, String empNo)
            throws SQLException {
        if (empNo == null || empNo.trim().isEmpty()) {
            throw new IllegalArgumentException("工号不能为空");
        }
        String sql = "DELETE FROM employee_case_practice WHERE emp_no = ?";
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            statement.setString(1, empNo);
            return statement.executeUpdate();
        }
    }
}
~~~

此代码是从课堂 DAO 思路提炼出的**方法示例**，由调用方提供连接，不能直接独立运行。`executeUpdate()` 返回影响行数；0 表示当前没有匹配行，不能当成数据库连接失败。查询所有和分页还应限制页大小，排序列由代码白名单决定，不能让用户输入直接成为 `ORDER BY` 的 SQL 片段。

## 登录练习的安全边界

课堂要求“账号、密码、验证码校验”，但笔记没有足够证据确认最终是否实现了口令哈希、验证码生命周期与防重放。若今后把练习扩展为真实登录，至少应采用受维护的密码哈希方案、服务端验证码校验与过期机制，并避免在日志中输出凭据。这里不把上述改进写成已经完成的课堂功能。

## 资料与后续核验

- 本篇没有加入未核实的运行截图、项目周期、本人负责范围或性能数字。
