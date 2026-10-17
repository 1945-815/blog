---
title: "Spring MVC 请求从进入到返回的大致流程"
date: "2026-10-13"
categories: ["Spring MVC"]
tags: [
  "Spring MVC",
  "HTTP",
  "后端基础"
]
description: "从 DispatcherServlet 到 Controller 和视图或响应体，梳理 MVC 请求处理链。"
plan_date: "2024-04-05"
phase: "数据库与 Spring 基础"
---

# Spring MVC 请求从进入到返回的大致流程

## 一、为什么学习这个技术

理解请求链路有助于定位参数绑定失败、拦截器未生效和异常响应不一致等问题。只看 Controller 方法往往看不到请求是如何被选中与转换的。

## 二、技术原理

典型链路由 Servlet 容器接收请求，DispatcherServlet 作为前端控制器协调 HandlerMapping、HandlerAdapter、参数解析器、消息转换器和异常解析器。REST 接口通常通过消息转换器读写 JSON。

传统 Servlet 的 URL 映射与生命周期见 [Tomcat 与 Servlet](/articles/servlet-tomcat-lifecycle)；资源路径与 HTTP 方法的设计练习见 [REST 员工接口](/articles/restful-employee-api-design)。

## 三、核心代码实现

用一个带 DTO 参数的接口观察请求映射、参数绑定、校验、方法调用和响应序列化。断点可以放在 Controller、拦截器、全局异常处理器；通过日志记录路径、状态码和 request id，而不是记录整个敏感请求体。

DispatcherServlet 先查找匹配 handler，再由适配器调用方法。返回对象根据注解和内容协商选择视图解析或 HttpMessageConverter；异常由 HandlerExceptionResolver 链处理。过滤器运行在 Servlet 层，拦截器围绕 Spring MVC handler，二者注册范围和职责不同。

### 源码与机制观察

**源码观察：**沿 DispatcherServlet 的 doDispatch 主流程查看 handler 查找、适配器调用、拦截器和异常处理入口；过滤器位于 Servlet 容器链路，不能仅靠 MVC 调用栈解释。

```text
Servlet Container -> Filter Chain -> DispatcherServlet
  -> HandlerMapping -> HandlerAdapter -> Controller
  -> HttpMessageConverter -> HTTP Response
```

`0718SpringBoot请求响应` 的课堂材料依次练习了查询参数、路径变量、JSON 请求体和日期。下面按 Java 17 / Spring Boot 3.3.x 写法展示三个入口：`@RequestBody` 读取 JSON，`@RequestParam` 读取查询参数，`@PathVariable` 读取路径片段，返回对象由消息转换器序列化。

```java
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/demo")
public class DemoController {
    public record UserInput(String name, LocalDate birthday) {}

    @GetMapping("/users/{id}")
    public String user(@PathVariable Long id) {
        return "user-" + id;
    }

    @GetMapping("/dates")
    public LocalDate date(@RequestParam
                          @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate value) {
        return value;
    }

    @PostMapping("/users")
    public UserInput create(@RequestBody UserInput input) {
        return input; // 仅演示绑定与响应，不写数据库
    }
}
```

本地启动后可分别请求 `GET /api/demo/users/1`、`GET /api/demo/dates?value=2026-07-18`，以及带 `Content-Type: application/json` 的 `POST /api/demo/users`，请求体如 `{"name":"小林","birthday":"2026-07-18"}`。缺少必需查询参数或 JSON 格式错误通常由参数解析阶段形成 4xx 响应；具体错误结构取决于项目异常处理配置。

## 四、真实项目落地

在本地 Spring Boot 示例接口上分别观察过滤器、拦截器、Controller 与异常处理器的调用顺序，记录请求和响应。

## 五、遇到的问题

不要把过滤器、拦截器和 AOP 当成可互换概念。Controller 里堆认证、数据访问和异常转换会让边界模糊。文件上传、异步请求和内容协商还会引入不同路径，需要结合实际配置验证。

## 六、优化方案

沿容器、过滤器、DispatcherServlet、参数解析和消息转换逐层定位；记录 request id，避免在日志中输出敏感请求体。

## 七、个人思考

遇到请求问题时沿容器、过滤器、DispatcherServlet、handler 和消息转换器分层观察，能更快定位问题所在。

## 延伸：面试问答

### DispatcherServlet 扮演什么角色？

它是 MVC 前端控制器，负责协调 handler 查找、调用、结果处理与异常解析。

### 过滤器和拦截器差异是什么？

过滤器属于 Servlet 规范链路，拦截器围绕 Spring MVC handler；选择时看需要的运行层和可访问信息。

### JSON 是在哪里序列化的？

通常由配置的 HttpMessageConverter 根据返回值与媒体类型处理。

## 参考资料

- [Spring MVC DispatcherServlet](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet.html)
- [Spring MVC Handler Methods](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller.html)
