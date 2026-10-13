---
title: "Redis 基础数据结构与 TTL：临时状态和 key 设计"
date: "2026-12-29"
categories: ["Redis"]
tags: [
  "Redis",
  "Java 后端",
  "缓存"
]
description: "从验证码和临时状态练习 Redis 常用结构、键前缀与过期时间边界。"
plan_date: "2024-07-30"
phase: "数据库与 Spring 基础"
---

# Redis 基础数据结构与 TTL：临时状态和 key 设计

> **计划公开日期：**2026-12-29　·　**学习阶段参考日期：**2024-07-30　·　**阶段：**数据库与 Spring 基础。参考日期表示学习路线顺序，不代表历史发文。

### 文章定位

这篇文章根据 Redis 学习资料整理常见数据类型、键名组织和过期语义。验证码代码是课程练习风格的独立示例，不代表真实线上鉴权服务。

### 学习目标

- 根据访问方式选择 String、Hash、Set 或 ZSet。
- 为临时数据设置 TTL，并正确解释 TTL 返回值。
- 用前缀区分业务 key，避免把敏感标识直接放入键名。

## 一、为什么学习这个技术

Redis 经常被用来保存缓存、验证码和短期状态。数据放进去只是第一步；还需要决定键名怎样组织、何时过期、过期后业务如何响应。临时数据如果忘记设置有效期，可能长期堆积；如果过期时间设置不合理，则可能造成误判或重复请求。

从字符串、哈希、集合和有序集合这些结构开始，重点不是记命令表，而是把数据访问模式与键的生命周期对应起来。

## 二、技术原理

Redis 的 String 适合简单值或序列化结果；Hash 适合围绕一个 key 读写多个字段；Set 适合唯一成员集合；ZSet 为成员关联分数，可按分数排序。TTL 是 key 级别的生命周期属性，不能理解成 Hash 内某个字段单独过期。

TTL 命令以秒为单位返回剩余时间。返回 -1 表示 key 存在但没有设置过期时间，返回 -2 表示 key 不存在。设置过期的 SET 命令可以同时写值和秒级过期时间，避免“先写值、后设置 TTL”之间留下无期限 key 的窗口。

## 三、核心代码实现

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

## 四、实际应用

课程项目笔记记录了 RedisService 封装、key 前缀枚举和验证码 180 秒过期等做法。这里把它抽象成一个小例子：由服务层统一生成 key，调用者只传业务场景和主体标识；读取失败时把 key 已过期、key 不存在和 Redis 连接失败分别纳入业务错误处理。

缓存、验证码、登录会话等数据的生命周期不同，不应复用一个随意命名的 key。键名可包含业务前缀、对象编号和场景，但避免把隐私数据本身放入 key。

## 五、问题记录

- **SET 与 EX 分开调用：**两条命令中间如果应用退出，可能留下没有 TTL 的 key；优先使用带过期参数的 SET。
- **把 -1 当成 key 不存在：**-1 实际表示 key 存在但无过期时间；不存在对应 -2。
- **给 Hash 字段设置 key TTL：**Redis 的过期时间应用在 key 上，字段要独立生命周期需调整数据模型。
- **只看缓存命中率：**验证码错误、超时和 Redis 不可用需要不同的错误路径。
- **使用敏感信息做 key：**键名可能出现在监控、日志和运维工具中，尽量使用内部标识并限制可见范围。

## 六、改进方向

把 TTL、最大尝试次数和限流策略放进明确的业务规则中。高并发下的一次性消费要使用原子操作或 Lua 脚本，并考虑脚本超时、Redis 集群路由和重试的幂等性。选择数据结构时也应关注 key 数量、序列化体积、查询方式与过期策略。

## 七、个人思考

Redis 的数据类型解决的是访问方式问题，TTL 解决的是生命周期问题。设计一个 key 时，我会先说清谁创建它、谁读取它、什么时候失效，以及失效时业务如何继续。

## 延伸：面试问答

### Redis TTL 返回 -1 和 -2 分别表示什么？

-1 表示 key 存在但没有过期时间；-2 表示 key 不存在。

### Redis Hash 中能单独给字段设置 TTL 吗？

常规 key 级过期语义作用于整个 Hash key。若字段需要不同生命周期，需重新设计存储结构或使用相应版本支持的专门能力。

### 为什么优先用一次带过期时间的 SET？

它把写值和设定生命周期合并为一个命令，避免分两步之间意外留下无 TTL 的 key。

## 参考资料

- [Redis：SET](https://redis.io/docs/latest/commands/set/)
- [Redis：TTL](https://redis.io/docs/latest/commands/ttl/)
