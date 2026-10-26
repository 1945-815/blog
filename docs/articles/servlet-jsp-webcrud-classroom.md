---
title: "Servlet 与 JSP 请求流程：列表查询、转发和数据绑定"
date: "2026-10-16"
categories: ["Java 基础"]
tags: ["Java Web", "Servlet", "JSP", "JDBC"]
description: "用列表查询说明 Servlet 参数处理、请求转发、JSP EL/JSTL 与 JDBC 数据访问。"
plan_date: "2026-10-16"
phase: "Web 基础"
---

# Servlet 与 JSP 请求流程：列表查询、转发和数据绑定

Servlet/JSP 商品管理示例把 `HttpServletRequest/Response`、转发、重定向、Session 与 JSP 和商品增删改查、分页、筛选连起来。为单独看清请求到页面的数据流，下面的列表查询用小型 JDBC DAO 演示，写操作使用 MyBatis。运行环境沿用 [Tomcat 与 Servlet 入门](/articles/servlet-tomcat-lifecycle) 的 **JDK 8、Tomcat 9、`javax.servlet`**；JSP 循环标签还需要与该栈匹配的 JSTL 1.2 依赖。

在 WAR 项目的依赖中加入：

```xml
<dependency>
  <groupId>javax.servlet</groupId>
  <artifactId>jstl</artifactId>
  <version>1.2</version>
</dependency>
```

## 请求和页面的职责

浏览器请求 `/products?page=1&keyword=手机`，Servlet 从 `HttpServletRequest` 读取参数并调用 DAO；DAO 只查数据库，不直接写 HTML；Servlet 把结果放在 request 作用域并转发到 `/WEB-INF/views/products.jsp`。JSP 通过 EL 读取属性，再用 JSTL 遍历。这样的层次与后来的 MVC 思路相通，但此处仍是传统 Servlet/JSP 项目。

转发发生在服务器内部，地址栏仍是 `/products`，同一个 request 的属性可被 JSP 读取，而且 JSP 可以放在浏览器不能直接访问的 `/WEB-INF`。重定向则让浏览器发起新请求，适合提交成功后跳到列表；原 request 的属性不会自动进入新请求。Session 可保存跨请求状态，但不要把分页结果或大对象长期放入 Session。

## 商品列表的最小数据流

数据表可使用以下结构，插入少量测试数据后检查分页：

```sql
CREATE TABLE product (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(12, 2) NOT NULL
);
```

DAO 用同一组筛选条件执行总数查询和分页查询。`keyword` 是值参数，不拼接到 SQL；`LIMIT` 的数值也由 Servlet 先做范围校验。

```java
package demo;

import java.math.BigDecimal;

public class Product {
    private final long id;
    private final String name;
    private final BigDecimal price;
    public Product(long id, String name, BigDecimal price) {
        this.id = id; this.name = name; this.price = price;
    }
    public long getId() { return id; }
    public String getName() { return name; }
    public BigDecimal getPrice() { return price; }
}
```

```java
package demo;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class ProductDao {
    private final Connection connection;
    public ProductDao(Connection connection) { this.connection = connection; }

    public List<Product> findPage(String keyword, int offset, int size) throws SQLException {
        String sql = "SELECT id, name, price FROM product "
                   + "WHERE name LIKE ? ORDER BY id LIMIT ? OFFSET ?";
        List<Product> rows = new ArrayList<>();
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, "%" + keyword + "%");
            ps.setInt(2, size);
            ps.setInt(3, offset);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    rows.add(new Product(rs.getLong("id"), rs.getString("name"),
                                         rs.getBigDecimal("price")));
                }
            }
        }
        return rows;
    }

    public long count(String keyword) throws SQLException {
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT COUNT(*) FROM product WHERE name LIKE ?")) {
            ps.setString(1, "%" + keyword + "%");
            try (ResultSet rs = ps.executeQuery()) {
                rs.next();
                return rs.getLong(1);
            }
        }
    }
}
```

列表 Servlet 只负责参数、调用和转发，连接信息从本机环境变量读取。真实服务应由连接池管理连接，不应把 `Connection` 放在 Servlet 字段中跨请求共享。

```java
package demo;

import java.io.IOException;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/products")
public class ProductListServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        int page;
        try {
            page = Integer.parseInt(request.getParameter("page") == null
                ? "1" : request.getParameter("page"));
        } catch (NumberFormatException ex) {
            response.sendError(400, "page must be an integer");
            return;
        }
        if (page < 1 || page > 100000) {
            response.sendError(400, "page out of range");
            return;
        }
        int size = 10;
        String keyword = request.getParameter("keyword") == null
            ? "" : request.getParameter("keyword").trim();
        if (keyword.length() > 100) {
            response.sendError(400, "keyword too long");
            return;
        }
        try (Connection conn = DriverManager.getConnection(
                System.getenv("DB_URL"), System.getenv("DB_USER"),
                System.getenv("DB_PASSWORD"))) {
            ProductDao dao = new ProductDao(conn);
            request.setAttribute("products", dao.findPage(keyword, (page - 1) * size, size));
            request.setAttribute("total", dao.count(keyword));
            request.setAttribute("page", page);
            request.setAttribute("keyword", keyword);
        } catch (SQLException ex) {
            throw new ServletException("商品列表查询失败", ex);
        }
        request.getRequestDispatcher("/WEB-INF/views/products.jsp")
               .forward(request, response);
    }
}
```

