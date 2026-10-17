---
title: "Tomcat 与 Servlet：从 URL 映射到生命周期"
date: "2026-10-16"
categories: ["Java 基础"]
tags: ["Java Web", "Servlet", "Tomcat", "HTTP"]
description: "沿用课堂 Java Web 练习说明容器、Servlet 映射、init/service/destroy，并标明 javax 与 jakarta 的版本边界。"
plan_date: "2026-10-16"
phase: "数据库与 Spring 基础"
---

# Tomcat 与 Servlet：从 URL 映射到生命周期

这里用一个最小 WAR 练习把这些步骤连起来。它属于传统 Java Web 学习材料；Spring MVC 的 `DispatcherServlet` 在 Servlet 容器之上组织请求处理，可继续读 [Spring MVC 请求流程](/articles/spring-mvc-request-flow)。

## 先看请求走到哪里

浏览器向 `http://localhost:8080/servlet-demo/hello?name=小林` 发起 HTTP 请求：`localhost` 指向本机，`8080` 是 Tomcat 监听端口，`servlet-demo` 是应用上下文路径，`/hello` 匹配应用中的 Servlet URL 映射。Tomcat 接收连接、构造请求和响应对象，再调用对应 Servlet。找不到应用或路径可能得到 404；路径存在但 HTTP 方法不被处理时可能得到 405。

IP 地址、端口和协议分别回答“发往哪台主机”“交给哪个监听服务”“如何解释传输内容”。端口不是每个应用都全局唯一，只要求同一地址和传输协议上的监听绑定不冲突。

## 可运行的传统 Servlet 示例

课堂材料使用 `javax.servlet` 包名。下面限定 **JDK 8、Tomcat 9、Servlet 4.0**。Maven 项目 `pom.xml` 的关键部分：

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>demo</groupId>
  <artifactId>servlet-demo</artifactId>
  <version>1.0.0</version>
  <packaging>war</packaging>
  <properties>
    <maven.compiler.source>8</maven.compiler.source>
    <maven.compiler.target>8</maven.compiler.target>
  </properties>
  <dependencies>
    <dependency>
      <groupId>javax.servlet</groupId>
      <artifactId>javax.servlet-api</artifactId>
      <version>4.0.1</version>
      <scope>provided</scope>
    </dependency>
  </dependencies>
  <build>
    <finalName>servlet-demo</finalName>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-war-plugin</artifactId>
        <version>3.4.0</version>
        <configuration><failOnMissingWebXml>false</failOnMissingWebXml></configuration>
      </plugin>
    </plugins>
  </build>
</project>
```

`provided` 表示编译需要 API，但运行时由 Tomcat 提供实现，不应把同一 Servlet API 作为普通运行依赖打进 WAR。`src/main/java/demo/HelloServlet.java`：

```java
package demo;

import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet(urlPatterns = "/hello")
public class HelloServlet extends HttpServlet {
    @Override
    public void init() throws ServletException {
        super.init();
        // 在这里初始化与 Servlet 同寿命的资源；不要存单个用户的请求数据。
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        String name = request.getParameter("name");
        if (name == null || name.trim().isEmpty()) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "name is required");
            return;
        }
        response.setContentType("text/plain;charset=UTF-8");
        response.getWriter().write("你好，" + name);
    }

    @Override
    public void destroy() {
        // 释放由此 Servlet 持有、需要主动关闭的资源。
        super.destroy();
    }
}
```

执行 `mvn package`，将生成的 WAR 部署到 Tomcat 9 的 `webapps`，启动 Tomcat 后访问 `/servlet-demo/hello?name=小林`。实际上下文路径取决于 WAR 名和容器配置。这里用注解做 URL 映射；若选 `web.xml` 配置，同一个 Servlet 的路径配置应避免冲突。

## 生命周期与并发

容器通常在首次请求时创建并初始化 Servlet，然后多次请求调用其 `service`，`HttpServlet` 再分派给 `doGet`、`doPost` 等方法；关闭应用时调用 `destroy`。配置 `loadOnStartup` 或容器策略可能让初始化提前，所以“服务器启动绝对不会创建 Servlet”不是通则。

Servlet 实例通常处理多个请求。上面的 `name` 是 `doGet` 的局部变量；不要把它存成实例字段，否则并发请求可能相互覆盖。把数据库连接长期放在 Servlet 字段中也会带来生命周期与并发问题，应使用适当的数据源与事务边界。

## 版本边界与下一步

Tomcat 10 起规范包名从 `javax.servlet` 改为 `jakarta.servlet`，旧代码不能只换 Tomcat 可执行文件就保证兼容；需要按对应 Servlet/JSP 版本重新编译并处理依赖。

请求与响应、转发、作用域以及 JSP/EL/JSTL 的课堂练习见 [Servlet Web 组件与商品 CRUD](/articles/servlet-jsp-webcrud-classroom)。

版本修正参考 [Tomcat 9 文档](https://tomcat.apache.org/tomcat-9.0-doc/)和 [Tomcat 10 迁移指南](https://tomcat.apache.org/migration-10)。
