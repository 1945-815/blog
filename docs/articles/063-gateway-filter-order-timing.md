---
title: "Spring Cloud Gateway 过滤器顺序与耗时统计"
date: "2027-06-01"
categories: ["微服务"]
tags: ["Spring Cloud Gateway", "GlobalFilter", "响应式编程", "链路观测"]
description: "从过滤链排序和响应式执行时机出发，设计轻量的网关请求耗时记录。"
plan_date: "2026-03-11"
phase: "Java 后端实习与业务实践"
---

# Spring Cloud Gateway 过滤器顺序与耗时统计

## 一、为什么学习这个技术

已有文章介绍了 Gateway 的入口路由职责和服务间 OpenFeign 调用。真正排查接口慢时，还要继续回答：请求在哪个过滤器开始、何时进入下游、响应完成后怎样记录耗时？如果把计时代码写在 chain.filter(exchange) 返回之后，得到的只是返回 Publisher 的时间，不是下游请求完成时间。

Spring Cloud Gateway 基于响应式处理模型，过滤器代码描述的是异步执行链。理解前置逻辑、下游订阅和后置回调的关系，才能安全地记录访问路径、状态和时长，也能避免在事件循环线程里执行阻塞操作。

## 二、核心概念

请求命中 Route 后，Gateway 会把全局 GlobalFilter 与该路由匹配到的 GatewayFilter 合并成一个过滤链，再按 Ordered 顺序排序。优先级最高的过滤器先执行 pre 逻辑、最后执行 post 逻辑；理解成嵌套调用，外层先进入、后退出。

过滤器中的 chain.filter(exchange) 将请求交给链中后续过滤器和最终路由。它返回一个代表响应处理流程的 Mono，而不是已经完成的结果。因此要在 Mono 完成、失败或取消时记录终态，可使用 doFinally；如果要分别处理成功和异常，还可以使用 doOnSuccess、doOnError。

顺序值需要看清约定。Spring 的 Ordered 数值越小，优先级通常越高；Gateway 文档描述的是排序后的过滤链和 pre/post 执行顺序。多个自定义过滤器若都使用相同值，执行先后不应被业务逻辑依赖。

## 三、底层原理

过滤链可以抽象成一层层包裹的 Publisher：过滤器 A 先记录开始时间并调用下一层 B，B 再调用路由处理。下游完成后，返回信号沿调用栈逆向传播，A 的 post 回调因此能够看到完整的下游耗时。

响应式代码不意味着所有阻塞动作都会自动异步。若在 Gateway 过滤器里调用阻塞 JDBC、Thread.sleep 或同步远程接口，会占用处理请求的事件循环线程，影响其他连接。耗时日志应保持轻量；确需落库时，先投递到异步队列或下游消费端，过滤器不要同步等待数据库。

统计口径也应说清楚：下面代码测量过滤链从订阅到终止的总耗时，包含 Gateway 内部处理和下游服务响应时间；它不是单纯的业务方法耗时。客户端断开会出现取消信号，失败请求也需要被记录，不能只统计正常完成。课堂例子用 `then(...)` 的后置逻辑计算成功完成路径；本文改用 `doFinally` 记录完成、失败和取消终止信号。

## 四、代码案例

以下 GlobalFilter 读取单调递增的纳秒计时器，避免使用系统时钟计算耗时。日志不包含查询字符串，减少把 token 或个人信息写入日志的风险。

~~~java
@Component
public class RequestTimingFilter implements GlobalFilter, Ordered {
    private static final Logger log =
            LoggerFactory.getLogger(RequestTimingFilter.class);

    @Override
    public int getOrder() {
        return -10;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange,
                             GatewayFilterChain chain) {
        return Mono.defer(() -> {
            long started = System.nanoTime();
            ServerHttpRequest request = exchange.getRequest();
            String method = request.getMethod().name();
            String path = request.getURI().getPath();
            Route route = exchange.getAttribute(
                    ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR);
            String routeId = route == null ? "unknown" : route.getId();

            return chain.filter(exchange).doFinally(signal -> {
                long elapsedMs =
                        TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - started);
                Object status = exchange.getResponse().getStatusCode();
                log.info("gateway route={} method={} path={} status={} signal={} elapsedMs={}",
                        routeId, method, path, status, signal, elapsedMs);
            });
        });
    }
}
~~~

最小路由配置可把请求转给订单服务；实际项目应把服务发现、路由名称和依赖版本与现有 Spring Cloud BOM 对齐。

~~~yaml
spring:
  cloud:
    gateway:
      routes:
        - id: order-api
          uri: http://localhost:8081
          predicates:
            - Path=/api/orders/**
          filters:
            - StripPrefix=1
~~~

若要把终态异步归档，表结构可以先包含请求标识、路由、状态、耗时和发生时间。不要在 GlobalFilter 里同步执行下面的 INSERT；这里的 SQL 供队列消费者或批量归档任务使用。

~~~sql
CREATE TABLE gateway_request_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    route_id VARCHAR(80) NOT NULL,
    http_method VARCHAR(12) NOT NULL,
    http_status SMALLINT,
    elapsed_ms BIGINT NOT NULL,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    KEY idx_route_created (route_id, created_at)
);
~~~

实际调用示例：`curl -i http://localhost:8080/api/orders/42`。分别让下游快速返回、返回错误以及停止客户端请求，观察日志中的 route、signal、status 和 elapsedMs。也要验证不会输出 URL 查询参数。

## 五、课堂案例与验证边界

这里的 `RequestTimingFilter` 是将该课堂思路扩展为含失败和取消终态记录的独立示例，不是资料中的原样代码。现有资料没有证明这段计时逻辑已部署到 wolf2w 课程项目或生产环境。

设计上应控制日志基数：不要把完整 URL、用户输入或任意 Header 当成指标标签。日志可记录脱敏后的路径模板，指标标签则使用有限集合的 routeId、method、status。访问日志与业务审计也不是一回事，后者要有授权、留存和数据保护规则。

本练习可以通过本地两个 Spring Boot 服务完成，不包含生产容量结论。上线前还需检查采样策略、日志异步配置、磁盘保留和异常终止时的记录行为。

## 六、常见面试问题

### 初级：GlobalFilter 和 GatewayFilter 有什么区别？

GlobalFilter 面向匹配到的所有路由；GatewayFilter 通常由路由单独配置，只在对应路由生效。命中 Route 后，两者会进入组合后的过滤链。

### 中级：如何在过滤器中统计完整请求耗时？

在调用下游前取 System.nanoTime，给 chain.filter(exchange) 返回的 Mono 添加终止回调，再用差值计算。不要在调用后立即读时间，因为那时响应通常还没结束。

### 项目问题：为什么不能直接在过滤器中写数据库？

同步 JDBC 会阻塞响应式事件循环，造成排队和吞吐下降。可以把必要日志交给异步机制或独立消费者处理，并定义丢弃、重试和容量边界。

## 七、总结

两种写法的统计口径不同，使用时要先决定是否把异常和客户端取消也纳入请求耗时。

## 参考资料

- [Spring Cloud Gateway Global Filters](https://docs.spring.io/spring-cloud-gateway/reference/spring-cloud-gateway-server-webflux/global-filters.html)
- [Spring Framework Ordered API](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/core/Ordered.html)
