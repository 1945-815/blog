---
title: "Nginx 反向代理与负载均衡：把请求稳妥地交给 Spring Boot"
date: "2027-04-27"
categories: ["开发运维"]
tags: ["Nginx", "Spring Boot", "反向代理", "负载均衡"]
description: "用 upstream 和 proxy_pass 接入多个 Spring Boot 实例，并梳理路径、转发头和 502 排查。"
plan_date: "2026-06-02"
phase: "Java 后端实习与业务实践"
---

# Nginx 反向代理与负载均衡：把请求稳妥地交给 Spring Boot

> **计划公开日期：**2027-04-27　·　**学习阶段参考日期：**2026-06-02　·　**阶段：**Java 后端实习与业务实践。参考日期表示学习路线顺序，不代表历史发文。

## 一、为什么学习这个技术

Spring Boot 项目开发时通常直接访问应用端口。部署到一台或多台服务器后，客户端若直接依赖实例 IP 和端口，地址变动、HTTPS 入口、静态资源和多实例分流都会散落在调用方。Nginx 可以作为统一入口，负责接收 HTTP 请求、选择上游实例并把响应返回给客户端。

本地 Nginx 学习资料包含 location 匹配、反向代理、upstream、权重和故障参数。把这些配置放进 Java 后端场景，重点不是背命令，而是搞清楚请求路径是否被改写、转发头是否可信、实例不可用时客户端会看到什么，以及 Nginx 的可用性不能替代应用本身的健康检查。

## 二、核心概念

反向代理代表服务端接收请求，再转发给后端；客户端只连接 Nginx，不需要知道内部应用地址。负载均衡是在多个上游之间选择目标。Nginx 的 upstream 可以定义一组服务，默认使用加权轮询；连接数、权重和被动失败参数会影响选择行为。

location 决定哪些 URI 进入某个处理块。proxy_pass 是否带 URI 会影响路径：在 /api/ 下使用不带 URI 的 proxy_pass，通常把原请求 URI 继续传给后端；配置替换 URI 时，匹配到的前缀会被替换。斜杠不同会导致后端收到不同地址，因此要用真实请求验证。

例如 location /api/ 配合 proxy_pass http://strategy_api，后端接收 /api/strategies/42；如果 proxy_pass 写成 http://strategy_api/，匹配到的 /api/ 前缀会映射到 URI 的根路径，后端可能收到 /strategies/42。location 还存在精确、前缀和正则匹配规则，配置静态资源、管理端和 API 时要检查最终命中的块，而不是只看配置文件里是否出现了某个路径。

X-Forwarded-For、X-Real-IP 和 X-Forwarded-Proto 描述客户端地址与外部协议。它们是 HTTP 头，客户端可以伪造；只有在应用明确只接受可信代理写入的头时，才能用于审计或生成跳转链接。不要直接把任意客户端传来的身份头当作已认证用户身份。

## 三、底层原理

一次请求先到 Nginx 的监听端口，worker 进程按 server_name 与 location 规则选中处理块，再通过 upstream 选择后端地址并建立连接。Nginx 转发请求头、请求体和 URI，收到 Java 服务响应后再返回客户端。上游连接建立失败通常表现为 502；应用已接受连接但在读取响应阶段超时，可能表现为 504 或超时错误，需结合错误日志定位。

upstream 的 max_fails 和 fail_timeout 是被动失败处理参数，表示一段时间内通信失败达到条件后暂时认为节点不可用。它不等同于业务级主动健康检查，也不意味着所有请求都能安全重试。写操作是否可以重试要看幂等设计和请求是否已经到达应用。

还要关注连接复用与超时的对应关系。upstream keepalive 缓存的是空闲上游连接，应用连接池、Nginx worker 连接数和文件描述符上限需要一起观察。proxy_read_timeout 约束两次读取响应数据之间允许的空闲时间，不是整个请求从开始到结束的总时长；长任务应设计异步查询或任务状态接口，不能只靠调大代理超时。

## 四、代码案例

两个 Spring Boot 实例分别监听 8081、8082，外部统一访问 /api/。upstream 名称仅在 Nginx 配置中使用：

~~~nginx
upstream strategy_api {
    server 127.0.0.1:8081 max_fails=2 fail_timeout=15s;
    server 127.0.0.1:8082 max_fails=2 fail_timeout=15s;
    keepalive 32;
}

server {
    listen 80;
    server_name api.example.test;

    location /api/ {
        proxy_pass http://strategy_api;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 2s;
        proxy_read_timeout 30s;
    }
}
~~~

Spring Boot 侧的配置示例：

~~~yaml
server:
  port: 8081
  forward-headers-strategy: framework
~~~

后端接口可以继续使用 MyBatis 查询数据库：

~~~sql
SELECT id, title, viewnum
FROM ta_strategy
WHERE id = #{id} AND status = 1;
~~~

~~~java
@GetMapping("/api/strategies/{id}")
public StrategyDetail detail(@PathVariable Long id) {
    return strategyService.findPublishedById(id);
}
~~~

验证调用：curl -i http://api.example.test/api/strategies/42。先用 nginx -t 检查语法，再平滑 reload；分别查看 Nginx access/error log 和 Spring Boot 日志，确认 8081、8082 都能独立响应。若后端映射为 /api/strategies/42，当前不带 URI 的 proxy_pass 会保留 /api 前缀。

## 五、项目真实落地

在企业项目中，我们通常会让 Nginx、云负载均衡或 API 网关承担统一入口，再由应用按部署拓扑监听内部端口。示例配置只是练习，不代表某个企业项目的真实架构。容器网络部署时，upstream 地址要使用同一网络内可解析的服务名或实际实例地址，不能想当然沿用宿主机 localhost。

遇到 404 时，先比对 Nginx 转发后的 URI 和 Controller 映射；遇到 502 时，查目标 IP、端口、进程状态和网络连通性；遇到 504 时，检查应用慢查询、线程池、下游调用和超时配置。不要看到错误码就盲目延长超时。上线前还要设置请求体大小、访问日志字段、HTTPS、敏感路径策略和可信代理边界。

我会从后端实例本身开始分层排查：先 curl 直连每个实例确认服务存活，再从 Nginx 所在机器请求上游地址，最后请求公开入口。同步查看 nginx -T 的生效配置、error log 中的 upstream 地址和耗时，以及 Java 应用 traceId。若应用启用了转发头处理，入口代理必须覆盖或规范化外部传入的同名头；多层代理时只信任已知代理网段，避免日志把伪造地址记成真实客户端。

## 六、常见面试问题

**初级：反向代理和正向代理有什么区别？** 反向代理代表服务端接收来自客户端的请求，后端服务地址由代理维护；正向代理代表客户端访问目标服务。

**中级：upstream 默认如何分配请求？** 默认使用加权轮询。权重只表达相对分配比例，不代表处理能力测试，也不保证请求耗时均匀。长连接或会话状态还需要单独设计。

**项目：502 和 504 怎么排查？** 先确认 Nginx 实际选中的上游，再看连接建立、应用日志、请求耗时和依赖调用；同时核查路径改写及容器网络。避免把所有故障都归结为 Nginx 配置。

## 七、个人总结

作为 2027 届 Java 后端实习生，我把 Nginx 配置和 Spring Boot 请求路径连在一起后，能更具体地解释请求从公网入口到 Controller 的过程。负载均衡只是流量分配，业务幂等、实例健康、可信转发头和故障观测仍要由完整系统共同保证。

## 参考资料

- [Nginx proxy 模块文档](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Nginx upstream 模块文档](https://nginx.org/en/docs/http/ngx_http_upstream_module.html)