JSP 文件 `src/main/webapp/WEB-INF/views/products.jsp`：

```html
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><title>商品列表</title></head>
<body>
  <form action="${pageContext.request.contextPath}/products" method="get">
    <input name="keyword" value="${fn:escapeXml(keyword)}">
    <button type="submit">查询</button>
  </form>
  <table>
    <c:forEach items="${products}" var="product">
      <tr><td>${product.id}</td><td><c:out value="${product.name}" /></td>
          <td>${product.price}</td></tr>
    </c:forEach>
  </table>
  <p>第 ${page} 页，共 ${total} 条</p>
</body></html>
```

此列表例子用于理解请求链路，尚未实现完整分页导航。页面输出用户可控字段时要做 HTML 转义，不能把 JSP 的 EL 自动当作安全保证；上面用 `<c:out>` 输出商品名称，用 `fn:escapeXml` 处理输入框回显。`LIKE` 参数绑定能防 SQL 注入，但 `%`、`_` 仍是模糊匹配通配符，要求“按字面搜索”时还需显式转义。

## 增删改操作

完整商品表还可以包含分类、供应商、品牌、折扣和进价；这里使用缩小后的示例表，不应将它误当作完整业务表定义。

```xml
<mapper namespace="demo.ProductWriteMapper">
  <insert id="insert">
    INSERT INTO product (name, price) VALUES (#{name}, #{price})
  </insert>
  <update id="update">
    UPDATE product SET name = #{name}, price = #{price} WHERE id = #{id}
  </update>
  <delete id="deleteById">
    DELETE FROM product WHERE id = #{id}
  </delete>
</mapper>
```

接口参数应明确命名，避免多个简单参数难以映射；一次写请求使用独立 `SqlSession`，检查影响行数后提交。`SqlSessionFactory` 可以复用，但不要把 `SqlSession` 长期放进 DAO 字段。

```java
package demo;

import java.math.BigDecimal;
import org.apache.ibatis.annotations.Param;

public interface ProductWriteMapper {
    int insert(@Param("name") String name, @Param("price") BigDecimal price);
    int update(@Param("id") long id, @Param("name") String name,
               @Param("price") BigDecimal price);
    int deleteById(@Param("id") long id);
}
```

```java
package demo;

import java.math.BigDecimal;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;

public class ProductWriteService {
    private final SqlSessionFactory factory;
    public ProductWriteService(SqlSessionFactory factory) { this.factory = factory; }

    private static String checkedName(String name) {
        if (name == null || name.trim().isEmpty() || name.length() > 100)
            throw new IllegalArgumentException("name invalid");
        return name.trim();
    }

    private static BigDecimal checkedPrice(BigDecimal price) {
        if (price == null || price.signum() < 0 || price.scale() > 2)
            throw new IllegalArgumentException("price invalid");
        return price;
    }

    public void create(String name, BigDecimal price) {
        name = checkedName(name);
        price = checkedPrice(price);
        try (SqlSession session = factory.openSession()) {
            int rows = session.getMapper(ProductWriteMapper.class).insert(name, price);
            if (rows != 1) throw new IllegalStateException("insert affected " + rows + " rows");
            session.commit();
        }
    }

    public boolean update(long id, String name, BigDecimal price) {
        if (id <= 0) throw new IllegalArgumentException("id invalid");
        name = checkedName(name);
        price = checkedPrice(price);
        try (SqlSession session = factory.openSession()) {
            int rows = session.getMapper(ProductWriteMapper.class).update(id, name, price);
            if (rows == 1) session.commit();
            return rows == 1;
        }
    }

    public boolean delete(long id) {
        if (id <= 0) throw new IllegalArgumentException("id invalid");
        try (SqlSession session = factory.openSession()) {
            int rows = session.getMapper(ProductWriteMapper.class).deleteById(id);
            if (rows == 1) session.commit();
            return rows == 1;
        }
    }
}
```

把 XML 放进 classpath，并在 MyBatis 主配置中登记 Mapper；依赖、数据库连接和 `SqlSessionFactory` 初始化见 [MyBatis 入门文章](/articles/mybatis-session-mapper-basics)。这段代码负责写入事务，尚未给出完整的表单校验与 Servlet 路由。实际表单应以 POST 提交到写请求 Servlet，由它解析参数、调用 Service，并在成功后重定向到列表。不要用 GET 删除链接执行写操作；删除需要权限检查和防 CSRF 措施。若更新或删除返回 `false`，页面应核查记录是否存在、是否重复提交以及 JDBC 驱动对未改变数据的影响行数语义，不能直接显示“操作成功”。一个应用应统一选用可维护的持久层实现；前面的 JDBC 列表用于说明独立的请求链路。
