---
title: "Nginx 反向代理与负载均衡：把请求稳妥地交给 Spring Boot"
date: "2027-04-27"
categories: ["开发运维"]
tags: ["Nginx", "Spring Boot", "反向代理", "负载均衡"]
description: "用 upstream 和 proxy_pass 接入多个 Spring Boot 实例，并梳理路径、转发头和 502 排查。"
plan_date: "2026-06-02"
phase: "后端工程实践"
---

# Nginx 反向代理与负载均衡：把请求稳妥地交给 Spring Boot

## 问题背景

Spring Boot 项目开发时通常直接访问应用端口。部署到一台或多台服务器后，客户端若直接依赖实例 IP 和端口，地址变动、HTTPS 入口、静态资源和多实例分流都会散落在调用方。Nginx 可以作为统一入口，负责接收 HTTP 请求、选择上游实例并把响应返回给客户端。

把这些配置放进 Java 后端场景，重点不是背命令，而是搞清楚请求路径是否被改写、转发头是否可信、实例不可用时客户端会看到什么，以及 Nginx 的可用性不能替代应用本身的健康检查。

## 核心概念

反向代理代表服务端接收请求，再转发给后端；客户端只连接 Nginx，不需要知道内部应用地址。负载均衡是在多个上游之间选择目标。Nginx 的 upstream 可以定义一组服务，默认使用加权轮询；连接数、权重和被动失败参数会影响选择行为。

location 决定哪些 URI 进入某个处理块。proxy_pass 是否带 URI 会影响路径：在 /api/ 下使用不带 URI 的 proxy_pass，通常把原请求 URI 继续传给后端；配置替换 URI 时，匹配到的前缀会被替换。斜杠不同会导致后端收到不同地址，因此要用真实请求验证。

例如 `location /api/` 配合 `proxy_pass http://document_api`，后端接收 `/api/documents/42`；如果写成 `proxy_pass http://document_api/`，匹配到的 `/api/` 前缀会替换为 URI 根路径，后端接收 `/documents/42`。`location` 还存在精确、前缀和正则匹配规则，配置静态资源、管理端和 API 时要检查最终命中的块，而不是只看配置文件里是否出现了某个路径。

X-Forwarded-For、X-Real-IP 和 X-Forwarded-Proto 描述客户端地址与外部协议。它们是 HTTP 头，客户端可以伪造；只有在应用明确只接受可信代理写入的头时，才能用于审计或生成跳转链接。不要直接把任意客户端传来的身份头当作已认证用户身份。

## 底层原理

一次请求先到 Nginx 的监听端口，worker 进程按 server_name 与 location 规则选中处理块，再通过 upstream 选择后端地址并建立连接。Nginx 转发请求头、请求体和 URI，收到 Java 服务响应后再返回客户端。上游连接建立失败通常表现为 502；应用已接受连接但在读取响应阶段超时，可能表现为 504 或超时错误，需结合错误日志定位。

upstream 的 max_fails 和 fail_timeout 是被动失败处理参数，表示一段时间内通信失败达到条件后暂时认为节点不可用。它不等同于业务级主动健康检查，也不意味着所有请求都能安全重试。写操作是否可以重试要看幂等设计和请求是否已经到达应用。

还要关注连接复用与超时的对应关系。upstream keepalive 缓存的是空闲上游连接，应用连接池、Nginx worker 连接数和文件描述符上限需要一起观察。proxy_read_timeout 约束两次读取响应数据之间允许的空闲时间，不是整个请求从开始到结束的总时长；长任务应设计异步查询或任务状态接口，不能只靠调大代理超时。

## 代码案例

两个 Spring Boot 实例分别监听 8081、8082，外部统一访问 /api/。upstream 名称仅在 Nginx 配置中使用：

~~~nginx
upstream document_api {
    server 127.0.0.1:8081 max_fails=2 fail_timeout=15s;
    server 127.0.0.1:8082 max_fails=2 fail_timeout=15s;
    keepalive 32;
}

server {
    listen 80;
    server_name localhost;

    location /api/ {
        proxy_pass http://document_api;
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
SELECT id, title, view_count
FROM document_record
WHERE id = #{id} AND status = 1;
~~~

~~~java
@GetMapping("/api/documents/{id}")
public DocumentDetail detail(@PathVariable Long id) {
    return documentService.findPublishedById(id);
}
~~~

验证调用：curl -i http://localhost/api/documents/42。先用 nginx -t 检查语法，再平滑 reload；分别查看 Nginx access/error log 和 Spring Boot 日志，确认 8081、8082 都能独立响应。若后端映射为 /api/documents/42，当前不带 URI 的 proxy_pass 会保留 /api 前缀。

## 故障排查与配置边界

### Nginx 配置要点

Nginx 配置通常包括静态站点、Java 接口反向代理、`location`、`upstream` 和 Keepalived。双后端示例可用 9001、9002 模拟同机的两个实例；本文前面的 8081、8082 是独立演示端口，部署时应按服务监听地址和网络拓扑调整。


| 规则 | 匹配行为 |
| --- | --- |
| `location = /path` | 精确匹配成功后立即采用该块 |
| 普通前缀，如 `location /api/` | 先记录匹配到的最长前缀 |
| `location ^~ /assets/` | 若它是最长前缀，则跳过后续正则匹配 |
| `location ~` / `~*` | 按配置顺序检查正则；首个匹配项生效 |
| 未命中正则 | 回到此前记录的最长前缀 |

常见的 upstream 策略包括默认轮询、权重和 `ip_hash`。`ip_hash` 用客户端地址做粘性分配；它不能让多个 JVM 共享 HttpSession，同一客户端地址变化或节点不可用时也可能落到另一实例。需要跨节点会话时应使用共享存储等应用层方案。Keepalived 可通过主备和虚拟 IP 提升入口可用性，但完整故障切换仍需在目标环境验证。

统一入口可由 Nginx、云负载均衡或 API 网关承担，应用则按部署拓扑监听后端端口。容器网络中的 upstream 地址应使用同一网络内可解析的服务名或实例地址，不能默认沿用宿主机的 `localhost`。

遇到 404 时，先比对 Nginx 转发后的 URI 和 Controller 映射；遇到 502 时，查目标 IP、端口、进程状态和网络连通性；遇到 504 时，检查应用慢查询、线程池、下游调用和超时配置。不要看到错误码就盲目延长超时。上线前还要设置请求体大小、访问日志字段、HTTPS、敏感路径策略和可信代理边界。

从后端实例开始分层排查：先 curl 直连每个实例确认服务存活，再从 Nginx 所在机器请求上游地址，最后请求公开入口。同步查看 `nginx -T` 的生效配置、error log 中的 upstream 地址和耗时，以及 Java 应用 traceId。若应用启用了转发头处理，入口代理必须覆盖或规范化外部传入的同名头；多层代理时只信任已知代理网段，避免日志把伪造地址记成真实客户端。

## 设计取舍与结论

反向代理把外部请求转交给后端实例，负载均衡决定实例选择。可信代理头、健康检查、超时、重试与幂等处理共同决定请求链路是否可预测。

## 参考资料

- [Nginx proxy 模块文档](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Nginx upstream 模块文档](https://nginx.org/en/docs/http/ngx_http_upstream_module.html)
- [Nginx location 指令与匹配规则](https://nginx.org/en/docs/http/ngx_http_core_module.html#location)
