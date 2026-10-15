---
title: "JDBC 预编译与 DAO：参数绑定和持久层边界"
date: "2026-11-17"
categories: ["持久层"]
tags: [
  "Java",
  "MySQL",
  "后端基础"
]
description: "用 JDBC 和 PreparedStatement 完成参数绑定、资源关闭与简单 DAO 封装。"
plan_date: "2024-03-15"
phase: "数据库与 Spring 基础"
---

# JDBC 预编译与 DAO：参数绑定和持久层边界

### 文章定位

这篇文章把数据库连接、SQL 参数绑定和 DAO 职责放到一个小型 Java 示例中。代码用环境变量读取连接信息，不包含真实账号、密码或公司项目配置。

### 学习目标

- 了解 JDBC 中 Connection、PreparedStatement 和 ResultSet 的基本职责。
- 用占位符绑定值参数，并通过 try-with-resources 关闭资源。
- 理解 DAO 如何把 SQL 访问细节放在相对明确的边界中。

## 一、为什么学习这个技术

Java 程序需要通过数据库驱动和数据库通信。直接拼接 SQL 字符串容易在引号、类型转换和特殊输入上出错，也会把 SQL 结构与用户输入混在一起。

JDBC 提供一组标准接口。MySQL Connector/J 实现这些接口，使 Java 程序能够连接 MySQL。把一组相关 SQL 放进 DAO，可以让调用方关注要完成的操作，而不是每次都处理连接、语句和结果集细节。

## 二、技术原理

Connection 表示数据库连接；PreparedStatement 表示带参数的 SQL 语句；ResultSet 表示查询结果。SQL 中的问号是值参数占位符，调用 setString、setLong 等方法按位置绑定参数。

参数绑定能避免把值直接拼进 SQL，降低输入被当作 SQL 语法解释的风险。占位符用于值，不能直接替代表名、列名或排序关键字；如果这些结构必须动态变化，应从代码内的白名单中选择。

try-with-resources 会在代码块结束时关闭实现 AutoCloseable 的 JDBC 资源。示例里关闭 ResultSet、PreparedStatement 和 Connection。实际服务通常通过连接池复用连接，不会为每个小操作反复创建物理连接。

## 三、核心代码实现

示例使用 Maven 依赖和 MySQL 8.4 练习库。保存 Java 类为 JdbcDaoDemo.java。将 DB_URL、DB_USER、DB_PASSWORD 配置为环境变量后再运行；连接地址示例为 jdbc:mysql://localhost:3306/blog_demo。

~~~xml
<dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <version>26.7.0</version>
</dependency>
~~~

MySQL 表结构：

~~~sql
CREATE DATABASE IF NOT EXISTS blog_demo;
USE blog_demo;

CREATE TABLE student (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(60) NOT NULL,
    age INT NOT NULL
);
~~~

Java 代码：

~~~java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class JdbcDaoDemo {
    static class Student {
        private final long id;
        private final String name;
        private final int age;

        Student(long id, String name, int age) {
            this.id = id;
            this.name = name;
            this.age = age;
        }

        @Override
        public String toString() {
            return "Student{id=" + id + ", name='" + name + "', age=" + age + "}";
        }
    }

    static class StudentDao {
        long insert(Connection connection, String name, int age) throws SQLException {
            String sql = "INSERT INTO student (name, age) VALUES (?, ?)";
            try (PreparedStatement statement = connection.prepareStatement(
                    sql, Statement.RETURN_GENERATED_KEYS)) {
                statement.setString(1, name);
                statement.setInt(2, age);
                statement.executeUpdate();

                try (ResultSet keys = statement.getGeneratedKeys()) {
                    if (keys.next()) {
                        return keys.getLong(1);
                    }
                    throw new SQLException("数据库没有返回新记录主键");
                }
            }
        }

        Student findById(Connection connection, long id) throws SQLException {
            String sql = "SELECT id, name, age FROM student WHERE id = ?";
            try (PreparedStatement statement = connection.prepareStatement(sql)) {
                statement.setLong(1, id);
                try (ResultSet result = statement.executeQuery()) {
                    if (!result.next()) {
                        return null;
                    }
                    return new Student(
                            result.getLong("id"),
                            result.getString("name"),
                            result.getInt("age"));
                }
            }
        }
    }

    public static void main(String[] args) throws SQLException {
        String url = requiredEnv("DB_URL");
        String user = requiredEnv("DB_USER");
        String password = requiredEnv("DB_PASSWORD");

        StudentDao dao = new StudentDao();
        try (Connection connection = DriverManager.getConnection(url, user, password)) {
            long id = dao.insert(connection, "练习用户", 20);
            Student student = dao.findById(connection, id);
            System.out.println(student);
        }
    }

    private static String requiredEnv(String name) {
        String value = System.getenv(name);
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalStateException("请先设置环境变量 " + name);
        }
        return value;
    }
}
~~~

