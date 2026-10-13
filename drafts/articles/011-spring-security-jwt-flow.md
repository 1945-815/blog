---
title: "Spring Security 与 JWT 的认证授权流程"
date: "2026-12-04"
categories: ["安全认证"]
tags: ["Spring Security","JWT","认证授权"]
description: "梳理登录认证、令牌校验、用户上下文和权限判断的职责边界。"
draft: true
plan_date: "2026-12-04"
---

# Spring Security 与 JWT 的认证授权流程

## 文章定位

这篇文章对应路线图中的 安全认证 主题，文章使用可复现的技术链路解释问题；涉及实习内容时只描述简历能够支撑的职责，不补充未确认的实现细节或效果数据。

## 学习目标

- 理解关键组件的职责与边界。
- 能搭建或追踪最小流程，验证正常和失败路径。
- 能把 Demo 结论与实际项目经验分开表达。

## 技术背景与问题

接口需要知道请求代表谁，也需要判断该身份是否具备执行操作的权限。认证回答“你是谁”，授权回答“你能做什么”；把两者混在 Controller 中会造成规则分散。

## 核心原理

登录时验证凭证并建立身份，JWT 通常承载经签名保护的声明；后续请求携带令牌，由安全过滤链解析、验签、检查时效并建立 SecurityContext。权限判断应基于服务端可信身份与规则，而非客户端自报角色。

## 实践实现

示例流程：登录接口校验账号密码，成功后签发短期访问令牌；过滤器读取 Authorization 头，校验签名和过期时间，将主体与权限放入请求上下文；授权配置限制受保护路由。退出和权限撤销策略要按业务选择短令牌、黑名单或版本号机制。

```java
// 示例仅展示边界，不是完整安全配置
String token = request.getHeader("Authorization");
Claims claims = verifier.verify(token); // 验签、校验过期和发行者
SecurityContextHolder.getContext().setAuthentication(
    toAuthentication(claims));
```

## 源码与机制观察

阅读 SecurityFilterChain 配置、OncePerRequestFilter 以及 AuthenticationProvider 的调用关系，先追请求如何进入过滤器链，再看认证结果怎样写入 SecurityContext。不同版本推荐配置方式有差异，按项目依赖版本查文档。

Spring Security 的 Servlet 集成通过过滤器链处理认证和授权。Authentication 表示认证结果，SecurityContext 保存当前请求的身份上下文。JWT 验证过滤器必须在适当的过滤器位置执行；无效令牌应进入一致的未认证响应路径。

## 常见问题与优化

不要把 JWT 当成加密数据，它通常可被解码，不能存放密码等秘密。签名、发行者、受众、过期时间都要验证；HTTPS、密钥轮换、令牌泄露处置和权限变更策略也不可省略。

## 高频面试问题

### 认证和授权的区别？

认证建立身份，授权依据身份和资源规则决定是否允许操作。

### JWT 如何注销？

无状态令牌不会因客户端删除而自动失效，可通过较短有效期、服务端撤销列表或令牌版本策略处理，需权衡状态和运维复杂度。

### JWT 载荷能放敏感信息吗？

不能把它视为加密存储；除非采用专门加密方案，否则载荷只放必要且可公开的声明。

## 项目追问

**追问：**如果在文档检索、审批或预约类系统中应用该机制，如何证明设计符合业务边界？

**回答思路：**说明本人实际负责部分、关键请求或数据流、失败处理和验证方式；如使用独立 Demo，明确标为个人实践。对未测量的性能、准确率和生产稳定性不提供数字结论。

## 总结

Spring Security 负责组织过滤链和安全上下文，JWT 只是令牌格式选择。生产级安全还需考虑撤销、密钥管理、传输安全与最小权限。

## 参考资料

- [Spring Security Authentication Architecture](https://docs.spring.io/spring-security/reference/servlet/authentication/architecture.html)
- [Spring Security JWT Resource Server](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html)
