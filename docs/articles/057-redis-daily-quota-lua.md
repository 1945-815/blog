---
title: "Redis Lua 实现每日点赞配额：把检查和计数放进同一次操作"
date: "2027-04-20"
categories: ["Redis"]
tags: ["Redis", "Lua", "原子性", "业务计数"]
description: "用 Redis Lua 原子完成每日次数校验、计数和统计更新，并说明缓存计数持久化边界。"
plan_date: "2026-03-18"
phase: "后端工程实践"
---

# Redis Lua 实现每日点赞配额：把检查和计数放进同一次操作

## 问题背景

若客户端分多次执行“读取当天次数、检查上限、递增次数和更新统计”，并发请求可能在检查与写入之间交错。

每条 Redis 命令本身具有原子性，但多条命令之间可能被其他请求穿插；因此并发超限请求可能让计数超过上限。若配额状态与统计更新必须作为单个 Redis 操作完成，可以评估 Lua 脚本。前端按钮禁用不能保护后端，Java `synchronized` 也只覆盖单进程。

## 核心概念

配额 key 需要表达业务主体、资源和日期，例如按用户、文档 ID 与上海时区日期组成。每天上限为 5 时，key 的过期时间应落在下一个业务日开始，而不是简单设置 24 小时。用户在 23:59 创建的 key 如果固定过期 24 小时，会跨到第二天晚上才重置。

Redis Lua 脚本可以将读、条件判断、INCR、设置过期和统计加一组合成一次服务端执行。脚本执行期间 Redis 不会穿插其他命令，因此两个请求不会同时基于同一个旧计数通过检查。脚本要短小，不要在里面扫描大 key 或调用耗时外部逻辑。

配额计数与文档总点赞数也是两个口径：前者按用户和日期限制行为，后者是所有已接受点赞的汇总。Lua 脚本执行期间不会有其他客户端命令插入，但这不等同于数据库式回滚：运行时错误发生在某条写命令之后时，之前已经执行的写入可能保留。脚本应先校验 key 类型、参数和前置条件，再尽量减少写入后的失败点；若出现部分状态，仍需设计告警和修复方式。Redis Cluster 下，多 key 脚本要求 key 落在相同 hash slot，可以使用文档 ID 作为 hash tag。

限额脚本还应定义重复请求语义。如果客户端超时后重发同一个请求，脚本会把它视为又一次点赞；若业务要求网络重试不重复计数，需要额外引入 requestId 幂等键，并在 Redis 或持久化事件中记录处理结果。单纯限制每天最多五次并不等价于“每个点赞请求最多执行一次”。

## 执行原理

Lua 运行在 Redis 服务端。客户端把 key 和参数传给脚本，脚本按顺序执行 GET、INCR、EXPIREAT 和 HINCRBY。服务端串行执行脚本，避免客户端往返期间被其他请求插入。原子性解决的是 Redis 内部状态竞争，并不自动解决 Redis 与 MySQL 之间的分布式事务。

若脚本返回 -1，说明已达到上限；返回正数则表示本次被接受以及当前日计数。脚本第一次创建计数时设置统一的绝对过期时间。日期和时间戳由 Java 按业务时区计算，所有实例必须使用同一时区配置。集群中两个 key 可命名为 document:{文档ID}:quota:用户ID:日期 和 document:{文档ID}:stats，花括号中的部分相同，确保同槽。

## 实现示例

下面是独立设计的 Lua 改造示例：先校验两把 key 的类型、参数和已有计数字段格式，再将配额检查、计数和统计更新放进一次服务端脚本执行，以避免其他客户端命令在中间插入。Redis 脚本提供隔离执行，但不提供写入回滚；如果发生 OOM 等运行时错误，不能据此假设此前的写入已撤销。该示例仍需根据部署的 Redis 版本、错误策略和数据恢复要求验证。参数里的 expireAt 是下一个业务日零点的 Unix 秒时间戳。

~~~lua
-- 在任何写入前检查 key 类型，避免常见的 WRONGTYPE 部分更新。
local quotaType = redis.call('TYPE', KEYS[1]).ok
local statsType = redis.call('TYPE', KEYS[2]).ok
if quotaType ~= 'none' and quotaType ~= 'string' then
  return redis.error_reply('quota key must be a string')