多次运行会插入多条练习记录，这是示例行为。生产代码通常由连接池管理连接，并将异常转换为调用方能处理的错误；DAO 的方法还需要根据项目规则决定如何表达“记录不存在”。

## 四、真实项目落地

在数据库课程练习中，可以用 DAO 把学生查询和新增语句集中起来，让上层代码不直接拼接 SQL。该代码是通用学习 Demo，不代表曾在企业项目中编写过该模块。

进入 Spring 或 MyBatis 后，连接池、事务管理和映射框架会承担更多通用工作，但理解 JDBC 有助于看懂底层资源边界、参数绑定和 SQL 执行过程。

## 五、遇到的问题

- PreparedStatement 的占位符从 1 开始编号，绑定顺序必须与 SQL 一致。
- 查询结果集在有效生命周期内读取，并及时关闭。
- 参数占位符只能绑定值，不能安全地替代表名或 ORDER BY 字段。
- 连接失败、SQL 执行失败和查无记录是不同情况，不能都用空对象掩盖。
- 示例每次创建新连接只适合演示；服务端应用通常应使用连接池并正确管理事务。

## 六、优化方案

- SQL 与输入值分离，通过 PreparedStatement 绑定参数。
- 使用 try-with-resources 管理连接和语句资源。
- 用 DAO 或仓储边界集中数据访问代码。
- 生产环境从受控配置或密钥服务读取连接凭证，不提交真实密码。
- 根据应用框架使用连接池和事务管理，避免重复造轮子。

## 七、个人思考

JDBC 练习让我看到数据库访问不是一条 SQL 就结束，还包括连接生命周期、参数类型、异常和事务边界。把这些细节放在明确的持久层入口里，后续换成 Spring JDBC 或 MyBatis 时也更容易辨认哪些工作由框架接管。

## 延伸：面试问答

### PreparedStatement 和字符串拼接 SQL 有什么区别？

PreparedStatement 将 SQL 结构与值参数分开绑定，可以正确处理参数类型并降低输入被解释成 SQL 语法的风险；字符串拼接需要自行处理引号和转义，容易产生错误和注入问题。

### 问号占位符可以代替表名吗？

不可以。占位符绑定的是值，不是 SQL 标识符或语法片段。动态列名应由程序使用明确白名单选择。

### 为什么要使用 try-with-resources？

JDBC 资源使用完应关闭。try-with-resources 会在正常或异常离开代码块时执行关闭逻辑，减少资源泄漏风险。

## 参考资料

- [MySQL Connector/J Developer Guide](https://dev.mysql.com/doc/connector-j/en/)
- [Installing Connector/J Using Maven](https://dev.mysql.com/doc/connector-j/en/connector-j-installing-maven.html)
- [Connector/J Compatibility with MySQL and Java Versions](https://dev.mysql.com/doc/connector-j/en/connector-j-versions.html)
- [Java PreparedStatement API](https://docs.oracle.com/en/java/javase/21/docs/api/java.sql/java/sql/PreparedStatement.html)
- [Java JDBC Basics: Using Prepared Statements](https://docs.oracle.com/javase/tutorial/jdbc/basics/prepared.html)