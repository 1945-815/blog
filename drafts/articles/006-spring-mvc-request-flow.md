---
title: "Spring MVC 请求从进入到返回的大致流程"
date: "2026-10-30"
categories: ["Spring MVC"]
tags: [
  "Spring MVC",
  "HTTP",
  "后端基础"
]
description: "从 DispatcherServlet 到 Controller 和视图或响应体，梳理 MVC 请求处理链。"
draft: true
plan_date: "2026-10-30"
---

# Spring MVC 请求从进入到返回的大致流程

## 背景与问题

理解请求链路有助于定位参数绑定失败、拦截器未生效和异常响应不一致等问题。只看 Controller 方法往往看不到请求是如何被选中与转换的。

## 核心概念与设计

典型链路由 Servlet 容器接收请求，DispatcherServlet 作为前端控制器协调 HandlerMapping、HandlerAdapter、参数解析器、消息转换器和异常解析器。REST 接口通常通过消息转换器读写 JSON。

## 实现与运行机制

用一个带 DTO 参数的接口观察请求映射、参数绑定、校验、方法调用和响应序列化。断点可以放在 Controller、拦截器、全局异常处理器；通过日志记录路径、状态码和 request id，而不是记录整个敏感请求体。

DispatcherServlet 先查找匹配 handler，再由适配器调用方法。返回对象根据注解和内容协商选择视图解析或 HttpMessageConverter；异常由 HandlerExceptionResolver 链处理。过滤器运行在 Servlet 层，拦截器围绕 Spring MVC handler，二者注册范围和职责不同。

## 源码与机制观察

**源码观察：**沿 DispatcherServlet 的 doDispatch 主流程查看 handler 查找、适配器调用、拦截器和异常处理入口；过滤器位于 Servlet 容器链路，不能仅靠 MVC 调用栈解释。

```text
Servlet Container -> Filter Chain -> DispatcherServlet
  -> HandlerMapping -> HandlerAdapter -> Controller
  -> HttpMessageConverter -> HTTP Response
```
## 实践边界与常见问题

不要把过滤器、拦截器和 AOP 当成可互换概念。Controller 里堆认证、数据访问和异常转换会让边界模糊。文件上传、异步请求和内容协商还会引入不同路径，需要结合实际配置验证。

## 面试总结

### DispatcherServlet 扮演什么角色？

它是 MVC 前端控制器，负责协调 handler 查找、调用、结果处理与异常解析。

### 过滤器和拦截器差异是什么？

过滤器属于 Servlet 规范链路，拦截器围绕 Spring MVC handler；选择时看需要的运行层和可访问信息。

### JSON 是在哪里序列化的？

通常由配置的 HttpMessageConverter 根据返回值与媒体类型处理。

## 总结

遇到请求问题时沿容器、过滤器、DispatcherServlet、handler 和消息转换器分层观察，能更快定位问题所在。

## 参考资料

- [Spring MVC DispatcherServlet](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet.html)
- [Spring MVC Handler Methods](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller.html)
