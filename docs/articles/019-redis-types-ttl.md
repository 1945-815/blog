---
title: "Redis 基础数据结构与 TTL：临时状态和 key 设计"
date: "2026-12-29"
categories: ["Redis"]
tags: [
  "Redis",
  "Java 后端",
  "缓存"
]
description: "通过验证码和临时状态说明 Redis 常用结构、键前缀与过期时间边界。"
plan_date: "2024-07-30"
phase: "Spring 与数据持久化"
---

# Redis 基础数据结构与 TTL：临时状态和 key 设计

## 问题背景

Redis 经常被用来保存缓存、验证码和短期状态。数据放进去只是第一步；还需要决定键名怎样组织、何时过期、过期后业务如何响应。临时数据如果忘记设置有效期，可能长期堆积；如果过期时间设置不合理，则可能造成误判或重复请求。

Redis 包含字符串、哈希、集合和有序集合等结构，重点不是记命令表，而是把数据访问模式与键的生命周期对应起来。

## 核心原理

Redis 的 String 适合简单值或序列化结果；Hash 适合围绕一个 key 读写多个字段；Set 适合唯一成员集合；ZSet 为成员关联分数，可按分数排序。TTL 是 key 级别的生命周期属性，不能理解成 Hash 内某个字段单独过期。

TTL 命令以秒为单位返回剩余时间。返回 -1 表示 key 存在但没有设置过期时间，返回 -2 表示 key 不存在。设置过期的 SET 命令可以同时写值和秒级过期时间，避免“先写值、后设置 TTL”之间留下无期限 key 的窗口。

## 实现示例

Redis 命令行小例子：

~~~text
SET verify:signup:subject-7 381204 EX 180
TTL verify:signup:subject-7
GET verify:signup:subject-7

HSET profile:7 displayName 小林 status active
SADD article:42:readers user-7 user-8
ZADD ranking:weekly 18.5 article-42
~~~

下面是 Spring Data Redis 的保存与读取示例。把类保存为 VerificationCodeStore.java 放入启用了 Redis 自动配置的 Spring Boot 项目，并加入 Spring Data Redis starter。subjectId 应是项目内经过设计的非敏感标识；不要把手机号、验证码或令牌直接写入日志。

~~~java
import java.time.Duration;
import java.util.concurrent.TimeUnit;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class VerificationCodeStore {
    private final StringRedisTemplate redisTemplate;

    public VerificationCodeStore(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void save(String scene, String subjectId, String code) {
        String key = key(scene, subjectId);
        // value 与 180 秒 TTL 在同一次 SET 中写入。
        redisTemplate.opsForValue().set(key, code, Duration.ofSeconds(180));
    }

    public String find(String scene, String subjectId) {
        return redisTemplate.opsForValue().get(key(scene, subjectId));
    }

    public Long ttlSeconds(String scene, String subjectId) {
        return redisTemplate.getExpire(key(scene, subjectId), TimeUnit.SECONDS);
    }

    private String key(String scene, String subjectId) {
        if (scene == null || !scene.matches("[a-zA-Z0-9_-]{1,32}")) {
            throw new IllegalArgumentException("scene 格式不正确");
        }
        if (subjectId == null || subjectId.isBlank() || subjectId.length() > 80) {
            throw new IllegalArgumentException("subjectId 格式不正确");
        }
        return "verify:" + scene + ":" + subjectId;
    }
}
~~~

find 只演示读取，不实现“校验并一次性消费”。如果要求验证码只能成功使用一次，单独 GET 后再 DEL 会有并发窗口，应根据 Redis 版本和序列化方式设计原子校验与删除。完整业务还要校验次数、用途、主体身份和频率限制。

## 统计、集合与消息补偿的结构选择


| 业务数据 | Redis 结构 | 读写方式 | 生命周期或边界 |
| --- | --- | --- | --- |
| 单篇文档的阅读、评论、收藏和点赞统计 | Hash | 以文档 ID 组成统计 key，用 `HINCRBY` 更新字段 | 统计 Hash 不设 TTL；由后台任务批量同步 MySQL |
| 用户收藏的文档 ID | Set | 用户 ID 组成集合 key，成员为文档 ID；成员存在时取消，否则添加 | 空 Set 会在最后一个成员移除后删除；不应添加会污染业务语义的占位值 |
| 用户对单篇文档当天的点赞次数 | String | 按文档 ID、用户 ID 和日期组成 key，用 `INCR` 计数 | 在业务日边界过期；超过上限不增加文档点赞统计 |
| MQ 未确认消息补偿 | ZSet | 发送前暂存待确认事件，消费成功后删除；定时任务按创建时间查询超时成员并重发 | 超时重试可能产生重复投递，仍需消费幂等与故障恢复设计 |

Set 不需要为了防止空集合删除而增加虚构成员；最后一个成员移除后 key 消失是 Redis 的正常行为。点赞配额实现见[Redis 每日点赞配额](./057-redis-daily-quota-lua.md)。

## Key 命名与生命周期

统计、关系集合、验证码和登录会话的数据生命周期不同，不应复用随意命名的 key。键名可包含业务前缀、对象编号和场景，但避免把隐私数据本身放入 key。

## 问题记录

- **SET 与 EX 分开调用：**两条命令中间如果应用退出，可能留下没有 TTL 的 key；优先使用带过期参数的 SET。
- **把 -1 当成 key 不存在：**-1 实际表示 key 存在但无过期时间；不存在对应 -2。
- **给 Hash 字段设置 key TTL：**Redis 的过期时间应用在 key 上，字段要独立生命周期需调整数据模型。
- **只看缓存命中率：**验证码错误、超时和 Redis 不可用需要不同的错误路径。
- **使用敏感信息做 key：**键名可能出现在监控、日志和运维工具中，尽量使用内部标识并限制可见范围。

## 改进方向

把 TTL、最大尝试次数和限流策略放进明确的业务规则中。高并发下的一次性消费要使用原子操作或 Lua 脚本，并考虑脚本超时、Redis 集群路由和重试的幂等性。选择数据结构时也应关注 key 数量、序列化体积、查询方式与过期策略。

## 个人思考

Redis 的数据类型解决的是访问方式问题，TTL 解决的是生命周期问题。设计一个 key 时，先明确创建方、读取方、失效时间，以及过期后业务如何继续。

## 常见问题

### Redis TTL 返回 -1 和 -2 分别表示什么？

-1 表示 key 存在但没有过期时间；-2 表示 key 不存在。

### Redis Hash 中能单独给字段设置 TTL 吗？

常规 key 级过期语义作用于整个 Hash key。若字段需要不同生命周期，需重新设计存储结构或使用相应版本支持的专门能力。

### 为什么优先用一次带过期时间的 SET？

它把写值和设定生命周期合并为一个命令，避免分两步之间意外留下无 TTL 的 key。

## 参考资料

- [Redis：SET](https://redis.io/docs/latest/commands/set/)
- [Redis：TTL](https://redis.io/docs/latest/commands/ttl/)
