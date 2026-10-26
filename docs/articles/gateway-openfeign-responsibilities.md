---
title: "Gateway 与 OpenFeign 在服务调用中的分工"
date: "2026-10-13"
categories: ["微服务"]
tags: ["Spring Cloud Gateway","OpenFeign","微服务"]
description: "梳理外部入口路由与服务间声明式调用的职责、超时和身份传递。"
plan_date: "2025-02-12"
phase: "分布式与中间件"
---

# Gateway 与 OpenFeign 在服务调用中的分工

## 问题背景

微服务系统既要处理客户端进入系统的统一入口，也要处理内部服务之间的调用。Gateway 与 OpenFeign 处于不同调用边界，不能因为都涉及路由就混成一个职责。

## 核心原理

Gateway 面向外部请求，可承担路由、过滤和入口级策略；OpenFeign 是服务端代码发起内部 HTTP 调用的声明式客户端。服务发现和负载均衡可能由 Spring Cloud 相关组件接入，具体依赖组合需按项目版本确认。

## 实现示例

画出浏览器到 Gateway 再到服务 A、服务 A 到服务 B 的链路。为每一跳设置合理连接和响应超时，定义错误映射与 trace id 传递；身份信息通过受控上下文传播，不信任任意外部头部。

```text
// 调用链表达示意
Client -> Gateway -> document-service
                         -> Feign -> auth-service
```

### 路由配置示例

Gateway 可以按路径把外部请求转发给注册中心中的下游服务。下面的路由把 `/documents/**` 转给 `document-service`，并去掉路径中的第一段前缀：

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: document_route
          uri: lb://document-service
          predicates:
            - Path=/documents/**
          filters:
            - StripPrefix=1
```

`lb://` 表示通过服务名交给负载均衡机制选择实例；这条外部路由和服务内部的 Feign 调用是两段不同链路。`GlobalFilter` 可处理全局入口策略，自定义 `AbstractGatewayFilterFactory` 则面向指定路由。Gateway、LoadBalancer、OpenFeign、限流和追踪组件的依赖组合需按所选 Spring Cloud 发布列车核对官方兼容表。

### 源码与机制观察

从 Gateway RouteDefinition 与 GlobalFilter/局部过滤器观察入口处理，从 Feign 客户端代理和负载均衡配置观察内部调用。官方文档版本随 Spring Cloud 发布列车变化，先核对项目依赖兼容表。

Gateway 根据路由谓词匹配请求并按过滤链处理；Feign 代理把接口调用转成 HTTP 请求，再交给底层客户端和负载均衡机制。超时、重试、熔断配置会改变调用行为，避免多层重试造成放大。

## 应用场景与边界

用网关、文档服务和一个模拟下游服务画出外部请求与内部调用链，重点验证超时和错误映射。

## 边界与常见问题

不要在 Gateway 中实现所有业务授权细节；不要把服务间调用暴露给外部。默认无限超时或无边界重试可能拖垮线程和下游。传播用户身份时应限定可写入头部并校验来源。

## 改进思路

为每一跳设置超时、错误映射和追踪标识；只对幂等操作考虑有边界的重试，避免放大下游故障。

## 设计取舍与结论

入口路由与内部调用是两条不同边界。每一跳都应有身份、超时、错误、追踪和重试约定。

## 常见问题

### Gateway 和 Feign 是否都做服务发现？

Gateway 负责外部路由，Feign 发起内部客户端调用；底层是否通过服务发现取地址取决于配置和依赖。

### 为什么设置超时？

调用必须有资源边界，避免下游卡住长期占用线程与连接。

### 能否对所有失败自动重试？

不能；非幂等写操作重复执行会产生副作用，重试策略需限定错误类型和调用语义。




## 参考资料

- [Spring Cloud Gateway Reference](https://docs.spring.io/spring-cloud-gateway/reference/)
- [Spring Cloud OpenFeign](https://docs.spring.io/spring-cloud-openfeign/reference/)
