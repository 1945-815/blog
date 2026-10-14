---
title: "Redis Lua 实现每日点赞配额：把检查和计数放进同一次操作"
date: "2027-04-20"
categories: ["Redis"]
tags: ["Redis", "Lua", "原子性", "业务计数"]
description: "用 Redis Lua 原子完成每日次数校验、计数和统计更新，并说明缓存计数持久化边界。"
plan_date: "2026-03-18"
phase: "Java 后端实习与业务实践"
---

# Redis Lua 实现每日点赞配额：把检查和计数放进同一次操作

> **计划公开日期：**2027-04-20　·　**学习阶段参考日期：**2026-03-18　·　**阶段：**Java 后端实习与业务实践。参考日期表示学习路线顺序，不代表历史发文。

## 一、为什么学习这个技术

本地旅游攻略项目笔记记录了一个具体规则：同一用户对同一攻略每天最多点赞五次，第二天重置。它看起来只是计数，但把“读取次数、判断上限、增加次数”分成多次 Redis 请求时，并发请求可能同时读到 4，然后都判断未超限，最后接受多次操作。

这个问题与验证码 TTL、缓存数据结构和分布式锁都相关，但目标不同：这里要实现的是一个有时间边界的原子状态转移。前端按钮禁用只能改善交互，不能保护后端；Java synchronized 只限制单进程；Redis 的 INCR 是原子命令，但“检查上限再加一”由多条命令组成，仍需要把整段逻辑作为一个原子操作执行。

## 二、核心概念

配额 key 需要表达业务主体、资源和日期，例如按用户、攻略 ID 与上海时区日期组成。每天上限为 5 时，key 的过期时间应落在下一个业务日开始，而不是简单设置 24 小时。用户在 23:59 创建的 key 如果固定过期 24 小时，会跨到第二天晚上才重置。

Redis Lua 脚本可以将读、条件判断、INCR、设置过期和统计加一组合成一次服务端执行。脚本执行期间 Redis 不会穿插其他命令，因此两个请求不会同时基于同一个旧计数通过检查。脚本要短小，不要在里面扫描大 key 或调用耗时外部逻辑。

配额计数与攻略总点赞数也是两个口径：前者按用户和日期限制行为，后者是所有已接受点赞的汇总。若脚本同时更新两者，就要让它们在同一次操作中成功或失败；Redis Cluster 下，多 key 脚本要求 key 落在相同 hash slot，可以使用攻略 ID 作为 hash tag。

限额脚本还应定义重复请求语义。如果客户端超时后重发同一个请求，脚本会把它视为又一次点赞；若业务要求网络重试不重复计数，需要额外引入 requestId 幂等键，并在 Redis 或持久化事件中记录处理结果。单纯限制每天最多五次并不等价于“每个点赞请求最多执行一次”。

## 三、底层原理

Lua 运行在 Redis 服务端。客户端把 key 和参数传给脚本，脚本按顺序执行 GET、INCR、EXPIREAT 和 HINCRBY。服务端串行执行脚本，避免客户端往返期间被其他请求插入。原子性解决的是 Redis 内部状态竞争，并不自动解决 Redis 与 MySQL 之间的分布式事务。

若脚本返回 -1，说明已达到上限；返回正数则表示本次被接受以及当前日计数。脚本第一次创建计数时设置统一的绝对过期时间。日期和时间戳由 Java 按业务时区计算，所有实例必须使用同一时区配置。集群中两个 key 可命名为 strategy:{攻略ID}:quota:用户ID:日期 和 strategy:{攻略ID}:stats，花括号中的部分相同，确保同槽。

## 四、代码案例

下面脚本在检查通过后增加每日配额和总统计；达到上限时不会改变任何一个 key。参数里的 expireAt 是下一个上海自然日零点的 Unix 秒时间戳。

~~~lua
local used = tonumber(redis.call('GET', KEYS[1]) or '0')
local limit = tonumber(ARGV[1])
if used >= limit then
  return -1
