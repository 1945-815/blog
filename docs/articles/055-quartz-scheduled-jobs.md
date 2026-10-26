---
title: "Spring 定时任务与 Quartz：从单机触发到多实例调度"
date: "2027-04-06"
categories: ["工程实践"]
tags: ["Spring", "Quartz", "定时任务", "幂等"]
description: "比较 @Scheduled 与 Quartz JDBC JobStore，设计多实例任务的触发、业务执行和重复保护边界。"
plan_date: "2026-04-12"
phase: "后端工程实践"
---

# Spring 定时任务与 Quartz：从单机触发到多实例调度

## 问题背景

排行榜汇总、过期数据清理和定时对账都适合在请求之外执行。最简单的 Spring @Scheduled 能快速启动周期任务；当服务扩展为多个副本后，每个实例都可能各自触发一次。结果可能是重复统计、重复发消息或竞争更新同一批记录。

调度框架负责决定何时触发，不自动保证业务恰好执行一次。任务仍可能在进程崩溃、网络超时和业务重试时重复运行。因此设计要同时考虑调度存储、集群协调、业务幂等、失败重试和运行记录。

## 核心概念

fixedRate 按连续触发的开始时间间隔安排任务；fixedDelay 从上次执行完成后再等待指定时长；cron 表达式根据日历时间触发。Spring cron 通常是包含秒字段的六段格式，不要直接照搬 Linux crontab 的五段表达式。时区也应明确，尤其是跨区域部署和夏令时场景。

@Scheduled 适合简单、随应用部署的本地任务；应用启动多个副本时，各副本会注册自己的调度回调。Quartz 提供 Job、Trigger 和 JobStore 等机制，可用 JDBC JobStore 保存任务状态并配置集群协调。无论选哪种工具，调度防重与业务防重都要分别设计。

## 底层原理

调度器维护触发时间和待执行任务。内存 JobStore 重启后不保留持久触发状态；JDBC JobStore 把调度信息存进数据库，可供多个配置为同一集群的 Scheduler 协调。Quartz 集群节点需要共同使用正确配置的任务表，并遵循版本对应的表结构脚本。

任务被触发后仍要调用应用业务服务。若任务服务跨微服务部署，调度进程可以只负责触发，再通过受控 RPC 调用业务模块；业务服务接收一个可重复的任务参数，并通过唯一约束、状态条件更新或任务运行记录控制重复效果。任务超时后调度器是否重试，不等于业务操作天然幂等。

## 代码案例

单机 Spring 任务示例需要启用调度注解，并按上海时区每天凌晨 2:10 触发。fixedDelay 则表示上一次执行完成后再等待指定时长，适合需要按完成时间间隔运行的轮询任务：

~~~java
@Component
public class RankingTrigger {
    private final RankingService rankingService;
    public RankingTrigger(RankingService rankingService) {
        this.rankingService = rankingService;
    }

    @Scheduled(cron = "0 10 2 * * *", zone = "Asia/Shanghai")
    public void refreshYesterday() {
        rankingService.refresh(LocalDate.now(ZoneId.of("Asia/Shanghai")).minusDays(1));
    }
}
~~~

~~~java
@Configuration
@EnableScheduling
class LocalSchedulingConfiguration {}
~~~

这段 @Scheduled 示例仍是本地触发器；若部署了三个应用副本，三个副本都会注册它。不能因为 cron 相同就认为集群只会执行一次。切换到 Quartz JDBC JobStore 后，持久化触发器由共享调度存储协调；业务方法本身仍应支持重复调用。

上面的注解任务与下面的 Quartz 配置是两种调度方式示意。Quartz 的 YAML 不会自动把 @Scheduled 方法变成持久化 Job；还需要注册 JobDetail 和 Trigger，并把业务调用接入 Job 执行逻辑。生产环境应使用迁移管理的 Quartz schema，不要在每次启动时用会重建表的初始化模式：

~~~yaml
spring:
  quartz:
    job-store-type: jdbc
    jdbc:
      initialize-schema: never
    properties:
      org.quartz.scheduler.instanceId: AUTO
      org.quartz.scheduler.instanceName: rankingCluster
      org.quartz.jobStore.isClustered: true
      org.quartz.jobStore.clusterCheckinInterval: 15000
~~~

所有 Quartz 集群节点应使用同一个 scheduler.instanceName 和共享的 JDBC JobStore，instanceId 则要保持节点唯一；AUTO 可由 Quartz 为节点生成标识。业务结果用日期和区域构成唯一键，重跑时在事务中替换或 upsert 同一份快照：

~~~sql
CREATE TABLE ranking_snapshot (
  snapshot_date DATE NOT NULL,
  region_code VARCHAR(32) NOT NULL,
  rank_no INT NOT NULL,
  item_id BIGINT NOT NULL,
  score BIGINT NOT NULL,
  PRIMARY KEY (snapshot_date, region_code, rank_no)
);
~~~

实际触发时由 Scheduler 调度任务，再调用 rankingService.refresh(date)；若任务跨服务，任务模块只传日期和任务标识给业务服务，业务服务负责查询、事务和幂等写入。不要在调度线程里直接处理超大批量计算，应将任务拆分并记录可恢复进度。

## 持久化调度与集群边界

选择调度器前先明确任务规模和部署拓扑：单实例清理任务可用 `@Scheduled`；需要持久触发、后台配置、集群协调或执行记录时，再评估 Quartz 或专用任务平台。

常见问题包括所有副本都触发、上次任务尚未完成又开始新一轮、任务完成但调度器没收到结果、Quartz 表在重启时被误删，以及 cron 使用了错误时区。处理时先明确触发唯一性和业务幂等键，再设定超时、并发控制、失败重试上限与告警；对长任务记录游标和进度，支持从已完成分片继续。该方案用于说明调度边界；实际部署仍需核对目标依赖版本和集群配置。

快照写入可以在一个数据库事务中先删除指定日期和区域的旧快照，再插入本轮结果，或使用带唯一键的 upsert；这样任务重跑时不会叠加出两份榜单。对多个区域的长任务可按区域拆分并分别记录状态，避免一个区域失败就丢失其他已完成结果。调度日志至少应包含任务标识、业务日期、开始结束时间、处理数量和失败原因。

## 设计取舍与结论

调度系统负责触发与协调，不会替业务逻辑提供幂等性。任务入口应处理重复触发、超时、失败重试与执行记录；Quartz 的集群配置也需与持久化和恢复策略一起验证。

## 参考资料

- [Spring Framework：Task Execution and Scheduling](https://docs.spring.io/spring-framework/reference/integration/scheduling.html)
- [Spring Boot：Quartz Scheduler](https://docs.spring.io/spring-boot/reference/io/quartz.html)
