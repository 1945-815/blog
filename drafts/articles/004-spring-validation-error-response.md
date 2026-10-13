---
title: "Spring Boot 接口中的参数校验与统一错误响应"
date: "2026-10-16"
categories: ["Spring Boot"]
tags: [
  "Spring Boot",
  "参数校验",
  "接口设计"
]
description: "整理 DTO 校验、业务异常与全局错误映射的接口层职责。"
draft: true
plan_date: "2026-10-16"
---

# Spring Boot 接口中的参数校验与统一错误响应

## 文章定位

这篇文章对应路线图中的“Spring Boot”阶段，目标是把概念、实现和验证过程连接起来。内容以个人学习与简历可支撑的实践为边界；没有经过本人环境验证的操作应在发布前补做。

## 学习目标

- 能解释本文核心机制以及它解决的问题。
- 能搭建最小示例，并说明输入、输出和失败路径。
- 能区分通用 Demo、个人练习与实习协作内容。

## 背景与问题

多个接口分别处理空值、格式和业务规则时，错误码与响应结构容易不一致。把基础输入约束放在 DTO，把业务规则留在服务层，再统一映射异常，可减少重复并改善客户端处理。

## 核心概念与设计

校验分层：请求格式与字段约束属于边界校验；是否允许某业务状态转换属于业务规则；身份与权限由安全层判断。错误响应只暴露客户端需要的信息，不把堆栈、SQL 或内部类名返回出去。

## 实现与运行机制

在请求 DTO 上使用 Bean Validation 注解，在 Controller 参数上触发校验；服务层抛出有稳定错误码的业务异常；全局异常处理器把参数异常、业务异常和未预期异常映射为一致 envelope。集合字段使用级联校验，嵌套对象注明级联关系。

Spring MVC 收到请求后解析参数并调用 HandlerMethod。参数解析和校验失败会进入异常解析链；ControllerAdvice 可集中处理匹配的异常类型。具体触发方式可能受 Spring Boot / Spring Framework 版本、参数类型和校验依赖影响，应在项目版本中验证。

## 源码与机制观察

**源码观察：**从 Spring MVC 的参数解析链路查看请求体反序列化、WebDataBinder 校验和异常解析。具体由哪个解析器处理，取决于参数类型、注解和 Spring Framework 版本。

```java
public record CreateRequest(
    @NotBlank String title,
    @Size(max = 500) String summary) {}
```
## 实践边界与常见问题

不要把所有异常都捕获后返回成功 HTTP 状态；不要把数据库实体直接当请求 DTO；不要在 DTO 中查询数据库完成复杂业务判断。日志保留 request id 和必要上下文，密码、令牌和验证码不能原样记录。

## 高频面试问题

### 字段校验与业务校验怎么区分？

格式、长度、必填属于边界校验；例如当前状态能否预约属于业务规则，应放在业务服务中。

### 为什么统一异常处理不该返回异常堆栈？

堆栈可能泄露内部结构，且客户端不需要它；服务端日志负责诊断，响应提供稳定错误码和可理解提示。

### 参数校验失败返回什么？

选择项目约定的 4xx 状态和稳定响应结构，并测试字段路径、错误码和客户端提示的一致性。

## 项目追问

**追问：**如果把这项技术放进简历所述的文档管理、预约或审批场景，如何说明自己的工作？

**回答思路：**先限定本人实际负责范围，再讲接口边界、数据流、异常路径和验证方法。若内容来自独立 Demo，应直接说明是个人练习，不借用公司项目表述。

## 总结

接口错误治理的目标是让职责明确、响应稳定、日志可排查。校验注解只是入口，业务约束和安全边界仍需分层处理。

## 参考资料

- [Spring MVC Validation](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html)
- [Spring MVC 异常处理](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-exceptionhandler.html)
