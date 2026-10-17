---
title: "MyBatis 入门：从商品 Mapper 到 SqlSession 的一次工作单元"
date: "2026-10-16"
categories: ["持久层"]
tags: ["MyBatis", "MySQL", "Java"]
description: "按课堂商品 CRUD 梳理配置文件、Mapper XML、主键回填和会话提交关闭，并纠正共享 SqlSession 的风险。"
plan_date: "2026-10-16"
phase: "数据库与 Spring 基础"
---

# MyBatis 入门：从商品 Mapper 到 SqlSession 的一次工作单元

`Stream+MyBatis.md` 从商品表开始，逐步写主配置文件、Mapper XML、CRUD 和测试。下面保留这条学习链路，同时把课堂 DAO 长期保存 `SqlSession` 的写法改成每次工作单元独立获取、提交并关闭会话。它是可本地复现的课堂示例，不代表实际企业表结构。

## 版本与准备

示例按 Java 8、MyBatis 3.5.19、MySQL 8.0+ 与 Connector/J 8.4.0 编写。MyBatis 和 JDBC 驱动使用 Maven 坐标 `org.mybatis:mybatis`、`com.mysql:mysql-connector-j`；本例分别固定为上述版本。课堂截图使用的 JAR 版本未在笔记正文中确定，所以这些固定版本是复现条件，不是对原课堂环境的追认。

先在本地练习库执行：

```sql
CREATE TABLE product (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(12, 2) NOT NULL
);
```

Maven 依赖：

```xml
<dependencies>
  <dependency>
    <groupId>org.mybatis</groupId>
    <artifactId>mybatis</artifactId>
    <version>3.5.19</version>
  </dependency>
  <dependency>
    <groupId>com.mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <version>8.4.0</version>
  </dependency>
</dependencies>
```

## 配置到 Mapper 的对应关系

`src/main/resources/mybatis-config.xml` 指向数据源和 Mapper 文件。`${db.url}` 等值由启动代码从环境变量传入，配置文件不保存密码。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE configuration PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "https://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
  <environments default="development">
    <environment id="development">
      <transactionManager type="JDBC"/>
      <dataSource type="POOLED">
        <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
        <property name="url" value="${db.url}"/>
        <property name="username" value="${db.user}"/>
        <property name="password" value="${db.password}"/>
      </dataSource>
    </environment>
  </environments>
  <mappers>
    <mapper resource="demo/ProductMapper.xml"/>
  </mappers>
</configuration>
```

接口 `src/main/java/demo/ProductMapper.java`：

```java
package demo;

public interface ProductMapper {
    int insert(Product product);
    Product findById(Long id);
}
```

`src/main/resources/demo/ProductMapper.xml` 的 `namespace` 必须与接口全限定名一致，语句 `id` 对应接口方法。`useGeneratedKeys` 使用 JDBC 返回的自增主键回填 `id`。`#{}` 是预编译语句的值参数绑定，不是把 Java 字符串直接拼进 SQL。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="demo.ProductMapper">
  <insert id="insert" useGeneratedKeys="true" keyProperty="id">
    INSERT INTO product (name, price) VALUES (#{name}, #{price})
  </insert>
  <select id="findById" resultType="demo.Product">
    SELECT id, name, price FROM product WHERE id = #{id}
  </select>
</mapper>
```

`Product` 使用普通 JavaBean，结果列名与属性名一致：

```java
package demo;

import java.math.BigDecimal;

public class Product {
    private Long id;
    private String name;
    private BigDecimal price;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
}
```

## 执行、提交和关闭

`SqlSessionFactory` 可在应用生命周期内复用；`SqlSession` 不应保存在 DAO 的实例字段中供多个请求共享。它不是线程安全的，并且占用数据库资源。插入与读取作为同一个练习工作单元时，显式提交并在 `try-with-resources` 中关闭：

```java
package demo;

import java.io.InputStream;
import java.math.BigDecimal;
import java.util.Properties;
import org.apache.ibatis.io.Resources;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import org.apache.ibatis.session.SqlSessionFactoryBuilder;

public class App {
    private static String required(String name) {
        String value = System.getenv(name);
        if (value == null || value.isEmpty()) throw new IllegalStateException(name + " 未设置");
        return value;
    }

    public static void main(String[] args) throws Exception {
        Properties properties = new Properties();
        properties.setProperty("db.url", required("DB_URL"));
        properties.setProperty("db.user", required("DB_USER"));
        properties.setProperty("db.password", required("DB_PASSWORD"));

        SqlSessionFactory factory;
        try (InputStream config = Resources.getResourceAsStream("mybatis-config.xml")) {
            factory = new SqlSessionFactoryBuilder().build(config, properties);
        }

        try (SqlSession session = factory.openSession()) {
            ProductMapper mapper = session.getMapper(ProductMapper.class);
            Product product = new Product();
            product.setName("课堂演示商品");
            product.setPrice(new BigDecimal("19.90"));
            mapper.insert(product);
            session.commit();
            Product saved = mapper.findById(product.getId());
            System.out.println(saved.getName());
        }
    }
}
```

运行前设置本地 `DB_URL`（例如指向练习库的 JDBC URL）、`DB_USER`、`DB_PASSWORD`，然后运行 `demo.App`。若插入后抛异常且没有提交，关闭会话时未提交的变更不应当被当成成功结果。生产应用中常由 Spring 与 MyBatis 集成管理 Mapper 和事务，不应再手动把这个示例的会话代码塞进单例 Service。

## 排查顺序与延伸

找不到 Mapper 时，先检查 XML 是否进入 classpath、`namespace` 与接口全限定名是否一致、语句 `id` 是否与方法匹配；字段无法映射时检查列名和 JavaBean 属性。多参数和可选条件查询继续读 [MyBatis 参数映射与动态 SQL](/articles/016-mybatis-dynamic-sql)，对象关系映射见 [MyBatis 关联映射](/articles/mybatis-association-mapping)。

资料依据：本地 `Stream+MyBatis.md` 的商品 CRUD、主配置与 Mapper 示例；主键回填和日志截图只作为辅助核对。会话关闭方式依据 [MyBatis 官方入门](https://mybatis.org/mybatis-3/getting-started.html) 与 [Java API](https://mybatis.org/mybatis-3/java-api.html)。
