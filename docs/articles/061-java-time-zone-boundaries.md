---
title: "Java 日期时间处理：用 java.time 解决时区与区间边界"
date: "2027-05-18"
categories: ["Java 基础"]
tags: ["Java", "日期时间", "java.time", "时区"]
description: "梳理 java.time 类型选择、时区转换与日期范围查询，并说明旧日期 API 的迁移边界。"
plan_date: "2025-08-02"
phase: "Java 与并发"
---

# Java 日期时间处理：用 java.time 解决时区与区间边界

## 问题背景

旧 Java 代码常用 Date、Calendar 和 SimpleDateFormat 创建时间、执行日历运算并格式化输出。到了后端接口、数据库查询和跨时区部署，核心问题从“怎么显示”变成“这个时间究竟代表什么”。

例如用户按北京时间查询某一天的订单，服务器却部署在 UTC 环境。如果代码把“2026-05-01 00:00”直接当成机器本地时间，查询边界可能偏移八小时。报表少数据、定时任务晚执行，往往不是 SQL 写错，而是日期类型和时区语义没有约定好。

## 核心概念

先按业务含义选类型，而不是看到日期就统一使用 LocalDateTime。

| 类型 | 表达含义 | 常见用途 |
| --- | --- | --- |
| LocalDate | 年月日，不带时刻 | 生日、营业日期、报表日期 |
| LocalTime | 一天中的时间，不带日期 | 每日营业时间 |
| LocalDateTime | 本地日历中的日期和时刻，不含时区 | 用户输入的当地预约时间 |
| Instant | 时间线上的一个瞬时点，适合统一记录事件时刻 | 创建时间、审计时间、消息发生时间 |
| ZonedDateTime | 日期时间加上时区规则 | 将一个瞬时点显示为指定地区时间 |

LocalDateTime 并不能独立确定全球唯一时刻。要把“当地 9 点”变成真正的时间点，必须同时给出 ZoneId。反过来，Instant 转成北京时间或纽约时间，是同一个时刻的不同显示方式。

另一个常见区别是 Period 与 Duration：前者表达年月日这样的日历周期，后者表达秒、分钟、小时等时间长度。“一个月后”不是固定 30 天；“24 小时后”也不一定等于下一个当地日历日的同一时刻。

## 底层原理

java.time 的日期时间对象是不可变值对象。执行 plusDays 或 withHour 会返回新对象，不会修改原对象；不可变也让共享实例更容易保持线程安全。旧的 SimpleDateFormat 是可变格式器，多线程共享实例可能造成并发问题。新代码通常采用不可变的 DateTimeFormatter。

时区不只是固定偏移量。ZoneId 关联一套地区规则，规则可能因夏令时或政策调整而变化。因此服务端保存事件时刻，通常使用 Instant 或明确的 UTC 约定；面向用户展示时再转换到业务时区。只存“2026-05-01 09:00”而没有时区，无法知道它对应哪个时间点。

日期区间建议采用左闭右开：[开始时间, 结束时间)。如果用户查询北京时间 5 月 1 日，先取得当天零点，再计算次日零点；两者分别转换成 Instant。这样既能包含当天第一毫秒，也能避免猜测一天最后一毫秒是多少，数据库查询可以写成 created_at >= 起点 AND created_at < 终点。

## 代码案例

下面的示例方法把用户输入的日期解释为指定地区的自然日，再转换为可用于事件时间过滤的 Instant。格式器用严格解析，非法日期会直接失败，不会被悄悄修正。

~~~java
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.ResolverStyle;

public class DayRange {
    private static final DateTimeFormatter DATE =
            DateTimeFormatter.ofPattern("uuuu-MM-dd")
                    .withResolverStyle(ResolverStyle.STRICT);

    public static LocalDateTime[] inZone(String text, String zoneName) {
        LocalDate day = LocalDate.parse(text, DATE);
        ZoneId zone = ZoneId.of(zoneName);
        Instant from = day.atStartOfDay(zone).toInstant();
        Instant to = day.plusDays(1).atStartOfDay(zone).toInstant();
        // 本例数据库 DATETIME 列约定存 UTC，因此在持久化边界转成 UTC 本地字段
        LocalDateTime fromUtc = LocalDateTime.ofInstant(from, ZoneOffset.UTC);
        LocalDateTime toUtc = LocalDateTime.ofInstant(to, ZoneOffset.UTC);
        return new LocalDateTime[]{fromUtc, toUtc};
    }
}
~~~

应用约定也要显式写清楚。接口输出可以统一使用 UTC，页面再按用户偏好展示；数据库连接的时区行为需要结合 MySQL 列类型和 JDBC 驱动版本确认。