end
if statsType ~= 'none' and statsType ~= 'hash' then
  return redis.error_reply('stats key must be a hash')
end

local limit = tonumber(ARGV[1])
local expireAt = tonumber(ARGV[2])
if not limit or limit < 1 or limit % 1 ~= 0 then
  return redis.error_reply('limit must be a positive integer')
end
if not expireAt or expireAt % 1 ~= 0 then
  return redis.error_reply('expireAt must be an integer timestamp')
end

local rawUsed = redis.call('GET', KEYS[1])
local used = tonumber(rawUsed or '0')
if rawUsed and not string.match(rawUsed, '^%-?%d+$') then
  return redis.error_reply('quota value must be an integer')
end
local rawStats = redis.call('HGET', KEYS[2], 'like_count')
if rawStats and not string.match(rawStats, '^%-?%d+$') then
  return redis.error_reply('like_count must be an integer')
end

if used >= limit then
  return -1
end
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIREAT', KEYS[1], expireAt)
end
redis.call('HINCRBY', KEYS[2], 'like_count', 1)
return current
~~~

Spring Data Redis 调用示例：

~~~java
DefaultRedisScript<Long> script = new DefaultRedisScript<>();
script.setScriptText(luaText);
script.setResultType(Long.class);

ZoneId zone = ZoneId.of("Asia/Shanghai");
LocalDate today = LocalDate.now(zone);
long expireAt = today.plusDays(1).atStartOfDay(zone).toEpochSecond();
String quotaKey = "document:{" + documentId + "}:quota:" + userId + ":" + today;
String statsKey = "document:{" + documentId + "}:stats";
Long result = stringRedisTemplate.execute(
        script, List.of(quotaKey, statsKey), "5", Long.toString(expireAt));
if (result == null) throw new IllegalStateException("Redis quota result missing");
if (result < 0) return LikeResult.dailyLimitReached();
return LikeResult.accepted(result);
~~~

配置示例：

~~~yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:127.0.0.1}
      port: ${REDIS_PORT:6379}
app:
  business-zone: Asia/Shanghai
  document:
    daily-like-limit: 5
~~~

持久化示例采用“Redis 保存高频计数、后台批量同步 MySQL”的最终一致性方案。统计 Hash 中保存的是文档当前计数，重试同一批全量快照不会重复累加：

~~~sql
UPDATE document_metrics
SET like_count = #{likeCount}
WHERE document_id = #{documentId};
~~~

接口示例：`POST /api/documents/42/like`。用户 ID 应来自已验证的登录上下文，不接受客户端任意传入。达到上限时返回 `DAILY_LIMIT_REACHED`，成功时返回当天已使用次数。SQL 同步任务需记录处理进度并监控延迟；若要求更强的故障恢复能力，可增加可靠事件记录和幂等消费，不能把 Redis Lua 当成跨库事务。

## 统计写回与恢复边界

统计 Hash 保存文档当前计数；用户当天的操作次数由用户 ID、文档 ID 和业务日期组成 String key，过期时间设为下一个业务日开始。批处理读取统计快照后按文档 ID 覆盖写入 MySQL，任务需要记录进度、监控延迟并支持安全重试。

脚本、集群同槽设计和幂等键分别处理 Redis 内并发、Cluster 路由和客户端重试问题，不能混为同一保证。批量扫描还需验证任务并发、快照新旧顺序、Redis 丢失恢复与 MySQL 写入幂等性。

## 设计取舍

配额逻辑需要明确重置时区、上限语义以及超限时哪些状态保持不变。Lua 可以把 Redis 内的多步状态更新合并执行，但不提供 Redis 与 MySQL 之间的跨库事务。

## 参考资料

- [Redis INCR 命令与计数器模式](https://redis.io/docs/latest/commands/incr/)
- [Redis Lua 脚本执行说明](https://redis.io/docs/latest/develop/programmability/eval-intro/)
- [Redis 对事务回滚的说明](https://redis.io/blog/you-dont-need-transaction-rollbacks-in-redis/)
- [Redis Lua 脚本执行语义](https://redis.io/docs/latest/develop/programmability/eval-intro/)