end
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIREAT', KEYS[1], tonumber(ARGV[2]))
end
redis.call('HINCRBY', KEYS[2], 'thumbsupnum', 1)
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
String quotaKey = "strategy:{" + strategyId + "}:quota:" + userId + ":" + today;
String statsKey = "strategy:{" + strategyId + "}:stats";
Long result = stringRedisTemplate.execute(
        script, List.of(quotaKey, statsKey), "5", Long.toString(expireAt));
if (result == null) throw new IllegalStateException("Redis quota result missing");
if (result < 0) return ThumbsupResult.dailyLimitReached();
return ThumbsupResult.accepted(result);
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
  strategy:
    daily-thumbsup-limit: 5
~~~

持久化示例沿用“Redis 保存高频统计、后台批量同步 MySQL”的学习项目思路。统计 Hash 中保存的是攻略当前累计值，重试同一批全量快照不会重复累加：

~~~sql
UPDATE ta_strategy
SET thumbsupnum = #{thumbsupnum}
WHERE id = #{strategyId};
~~~

实际调用示例：POST /api/strategies/42/thumbsup，用户 ID 从已验证的登录上下文获取，不接受客户端任意传入。达到上限返回业务码 DAILY_LIMIT_REACHED；成功后返回当天已使用次数。SQL 同步任务要记录处理进度并监控延迟；若要求更强的故障恢复能力，可增加可靠事件记录和幂等消费，不能把 Redis Lua 当成跨库事务。

## 五、项目真实落地

在企业项目中，我们通常会先确认配额的业务口径：按用户还是设备、按自然日还是滚动 24 小时、是否允许撤销、切换时区是否影响计数。教学项目的攻略点赞适合作为可复现案例，但不能据此声称个人已经把方案部署到生产环境。

高并发计数还要评估 key 数量、Redis 内存淘汰策略、持久化和主从切换。若配额 key 被淘汰，用户可能再次获得额度；如果策略 Hash 丢失，已经返回成功的统计可能无法回写。需要按数据价值决定 Redis 持久化、数据库事件或其他可靠存储方案。脚本最好固定版本并纳入代码审查，避免运行时拼接不同脚本文本。

定时同步时还要防止多个刷新任务并行覆盖：旧快照晚于新快照写入数据库，会造成短暂回退。可以保证同一攻略的刷新串行，或者给快照分配递增版本并在数据库侧只接受更新版本。任务需要记录最后成功游标、失败数量和延迟，恢复时重新处理未确认部分。Redis 的 HINCRBY 适合在线累加，但若以快照覆盖 MySQL，数据库更新要使用快照绝对值，不能把同一快照重复累加。

## 六、常见面试问题

**初级：为什么用 INCR？** INCR 在 Redis 端原子地增加整数，适合计数器，但它本身不包含“达到上限后拒绝”的判断。

**中级：为什么检查和自增要用 Lua？** 多条客户端命令之间可能穿插并发请求。Lua 将判断和更新放在 Redis 一次原子执行中，保证上限不会因并发读取旧值而被突破。

**项目：如何处理 Redis 统计写回 MySQL 的一致性？** 先说清楚这是最终一致还是要求强一致，再说明快照/事件来源、幂等方式、失败重试和恢复流程。Redis 原子不等于 Redis 与 MySQL 原子。

## 七、个人总结

作为 2027 届 Java 后端实习生，我从这个点赞例子里学到，业务规则的原子边界比“调用了 Redis”更重要。把时间口径、并发判断、统计更新和后续持久化分别讲清楚，才能判断 Lua 是否合适，也能解释方案在 Redis 故障时会留下什么影响。

## 参考资料

- [Redis INCR 命令与计数器模式](https://redis.io/docs/latest/commands/incr/)
- [Redis Lua 脚本执行语义](https://redis.io/docs/latest/develop/programmability/eval-intro/)