~~~yaml
spring:
  application:
    name: date-range-demo
  jackson:
    time-zone: UTC
~~~

这个配置能为旧 Date 类型提供默认时区；java.time 的接口格式仍应按字段类型定义清楚，例如 Instant 使用带 Z/偏移量的 ISO 格式，而 LocalDateTime 不应被误认为 UTC 瞬时点。若审计时间使用 MySQL TIMESTAMP，可约定连接会话以 UTC 读写；若使用 DATETIME，则它不携带时区，团队必须约定列中存 UTC 还是业务本地时间，不能混着写。

~~~sql
CREATE TABLE appointment (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    start_at_utc DATETIME(3) NOT NULL,
    created_at_utc DATETIME(3) NOT NULL,
    KEY idx_appointment_start_at (start_at_utc)
);

SELECT id, user_id, start_at_utc
FROM appointment
WHERE start_at_utc >= ?
  AND start_at_utc < ?
ORDER BY start_at_utc;
~~~

实际调用示例：`curl "http://localhost:8080/api/appointments?day=2026-05-01&zone=Asia%2FShanghai"`。服务端解析日期、计算边界并绑定到 SQL 参数。请求只传日期，不让前端自己拼接带偏移的起止时间，可以减少客户端与服务端时区理解不一致的机会。

## 查询日期区间

查询用户选择日期内的记录时，先确定该日期使用哪个时区，再生成左右边界并通过预编译参数查询。

设计时要确认三个问题：业务规则以用户时区还是机构时区为准；数据库保存时间点还是日历文本；接口是否对外返回带偏移量的时间。排查“少了当天记录”时，先记录接收到的原始日期、ZoneId、转换后的两个 Instant 和 JDBC 参数，再核对数据库列及连接会话时区。

定时任务也需要区分“每天当地 9 点”和“每隔 24 小时执行”。前者是日历规则，应基于 ZoneId 计算下一次触发时间；后者才是固定时长。测试时可以把 Clock 作为依赖注入，避免测试用例依赖机器当前时间。

## 常见问题
### LocalDateTime 和 Instant 有什么区别？

LocalDateTime 表示没有时区的本地日历日期时间；Instant 表示时间线上的确定时刻。LocalDateTime 需要结合 ZoneId 才能转换为 Instant。

### 查询某天的数据，为什么常用左闭右开？

一天的结束精度可能涉及秒、毫秒或微秒，写“23:59:59.999”很容易遗漏更高精度数据。用当天零点到次日零点并使用小于结束时间，可以覆盖整天且边界清楚。

### 时间相差几个小时怎么定位？

依次核对请求格式与偏移量、应用默认时区、JVM 时区、数据库列类型、数据库会话时区以及 JDBC 转换配置。不要仅通过改服务器时区来掩盖语义不清的问题。

## 设计取舍与结论

日期时间建模先区分日历日期与时间点：前者可用 `LocalDate` 表示，后者通常用 `Instant` 保存，并在展示时通过明确的 `ZoneId` 转换。数据库字段和接口格式也应遵守同一时区约定。

## 从旧日期 API 迁移到 java.time

阅读旧代码时，`Date` 更接近时间线上一个时刻，格式化和日历计算通常由其他 API 承担；`SimpleDateFormat` 是可变对象，不要把单个实例作为无保护的全局共享对象。新代码优先按业务含义选择 `java.time` 类型，尤其不要把不带时区的 `LocalDateTime` 自动当作 UTC。

~~~java
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public class DateMigrationDemo {
    public static void main(String[] args) {
        ZoneId zone = ZoneId.of("Asia/Shanghai");
        LocalDate day = LocalDate.of(2026, 3, 11);
        Instant start = day.atStartOfDay(zone).toInstant();
        Instant nextStart = day.plusDays(1).atStartOfDay(zone).toInstant();
        String display = DateTimeFormatter.ofPattern("uuuu-MM-dd")
                .format(day);
        System.out.println(display + " [" + start + ", " + nextStart + ")");
    }
}
~~~

`Calendar.add(DAY_OF_MONTH, 1)` 对应的是日历日变化；`Instant.plus(24, HOURS)` 则是固定时长，两者在夏令时切换等情形下可能不同。日期区间边界按业务 `ZoneId` 各自求次日零点，正是前文左闭右开查询的依据。

## 参考资料

- [Java SE 17 Instant API](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/time/Instant.html)
- [Java SE 17 LocalDateTime API](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/time/LocalDateTime.html)
- [Java SE 17 DateTimeFormatter API](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/time/format/DateTimeFormatter.html)
