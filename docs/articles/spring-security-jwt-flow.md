---
title: "Spring Security 与 JWT 的认证授权流程"
date: "2026-10-13"
categories: ["安全认证"]
tags: ["Spring Security","JWT","认证授权"]
description: "梳理登录认证、令牌校验、用户上下文和权限判断的职责边界。"
plan_date: "2025-10-08"
phase: "分布式与中间件"
---

# Spring Security 与 JWT 的认证授权流程

## 问题背景

接口需要知道请求代表谁，也需要判断该身份是否具备执行操作的权限。认证回答“你是谁”，授权回答“你能做什么”；把两者混在 Controller 中会造成规则分散。

## 核心原理

登录时验证凭证并建立身份，JWT 通常承载经签名保护的声明；后续请求携带令牌，由安全过滤链解析、验签、检查时效并建立 SecurityContext。权限判断应基于服务端可信身份与规则，而非客户端自报角色。

## 实现示例

示例流程：登录接口校验账号密码，成功后签发短期访问令牌；过滤器读取 Authorization 头，校验签名和过期时间，将主体与权限放入请求上下文；授权配置限制受保护路由。退出和权限撤销策略要按业务选择短令牌、黑名单或版本号机制。

```java
// 示例仅展示边界，不是完整安全配置
String token = request.getHeader("Authorization");
Claims claims = verifier.verify(token); // 验签、校验过期和发行者
SecurityContextHolder.getContext().setAuthentication(
    toAuthentication(claims));
```

### 源码与机制观察

阅读 SecurityFilterChain 配置、OncePerRequestFilter 以及 AuthenticationProvider 的调用关系，先追请求如何进入过滤器链，再看认证结果怎样写入 SecurityContext。不同版本推荐配置方式有差异，按项目依赖版本查文档。

Spring Security 的 Servlet 集成通过过滤器链处理认证和授权。Authentication 表示认证结果，SecurityContext 保存当前请求的身份上下文。JWT 验证过滤器必须在适当的过滤器位置执行；无效令牌应进入一致的未认证响应路径。

移动端 HTTP 客户端也能保存和发送 Cookie，只是实现方式与浏览器不同；多实例应用使用 Session 时需要共享会话存储或其他会话保持方案。选 JWT 时仍要考虑失效、权限变更和泄露后的撤销。

## 应用场景与边界

在隔离的示例接口中验证登录、无令牌、过期令牌和无权限访问四条路径，观察认证与授权分别在哪里拒绝请求。

## 边界与常见问题

不要把 JWT 当成加密数据，它通常可被解码，不能存放密码等秘密。签名、发行者、受众、过期时间都要验证；HTTPS、密钥轮换、令牌泄露处置和权限变更策略也不可省略。

## 改进思路

令牌设置合理有效期并规划撤销方式；校验签名、发行者和时效，资源权限始终在服务端判断。

## 设计取舍与结论

Spring Security 负责组织过滤链和安全上下文，JWT 只是令牌格式选择。生产级安全还需考虑撤销、密钥管理、传输安全与最小权限。

## 参考资料

- [Spring Security Authentication Architecture](https://docs.spring.io/spring-security/reference/servlet/authentication/architecture.html)
- [Spring Security JWT Resource Server](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html)
