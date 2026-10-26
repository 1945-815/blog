---
title: "Sentinel 限流实践：规则、入口与降级边界"
date: "2026-10-13"
categories: ["微服务"]
tags: ["Sentinel","限流","容错"]
description: "用本地 Demo 定义资源和限流规则，观察触发行为及降级边界。"
plan_date: "2025-09-10"
phase: "分布式与中间件"
---

# Sentinel 限流实践：规则、入口与降级边界

## 问题背景

突发流量、慢依赖或故障扩散会消耗线程和连接。限流与熔断可以保护调用边界，但需要为被拒绝请求定义合理响应，不能把规则本身当作完整容灾方案。

## 核心原理

资源代表需要保护的入口或依赖调用；流控规则根据配置维度限制通过量；熔断根据异常或慢调用表现暂时阻断调用。限流、熔断、舱壁隔离和超时解决的问题不同，应按故障模式选择。

## 实现示例

在本地为一个列表接口定义资源，配置简单的 QPS 规则，使用受控请求触发并记录返回行为。对下游调用再配置超时和熔断观察；fallback 只返回真实可接受的降级内容，并区分缓存结果、空结果与错误。

```java
@SentinelResource(
  value = "documentSearch",
  blockHandler = "onBlocked")
public Result search(Query query) { ... }

public Result onBlocked(Query query, BlockException ex) {
  return Result.busy("请求较多，请稍后重试");
}
```

### 规则类型与入口边界

Sentinel 除了按 QPS 限制资源流量，还支持并发线程数、调用关系、热点参数、熔断降级和系统保护等规则。各类规则针对的资源和触发条件不同，应根据具体故障边界选择。

| 规则 | 主要判断依据 | 适合先验证的问题 |
| --- | --- | --- |
| 关联流控 | 关联资源的调用情况 | 写资源高峰时是否需要保护读资源 |
| 链路流控 | 指定调用入口到达当前资源的流量 | 同一资源由不同入口调用时是否需要区别限流 |
| 热点参数 | 请求参数的特定取值 | 某些热门商品/用户参数是否形成热点 |
| 熔断降级 | 慢调用比例、异常比例或异常数 | 下游持续慢或报错时是否应暂时停止调用 |
| 授权与系统规则 | 来源、系统负载等规则条件 | 是否需限制调用来源或系统整体入口 |

流控规则的 `controlBehavior` 是另一个维度：快速失败立即拒绝，预热逐步提高放行速率，匀速限流则按设定节奏放行请求。具体行为和参数以当前 Sentinel 版本文档为准。

`@SentinelResource` 的 `blockHandler` 处理 `BlockException`，方法参数需与原方法一致并在末尾增加异常参数；`fallback` 可处理业务方法异常。两者同时配置时，规则拦截由 `blockHandler` 处理。Gateway 规则需接入网关 adapter 并配置相应资源和回调；普通 Web 资源的注解示例不能代表 Gateway 规则配置。规则持久化和动态推送还需单独验证。[Sentinel 流控文档](https://sentinelguard.io/en-us/docs/flow-control.html)；[Spring Cloud Alibaba Sentinel 集成说明](https://github.com/alibaba/spring-cloud-alibaba/wiki/Sentinel-en)。

### 源码与机制观察

观察资源埋点、规则匹配和 block handler 的调用链，分别测试入口限流与依赖熔断。规则命中应有指标、日志和告警，不通过生产故障来验证默认规则。

请求进入资源保护点后，Sentinel 根据资源统计和规则判断是否放行；被拒绝时由 block handler 处理。统计窗口、规则加载和集成方式可能随版本变化。规则来源可以是本地配置或控制台，但持久化与动态推送要单独验证。

## 应用场景与边界

本地 Demo 为一个接口设置资源名和规则，记录达到阈值后的响应；阈值只用于演示，不据此推断生产容量。

## 边界与常见问题

过宽资源名会导致不相关接口共享限制；fallback 不应吞掉所有异常。限流阈值不能从 Demo 直接推断生产容量。排查要确认规则是否加载、资源是否被埋点、流控效果是否符合预期。

## 改进思路

资源命名与规则范围保持清晰，为拒绝请求定义可理解的响应；阈值应来自容量测量而非示例数字。

## 设计取舍与结论

Sentinel 规则保护的是明确的资源边界。为每条规则准备可解释的拒绝结果、监控和恢复方式；阈值需结合请求分布、下游承载能力与压测结果确定。

## 参考资料

- [Sentinel Flow Control](https://sentinelguard.io/en-us/docs/flow-control.html)
- [Sentinel Circuit Breaking](https://sentinelguard.io/en-us/docs/circuit-breaking.html)
- [Sentinel 注解支持](https://sentinelguard.io/zh-cn/docs/annotation-support.html)
- [Sentinel Gateway 流量控制](https://sentinelguard.io/en-us/docs/api-gateway-flow-control.html)
