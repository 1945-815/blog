---
title: "DAU 与 MAU：先统一活跃口径，再看留存和频率"
date: "2026-10-16"
categories: ["工程实践"]
tags: ["数据指标", "MySQL", "统计"]
description: "说明 DAU、MAU 与 DAU/MAU 比值的统计口径，并给出带时间窗口的 SQL 示例。"
plan_date: "2026-10-16"
phase: "后端工程实践"
---

# DAU 与 MAU：先统一活跃口径，再看留存和频率

## 资料范围

日活跃用户数（DAU）、月活跃用户数（MAU）和 DAU/MAU 比值都依赖明确的统计口径与时间窗口。本文使用合成表结构给出可复现 SQL，不表示真实产品数据或行业基准。

## 指标回答什么问题

- **DAU**：在定义好的自然日或业务日内，至少发生一次指定有效行为的去重用户数。
- **MAU**：在定义好的月份或滚动窗口内，至少发生一次指定有效行为的去重用户数。
- **DAU/MAU**：同一口径下某日 DAU 与一个月活跃用户数的比值，可作为使用频率或粘性的观察维度之一。

这三个指标都依赖“活跃”的定义：打开首页算不算、后台自动刷新算不算、仅登录是否算、内部测试账号和机器人是否剔除，都要在计算前确定。按设备、账号、手机号还是实名主体去重，也会改变结果。

## 时间边界要明确

本文示例定义“活跃”为至少产生一条有效事件；事件时间统一按业务时区转换后写入数据库。计算一个具体日期的 DAU，并使用该日及此前 29 天构成的滚动 30 日 MAU：

~~~sql
CREATE TABLE user_active_event (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    event_type VARCHAR(40) NOT NULL,
    event_time DATETIME NOT NULL,
    KEY idx_event_time_user (event_time, user_id)
);

SELECT
    COUNT(DISTINCT CASE
        WHEN event_time >= '2026-10-01 00:00:00'
         AND event_time <  '2026-10-02 00:00:00'
        THEN user_id
    END) AS dau,
    COUNT(DISTINCT user_id) AS mau_rolling_30d,
    COUNT(DISTINCT CASE
        WHEN event_time >= '2026-10-01 00:00:00'
         AND event_time <  '2026-10-02 00:00:00'
        THEN user_id
    END) / NULLIF(COUNT(DISTINCT user_id), 0) AS dau_mau_ratio
FROM user_active_event
WHERE event_time >= '2026-09-02 00:00:00'
  AND event_time <  '2026-10-02 00:00:00'
  AND event_type IN ('login', 'publish', 'comment');
~~~

这个查询使用左闭右开的时间区间，避免把下一天零点重复算入当天。若产品定义的是自然月 MAU，应改为自然月起止时间；不能把滚动 30 日和自然月写成同一个口径。

## 指标不能脱离产品类型

DAU/MAU 的高低受使用频率、产品类别、活跃行为和观察窗口影响。它适合在口径稳定时观察变化，不应被当作所有产品通用的质量排名，也不能单独说明用户留存原因或业务增长来源。

解释变化时应同时看 DAU、MAU、拉新、回访、留存分组和功能事件，并确认数据采集是否有延迟、重复上报或过滤规则变化。指标定义改变后，历史序列也不再能直接比较。

## 数据建模和查询注意点

- 在事件写入时统一用户标识和时间时区，保留事件类型与来源。
- 用业务认可的去重键统计，避免把同一人的多个设备重复计入。
- 对高基数、长时间范围的统计评估预聚合表或离线计算，不要默认实时扫描事件明细。
- 指标展示应附上窗口和活跃行为定义，例如“滚动 30 日活跃账号”。
- 若日志含用户信息，按最小必要原则控制访问与保留时间。

本 SQL 针对示例表结构定义统计口径，没有给出查询性能数据。索引和预聚合方式要用目标数据量与查询计划验证。
